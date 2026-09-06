import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { CommunityClient } from '@/components/CommunityClient'
import { BrandHeading } from '@/components/BrandHeading'

export default async function CommunityPage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .neq('id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const usersWithCounts = await Promise.all(
    (users || []).map(async (user: Record<string, unknown>) => {
      const { count: followerCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id as string)

      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id as string)

      return {
        ...user,
        followers_count: followerCount || 0,
        following_count: followingCount || 0,
      }
    })
  )

  const { data: following } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', session.user.id)

  const followingIds = following?.map((f: { following_id: string }) => f.following_id) || []

  const { data: followRequests } = await supabase
    .from('follow_requests')
    .select('target_id, status')
    .eq('requester_id', session.user.id)

  const requestStatusMap = Object.fromEntries(
    (followRequests || []).map((req: { target_id: string; status: string }) => [req.target_id, req.status])
  )

  const followingSet = followingIds.join(',')
  const { data: suggested } =
    followingIds.length > 0
      ? await supabase
          .from('profiles')
          .select('*')
          .neq('id', session.user.id)
          .neq('username', 'demo_user')
          .not('id', 'in', `(${followingSet})`)
          .order('followers_count', { ascending: false })
          .limit(10)
      : await supabase
          .from('profiles')
          .select('*')
          .neq('id', session.user.id)
          .neq('username', 'demo_user')
          .order('followers_count', { ascending: false })
          .limit(10)

  let initialGroups: Record<string, unknown>[] = []

  try {
    const sb = supabase as any
    const { data: memberRows } = await sb.from('lifting_group_members').select('group_id').eq('user_id', session.user.id)

    const gids = [...new Set((memberRows || []).map((r: { group_id: string }) => r.group_id))]
    if (gids.length) {
      const { data: groups } = await sb
        .from('lifting_groups')
        .select(
          `*,
          lifting_group_members (
            user_id,
            profiles:user_id (username, avatar_url, full_name)
          )`
        )
        .in('id', gids)

      initialGroups = (groups || []).map((g: Record<string, unknown>) => {
        const raw = (g.lifting_group_members as Record<string, unknown>[]) || []
        const members = raw.map((m) => {
          let profiles = m.profiles
          if (Array.isArray(profiles)) profiles = profiles[0] ?? null
          return { user_id: m.user_id, profiles }
        })
        const { lifting_group_members: _, ...rest } = g
        return { ...rest, members }
      })
    }
  } catch {
    initialGroups = []
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-14 bg-black">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <BrandHeading variant="page">Community</BrandHeading>
          <p className="ui-subtitle mt-2">Groups, find people, and training challenges.</p>
        </div>

        <CommunityClient
          currentUserId={session.user.id}
          initialUsers={usersWithCounts || []}
          suggestedUsers={suggested || []}
          followingIds={followingIds}
          requestStatusMap={requestStatusMap}
          initialGroups={initialGroups}
        />
      </div>
    </div>
  )
}

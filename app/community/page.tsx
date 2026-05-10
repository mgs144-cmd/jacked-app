import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { CommunityClient } from '@/components/CommunityClient'

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

  let friendsProfiles: Record<string, unknown>[] = []
  if (followingIds.length) {
    const { data: fp } = await supabase.from('profiles').select('*').in('id', followingIds)
    const withCounts = await Promise.all(
      (fp || []).map(async (row: Record<string, unknown>) => {
        const { count } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', row.id as string)
        return { ...row, followers_count: count || 0, following_count: 0 }
      })
    )
    friendsProfiles = withCounts
  }

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
  let initialGroupChallenges: Record<string, unknown>[] = []

  try {
    const sb = supabase as any
    const { data: memberRows } = await sb.from('lifting_group_members').select('group_id').eq('user_id', session.user.id)

    const gids = [...new Set((memberRows || []).map((r: { group_id: string }) => r.group_id))]
    if (gids.length) {
      const { data: groups } = await sb.from('lifting_groups').select('*').in('id', gids)
      initialGroups = groups || []
      const { data: challenges } = await sb
        .from('group_challenges')
        .select('*, challenge_updates(*)')
        .in('group_id', gids)
      initialGroupChallenges = challenges || []
    }
  } catch {
    initialGroups = []
    initialGroupChallenges = []
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-14 bg-black">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white tracking-tight">Community</h1>
          <p className="text-[#a1a1a1] text-sm mt-0.5">Friends, groups, challenges, and group chat.</p>
        </div>

        <CommunityClient
          currentUserId={session.user.id}
          initialUsers={usersWithCounts || []}
          suggestedUsers={suggested || []}
          followingIds={followingIds}
          requestStatusMap={requestStatusMap}
          friendsProfiles={friendsProfiles}
          initialGroups={initialGroups}
          initialGroupChallenges={initialGroupChallenges}
        />
      </div>
    </div>
  )
}

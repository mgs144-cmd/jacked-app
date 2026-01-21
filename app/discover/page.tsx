import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { UserCard } from '@/components/UserCard'
import { DiscoverClient } from '@/components/DiscoverClient'
import { TrendingUp, Users } from 'lucide-react'

export default async function DiscoverPage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  // Get all users except current user
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .neq('id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  // Calculate actual follower/following counts for each user
  const usersWithCounts = await Promise.all((users || []).map(async (user: any) => {
    const { count: followerCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user.id)

    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user.id)

    return {
      ...user,
      followers_count: followerCount || 0,
      following_count: followingCount || 0,
    }
  }))

  // Get users the current user is following
  const { data: following } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', session.user.id)

  const followingIds = following?.map((f: any) => f.following_id) || []

  // Get follow request statuses
  const { data: followRequests } = await supabase
    .from('follow_requests')
    .select('target_id, status')
    .eq('requester_id', session.user.id)

  const requestStatusMap = Object.fromEntries(
    (followRequests || []).map((req: any) => [req.target_id, req.status])
  )

  // Get suggested users (users with most followers that current user doesn't follow)
  const { data: suggested } = await supabase
    .from('profiles')
    .select('*')
    .neq('id', session.user.id)
    .not('id', 'in', `(${followingIds.join(',') || 'null'})`)
    .order('followers_count', { ascending: false })
    .limit(10)

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-16">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 pb-6 border-b border-default">
          <div className="flex items-center space-x-2.5 mb-2">
            <Users className="w-6 h-6 text-red-600" />
            <h1 className="text-2xl font-semibold text-primary tracking-tight">Discover</h1>
          </div>
          <p className="text-secondary text-sm">Find and follow other lifters</p>
        </div>

        {/* Search and User Lists */}
        <DiscoverClient
          currentUserId={session.user.id}
          initialUsers={usersWithCounts || []}
          suggestedUsers={suggested || []}
          followingIds={followingIds}
          requestStatusMap={requestStatusMap}
        />
      </div>
    </div>
  )
}



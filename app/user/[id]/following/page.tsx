import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { UserCard } from '@/components/UserCard'
import { Users } from 'lucide-react'

export default async function FollowingPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!profile) {
    redirect('/feed')
  }

  const profileData = profile as any

  // Get following
  const { data: following } = await supabase
    .from('follows')
    .select(`
      following_id,
      profiles:following_id(username, avatar_url, full_name, is_premium, bio)
    `)
    .eq('follower_id', params.id)

  // Get current user's following list
  const { data: currentUserFollowing } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', session.user.id)

  const followingIds = currentUserFollowing?.map((f: any) => f.following_id) || []

  // Get follow request statuses
  const { data: followRequests } = await supabase
    .from('follow_requests')
    .select('target_id, status')
    .eq('requester_id', session.user.id)

  const requestStatusMap = Object.fromEntries(
    (followRequests || []).map((req: any) => [req.target_id, req.status])
  )

  // Calculate follower counts for each user
  const followingWithCounts = await Promise.all((following || []).map(async (follow: any) => {
    const userId = follow.following_id
    let userProfile = follow.profiles
    if (Array.isArray(userProfile)) {
      userProfile = userProfile[0] || null
    }

    const { count: followerCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId)

    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId)

    return {
      ...userProfile,
      id: userId,
      followers_count: followerCount || 0,
      following_count: followingCount || 0,
    }
  }))

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-24">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-3">
            <Users className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-black text-white tracking-tight">
              {profileData.username || profileData.full_name || 'User'}&apos;s Following
            </h1>
          </div>
        </div>

        {followingWithCounts.length > 0 ? (
          <div className="space-y-4">
            {followingWithCounts.map((user: any) => (
              <UserCard
                key={user.id}
                user={user}
                currentUserId={session.user.id}
                isFollowing={followingIds.includes(user.id)}
                isPrivateAccount={user.is_account_private || false}
                requestStatus={requestStatusMap[user.id] || 'none'}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-800/60 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-400 font-semibold">Not following anyone yet</p>
          </div>
        )}
      </div>
    </div>
  )
}


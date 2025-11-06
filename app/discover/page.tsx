import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { UserCard } from '@/components/UserCard'
import { Search, TrendingUp, Users } from 'lucide-react'

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
    <div className="min-h-screen pb-20 md:pb-0 md:pt-24">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-3">
            <Users className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-black text-white tracking-tight">Discover</h1>
          </div>
          <p className="text-gray-400 font-medium">Find and follow other lifters</p>
        </div>

        {/* Search Bar (placeholder for future) */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search users..."
              className="input-field w-full pl-12"
              disabled
            />
          </div>
          <p className="text-xs text-gray-600 mt-2 font-medium">Search coming soon!</p>
        </div>

        {/* Suggested Users */}
        {suggested && suggested.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center space-x-3 mb-6">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-black text-white tracking-tight">Suggested For You</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggested.map((user: any) => (
                <UserCard 
                  key={user.id} 
                  user={user} 
                  currentUserId={session.user.id}
                  isFollowing={false}
                  isPrivateAccount={user.is_account_private || false}
                  requestStatus={requestStatusMap[user.id] || 'none'}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Users */}
        <div>
          <div className="flex items-center space-x-3 mb-6">
            <Users className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-black text-white tracking-tight">All Users</h2>
          </div>
          {users && users.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {users.map((user: any) => (
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
            <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800/60 p-12 text-center card-elevated">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg font-semibold">No users found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}



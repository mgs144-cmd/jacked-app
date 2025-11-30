import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { PostCard } from '@/components/PostCard'
import { DeadcemberLogForm } from '@/components/DeadcemberLogForm'
import { DeadcemberPRTracker } from '@/components/DeadcemberPRTracker'
import { Trophy, TrendingUp } from 'lucide-react'

export default async function DeadcemberPage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  // Get global Deadcember total
  const { data: globalTotal } = await (supabase.rpc as any)('get_global_deadcember_total')
  const globalTotalNum = globalTotal || 0
  const goal = 1000000
  const progress = Math.min((globalTotalNum / goal) * 100, 100)

  // Get user's Deadcember total
  const { data: userTotal } = await (supabase.rpc as any)('get_user_deadcember_total', {
    p_user_id: session.user.id,
  })
  const userTotalNum = userTotal || 0

  // Get Deadcember posts (public + from users you follow)
  const { data: following } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', session.user.id)

  const followingIds = following?.map((f: any) => f.following_id) || []

  // Get public Deadcember posts
  const { data: publicPosts } = await supabase
    .from('posts')
    .select(`
      *,
      profile:profiles!posts_user_id_fkey(*)
    `)
    .eq('is_deadcember_post', true)
    .eq('is_private', false)
    .order('created_at', { ascending: false })
    .limit(50)

  // Get private Deadcember posts from users you follow
  const { data: privatePosts } = followingIds.length > 0
    ? await supabase
        .from('posts')
        .select(`
          *,
          profile:profiles!posts_user_id_fkey(*)
        `)
        .eq('is_deadcember_post', true)
        .eq('is_private', true)
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(50)
    : { data: [] }

  const allPosts = [...(publicPosts || []), ...(privatePosts || [])]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-24">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <span className="text-4xl">💀</span>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">DEADCEMBER</h1>
          </div>
          <p className="text-gray-400 font-medium">December Deadlift & RDL Volume Challenge</p>
        </div>

        {/* Global Progress */}
        <div className="bg-gradient-to-br from-red-950/30 via-gray-900/60 to-gray-900/60 backdrop-blur-sm rounded-2xl border-2 border-primary/50 p-6 mb-8 glow-red-sm">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-black text-white">Community Goal: 1,000,000 lbs</h2>
          </div>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 font-bold text-sm">Total Lifted</span>
              <span className="text-primary font-black text-2xl">{globalTotalNum.toLocaleString()} lbs</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-primary h-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-gray-500 text-xs">{progress.toFixed(1)}% Complete</span>
              <span className="text-gray-500 text-xs">
                {(goal - globalTotalNum).toLocaleString()} lbs to go
              </span>
            </div>
          </div>
        </div>

        {/* User's Personal Total */}
        {userTotalNum > 0 && (
          <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800/60 p-6 mb-8">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Trophy className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-black text-white">Your Deadcember Total</h3>
            </div>
            <p className="text-center text-3xl font-black text-primary">{userTotalNum.toLocaleString()} lbs</p>
          </div>
        )}

        {/* PR Tracker */}
        <div className="mb-8">
          <DeadcemberPRTracker />
        </div>

        {/* Log Form */}
        <div className="mb-10">
          <DeadcemberLogForm />
        </div>

        {/* Deadcember Feed */}
        <div className="mb-6">
          <h2 className="text-2xl font-black text-white mb-6">Deadcember Feed</h2>
          {allPosts.length > 0 ? (
            <div className="space-y-6">
              {allPosts.map((post: any) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800/60 p-12 text-center">
              <span className="text-6xl mb-4 block">💀</span>
              <p className="text-gray-400 text-lg font-semibold">No Deadcember posts yet</p>
              <p className="text-gray-500 text-sm mt-2">Be the first to log a workout!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


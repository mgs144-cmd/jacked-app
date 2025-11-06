import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { PostCard } from '@/components/PostCard'
import { TrendingUp, Flame } from 'lucide-react'

export default async function FeedPage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  // Get users the current user is following
  const { data: following } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', session.user.id)

  const followingIds = following?.map((f: any) => f.following_id) || []
  
  // 1. Get posts from followed users (prioritized)
  const { data: followingPosts } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id(username, avatar_url, full_name, is_premium, is_account_private),
      likes(count),
      comments(count)
    `)
    .in('user_id', [...followingIds, session.user.id])
    .order('created_at', { ascending: false })
    .limit(30)

  // 2. Get public posts from non-followed users
  const { data: publicPosts } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id(username, avatar_url, full_name, is_premium, is_account_private),
      likes(count),
      comments(count)
    `)
    .not('user_id', 'in', `(${[session.user.id, ...followingIds].join(',')})`)
    .eq('is_private', false)
    .order('created_at', { ascending: false })
    .limit(20)

  // Combine: following posts first, then public posts
  const posts = [...(followingPosts || []), ...(publicPosts || [])]

  const postsWithCounts = posts?.map((post: any) => ({
    ...post,
    like_count: post.likes?.length || 0,
    comment_count: post.comments?.length || 0,
  }))

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-24">
      <Navbar />
      
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
                Your Feed
              </h1>
              <p className="text-gray-400 font-medium">
                See what the community is lifting
              </p>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-primary rounded-xl glow-red-sm">
              <Flame className="w-5 h-5 text-white" />
              <span className="text-white font-bold text-sm">LIVE</span>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex items-center space-x-4 p-4 bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800/60">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-gray-500 font-semibold tracking-wide">TOTAL POSTS</p>
                <p className="text-xl font-black text-white">{postsWithCounts?.length || 0}</p>
              </div>
            </div>
            <div className="h-10 w-px bg-gray-800"></div>
            <div>
              <p className="text-xs text-gray-500 font-semibold tracking-wide">COMMUNITY</p>
              <p className="text-xl font-black text-white">Growing</p>
            </div>
          </div>
        </div>


        {/* Posts */}
        {!postsWithCounts || postsWithCounts.length === 0 ? (
          <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800/60 p-12 text-center card-elevated">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
              <Flame className="w-10 h-10 text-gray-600" />
            </div>
            <p className="text-gray-400 text-lg font-semibold mb-2">No posts yet</p>
            <p className="text-gray-600 text-sm">Be the first to share your progress!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {postsWithCounts.map((post: any) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* Load more indicator */}
        {postsWithCounts && postsWithCounts.length >= 50 && (
          <div className="mt-8 text-center">
            <button className="btn-secondary px-8 py-3">
              <span className="font-bold">LOAD MORE</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

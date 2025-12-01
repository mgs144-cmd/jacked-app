import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { FeedClient } from '@/components/FeedClient'

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
      likes(id),
      comments(id),
      workout_exercises(*)
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
      likes(id),
      comments(id),
      workout_exercises(*)
    `)
    .not('user_id', 'in', `(${[session.user.id, ...followingIds].join(',')})`)
    .eq('is_private', false)
    .order('created_at', { ascending: false })
    .limit(20)

  // Combine: following posts first, then public posts
  const posts = [...(followingPosts || []), ...(publicPosts || [])]

  const postsWithCounts = posts?.map((post: any) => {
    // Ensure profile data is properly extracted (handle array or object)
    let profile = post.profiles
    if (Array.isArray(profile)) {
      profile = profile[0] || null
    }
    
    return {
      ...post,
      profile: profile, // Normalize to single object
      like_count: post.likes?.length || 0,
      comment_count: post.comments?.length || 0,
    }
  })

  const followingPostsWithCounts = followingPosts?.map((post: any) => {
    let profile = post.profiles
    if (Array.isArray(profile)) {
      profile = profile[0] || null
    }
    return {
      ...post,
      profile: profile,
      like_count: Array.isArray(post.likes) ? post.likes.length : 0,
      comment_count: Array.isArray(post.comments) ? post.comments.length : 0,
    }
  }) || []

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-24">
      <Navbar />
      <FeedClient
        allPosts={postsWithCounts || []}
        followingPosts={followingPostsWithCounts}
        publicPosts={publicPosts?.map((post: any) => {
          let profile = post.profiles
          if (Array.isArray(profile)) {
            profile = profile[0] || null
          }
          return {
            ...post,
            profile: profile,
            like_count: Array.isArray(post.likes) ? post.likes.length : 0,
            comment_count: Array.isArray(post.comments) ? post.comments.length : 0,
          }
        }) || []}
      />
    </div>
  )
}

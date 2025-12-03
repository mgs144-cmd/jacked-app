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
  
  // 1. Get posts from followed users (prioritized) - exclude archived
  const { data: followingPosts } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id(username, avatar_url, full_name, is_premium, is_account_private),
      likes(id),
      comments(id, content, created_at, user_id, profiles:user_id(username, avatar_url)),
      workout_exercises(*)
    `)
    .in('user_id', [...followingIds, session.user.id])
    .or(`is_archived.is.null,is_archived.eq.false`)
    .order('created_at', { ascending: false })
    .limit(30)

  // 2. Get public posts from non-followed users - exclude archived
  const { data: publicPosts } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id(username, avatar_url, full_name, is_premium, is_account_private),
      likes(id),
      comments(id, content, created_at, user_id, profiles:user_id(username, avatar_url)),
      workout_exercises(*)
    `)
    .not('user_id', 'in', `(${[session.user.id, ...followingIds].join(',')})`)
    .eq('is_private', false)
    .or('is_archived.is.null,is_archived.eq.false')
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
    
    // Get top 3 comments (most recent)
    const allComments = post.comments || []
    const topComments = allComments
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3)
      .map((comment: any) => {
        let commentProfile = comment.profiles
        if (Array.isArray(commentProfile)) {
          commentProfile = commentProfile[0] || null
        }
        return {
          ...comment,
          profile: commentProfile || { username: 'unknown', avatar_url: null }
        }
      })
    
    return {
      ...post,
      profile: profile, // Normalize to single object
      like_count: post.likes?.length || 0,
      comment_count: allComments.length,
      top_comments: topComments,
    }
  })

  const followingPostsWithCounts = followingPosts?.map((post: any) => {
    let profile = post.profiles
    if (Array.isArray(profile)) {
      profile = profile[0] || null
    }
    
    // Get top 3 comments
    const allComments = post.comments || []
    const topComments = allComments
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3)
      .map((comment: any) => {
        let commentProfile = comment.profiles
        if (Array.isArray(commentProfile)) {
          commentProfile = commentProfile[0] || null
        }
        return {
          ...comment,
          profile: commentProfile || { username: 'unknown', avatar_url: null }
        }
      })
    
    return {
      ...post,
      profile: profile,
      like_count: Array.isArray(post.likes) ? post.likes.length : 0,
      comment_count: allComments.length,
      top_comments: topComments,
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
          
          // Get top 3 comments
          const allComments = post.comments || []
          const topComments = allComments
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 3)
            .map((comment: any) => {
              let commentProfile = comment.profiles
              if (Array.isArray(commentProfile)) {
                commentProfile = commentProfile[0] || null
              }
              return {
                ...comment,
                profile: commentProfile || { username: 'unknown', avatar_url: null }
              }
            })
          
          return {
            ...post,
            profile: profile,
            like_count: Array.isArray(post.likes) ? post.likes.length : 0,
            comment_count: allComments.length,
            top_comments: topComments,
          }
        }) || []}
      />
    </div>
  )
}

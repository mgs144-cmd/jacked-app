import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { PostCard } from '@/components/PostCard'
import { ClipboardList, Plus } from 'lucide-react'

export default async function LogPage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  // Get only log-only posts for the current user (RLS ensures only author sees these)
  const { data: logPosts } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id(username, avatar_url, full_name, is_premium, is_account_private),
      likes(id),
      comments(id, content, created_at, user_id, profiles:user_id(username, avatar_url)),
      workout_exercises(*)
    `)
    .eq('user_id', session.user.id)
    .eq('is_log_only', true)
    .or('is_archived.is.null,is_archived.eq.false')
    .order('created_at', { ascending: false })

  const postsWithCounts = logPosts?.map((post: any) => {
    let profile = post.profiles
    if (Array.isArray(profile)) {
      profile = profile[0] || null
    }
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
      like_count: post.likes?.length || 0,
      comment_count: allComments.length,
      top_comments: topComments,
    }
  }) || []

  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pt-14 bg-[#121212]">
      <Navbar />
      
      <div className="w-full max-w-[640px] mx-auto px-4 md:px-5 pt-4 pb-5 sm:pb-6 md:py-8 min-w-0">
        <div className="text-left mb-5">
          <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-[#ff5555]" />
            Log
          </h1>
          <p className="text-[#a1a1a1] text-sm mt-1">
            Your private training log. Track progress without posting to feeds.
          </p>
        </div>

        {!postsWithCounts || postsWithCounts.length === 0 ? (
          <div className="rounded-lg md:rounded-xl border border-white/5 bg-[#1a1a1a] p-8 sm:p-12 text-center" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <p className="text-[#a1a1a1] font-medium mb-2">
              No log entries yet
            </p>
            <p className="text-[#6b6b6b] text-sm mb-6">
              Create a post and choose &quot;Log&quot; visibility to track your workouts privately.
            </p>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff5555] hover:bg-[#ff4444] text-white font-bold rounded-xl transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Log Entry
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {postsWithCounts.map((post: any) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

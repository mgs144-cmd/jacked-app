import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { FeedClient } from '@/components/FeedClient'
import { Trophy } from 'lucide-react'

export default async function DeadcemberPage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  // Get Deadcember posts ordered by volume (highest first)
  const { data: deadcemberPosts } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id(username, avatar_url, full_name, is_premium, is_account_private),
      likes(id),
      comments(id),
      workout_exercises(*)
    `)
    .eq('is_deadcember_post', true)
    .order('deadcember_volume', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(50)

  const postsWithCounts = deadcemberPosts?.map((post: any) => {
    let profile = post.profiles
    if (Array.isArray(profile)) {
      profile = profile[0] || null
    }
    
    return {
      ...post,
      profile: profile,
      like_count: post.likes?.length || 0,
      comment_count: post.comments?.length || 0,
    }
  }) || []

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-24">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-3">
            <span className="text-4xl">💀</span>
            <Trophy className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-black text-white tracking-tight">Deadcember</h1>
          </div>
          <p className="text-gray-400 font-medium">The heaviest lifts of December</p>
        </div>

        {/* Posts */}
        {postsWithCounts.length > 0 ? (
          <FeedClient 
            allPosts={postsWithCounts}
            followingPosts={[]}
            publicPosts={postsWithCounts}
          />
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-800/60 rounded-full flex items-center justify-center">
              <Trophy className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-400 font-semibold">No Deadcember posts yet</p>
            <p className="text-gray-600 text-sm mt-1">Start posting your heaviest lifts!</p>
          </div>
        )}
      </div>
    </div>
  )
}


import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { FeedClient } from '@/components/FeedClient'
import Link from 'next/link'
import { PlusCircle } from 'lucide-react'
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
    .or('is_archived.is.null,is_archived.eq.false')
    .order('deadcember_volume', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(50)

  // Get ALL Deadcember posts for community total (not just the limited 50)
  const { data: allDeadcemberPosts } = await supabase
    .from('posts')
    .select('deadcember_volume')
    .eq('is_deadcember_post', true)
    .or('is_archived.is.null,is_archived.eq.false')
    .not('deadcember_volume', 'is', null)

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

  // Calculate community total from ALL Deadcember posts (not just the 50 shown)
  const communityTotal = allDeadcemberPosts?.reduce((sum, post: any) => {
    return sum + (post.deadcember_volume || 0)
  }, 0) || 0

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-24">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center space-x-3 mb-2 md:mb-3">
            <Trophy className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Deadcember</h1>
          </div>
          <p className="text-gray-400 font-medium text-sm md:text-base">The heaviest lifts of December</p>
        </div>

        {/* Community Total Card */}
        {communityTotal > 0 && (
          <div className="mb-6 md:mb-8 bg-gradient-to-br from-red-950/40 to-gray-900/60 backdrop-blur-sm rounded-xl md:rounded-2xl border-2 border-primary/40 p-4 md:p-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <Trophy className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  <h2 className="text-lg md:text-2xl font-black text-white">Community Total</h2>
                </div>
                <p className="text-xs md:text-sm text-gray-400">Combined weight lifted by all lifters</p>
              </div>
              <div className="text-right">
                <p className="text-3xl md:text-4xl font-black text-primary tabular-nums">
                  {communityTotal.toLocaleString()}
                </p>
                <p className="text-sm md:text-base text-gray-500 font-bold">lbs</p>
              </div>
            </div>
          </div>
        )}

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

      {/* Floating Action Button for Creating Deadcember Post */}
      <Link
        href="/create?deadcember=true"
        className="fixed bottom-24 right-4 md:bottom-8 md:right-8 w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:shadow-3xl transition-all z-40 group hover:scale-110 active:scale-95"
        aria-label="Create Deadcember Post"
      >
        <PlusCircle className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
      </Link>
    </div>
  )
}


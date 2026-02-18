import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { LogClient } from '@/components/LogClient'

export default async function LogPage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  // Fetch lift logs (standalone entries, not from posts)
  let liftLogs: any[] = []
  let liftGoals: any[] = []

  try {
    const { data: logs } = await supabase
      .from('lift_logs')
      .select('*')
      .eq('user_id', session.user.id)
      .order('logged_at', { ascending: false })
      .limit(200)

    liftLogs = logs || []

    const { data: goals } = await supabase
      .from('lift_goals')
      .select('*')
      .eq('user_id', session.user.id)

    liftGoals = goals || []
  } catch (e) {
    // Tables may not exist yet - user needs to run ADD_LIFT_LOG_ANALYTICS.sql
    console.warn('lift_logs or lift_goals tables may not exist yet:', e)
  }

  // Also fetch log-only posts for display
  const { data: logPosts } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id(username, avatar_url, full_name),
      likes(id),
      comments(id),
      workout_exercises(*)
    `)
    .eq('user_id', session.user.id)
    .eq('is_log_only', true)
    .or('is_archived.is.null,is_archived.eq.false')
    .order('created_at', { ascending: false })

  const postsWithCounts = logPosts?.map((post: any) => {
    let profile = post.profiles
    if (Array.isArray(profile)) profile = profile[0] || null
    return {
      ...post,
      profile,
      like_count: post.likes?.length || 0,
      comment_count: post.comments?.length || 0,
      top_comments: [],
    }
  }) || []

  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pt-14 bg-[#121212]">
      <Navbar />
      <LogClient
        liftLogs={liftLogs}
        liftGoals={liftGoals}
        logPosts={postsWithCounts}
        userId={session.user.id}
      />
    </div>
  )
}

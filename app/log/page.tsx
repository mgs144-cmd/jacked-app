import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { LogClient } from '@/components/LogClient'
import { parseBodyWeightLogs } from '@/lib/bodyWeight'
import type { StrengthSex } from '@/lib/strengthStandards'

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
  let coachPlans: any[] = []
  let trainingPrograms: any[] = []
  let workoutDayTemplates: any[] = []
  let insightsMessages: { id: string; role: string; content: string }[] = []

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

  try {
    const sb = supabase as any
    const { data: plans } = await sb
      .from('coach_plans')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
    coachPlans = plans || []
  } catch {
    coachPlans = []
  }

  try {
    const sb = supabase as any
    const { data: prog } = await sb
      .from('training_programs')
      .select('*')
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false })
    trainingPrograms = prog || []
  } catch {
    trainingPrograms = []
  }

  try {
    const sb = supabase as any
    const { data: wdt } = await sb
      .from('workout_day_templates')
      .select('*')
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false })
    workoutDayTemplates = wdt || []
  } catch {
    workoutDayTemplates = []
  }

  try {
    const sb = supabase as any
    const { data: ins } = await sb
      .from('coach_insights_messages')
      .select('id, role, content')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: true })
      .limit(100)
    insightsMessages = ins || []
  } catch {
    insightsMessages = []
  }

  // Fetch all log-relevant posts: log-only, PR posts, and workout posts
  const { data: allPosts } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id(username, avatar_url, full_name),
      likes(id),
      comments(id),
      workout_exercises(*)
    `)
    .eq('user_id', session.user.id)
    .or('is_archived.is.null,is_archived.eq.false')
    .order('created_at', { ascending: false })
    .limit(150)

  const logPosts = (allPosts || []).filter(
    (post: any) =>
      post.is_log_only === true ||
      post.is_pr_post === true ||
      (post.workout_exercises && post.workout_exercises.length > 0)
  )

  let bodyWeightLogs: { date: string; weight: number }[] = []
  let strengthSex: StrengthSex | null = null

  try {
    const { data: bw } = await (supabase.from('body_weight_logs') as any)
      .select('weight_lb, logged_on')
      .eq('user_id', session.user.id)
      .order('logged_on', { ascending: true })
      .limit(120)
    bodyWeightLogs = parseBodyWeightLogs(bw || [])
  } catch {
    bodyWeightLogs = []
  }

  try {
    const { data: prof } = await (supabase.from('profiles') as any)
      .select('strength_sex')
      .eq('id', session.user.id)
      .single()
    const sex = prof?.strength_sex
    if (sex === 'male' || sex === 'female') {
      strengthSex = sex
    }
  } catch {
    strengthSex = null
  }

  const postsWithCounts = logPosts.map((post: any) => {
    let profile = post.profiles
    if (Array.isArray(profile)) profile = profile[0] || null
    return {
      ...post,
      profile,
      like_count: post.likes?.length || 0,
      comment_count: post.comments?.length || 0,
      top_comments: [],
    }
  })

  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pt-14 bg-black">
      <Navbar />
      <LogClient
        liftLogs={liftLogs}
        liftGoals={liftGoals}
        logPosts={postsWithCounts}
        userId={session.user.id}
        coachPlans={coachPlans}
        initialPrograms={trainingPrograms}
        initialDayTemplates={workoutDayTemplates}
        initialInsightsMessages={insightsMessages.map((r) => ({
          id: r.id,
          role: r.role as 'user' | 'assistant',
          content: r.content,
        }))}
        initialBodyWeightLogs={bodyWeightLogs}
        initialStrengthSex={strengthSex}
      />
    </div>
  )
}

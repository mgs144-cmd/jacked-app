import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { LiftGoalsView } from '@/components/log/LiftGoalsView'
import { collectAllLiftsFromSources, buildChartDataByExercise, latestE1RMByExercise } from '@/lib/liftChartData'

export default async function LiftGoalsPage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  let liftLogs: any[] = []
  let coachPlans: any[] = []

  try {
    const { data: logs } = await supabase
      .from('lift_logs')
      .select('*')
      .eq('user_id', session.user.id)
      .order('logged_at', { ascending: false })
      .limit(200)
    liftLogs = logs || []
  } catch {
    liftLogs = []
  }

  try {
    const sb = supabase as any
    const { data: plans } = await sb.from('coach_plans').select('*').eq('user_id', session.user.id).order('created_at', {
      ascending: false,
    })
    coachPlans = plans || []
  } catch {
    coachPlans = []
  }

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

  const raw = collectAllLiftsFromSources(liftLogs, logPosts)
  const chartDataByExercise = buildChartDataByExercise(raw)
  const exerciseBaselines = latestE1RMByExercise(chartDataByExercise)

  return (
    <div className="min-h-screen pb-24 md:pb-0 md:pt-14 bg-black">
      <Navbar />
      <div className="w-full max-w-[640px] mx-auto px-4 md:px-5 pt-4 pb-8 md:py-8 min-w-0">
        <Link
          href="/log"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Log
        </Link>
        <LiftGoalsView userId={session.user.id} initialPlans={coachPlans} exerciseBaselines={exerciseBaselines} />
      </div>
    </div>
  )
}

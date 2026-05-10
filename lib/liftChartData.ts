import { calculateOneRepMaxWithRPE } from '@/utils/oneRepMax'

export type LiftRow = {
  exercise_name: string
  weight: number
  reps: number
  rpe: number | null
  date: string
}

export function collectAllLiftsFromSources(liftLogs: any[], logPosts: any[]): LiftRow[] {
  return [
    ...liftLogs.map((l: any) => ({
      exercise_name: l.exercise_name,
      weight: Number(l.weight),
      reps: Number(l.reps),
      rpe: l.rpe ? Number(l.rpe) : null,
      date: l.logged_at?.split('T')[0] || l.logged_at,
    })),
    ...(logPosts || [])
      .filter((p: any) => p.is_pr_post && p.pr_exercise && p.pr_weight != null && p.pr_reps != null)
      .map((p: any) => ({
        exercise_name: p.pr_exercise,
        weight: Number(p.pr_weight || 0),
        reps: Number(p.pr_reps || 1),
        rpe: p.pr_rpe ? Number(p.pr_rpe) : null,
        date: p.created_at?.split('T')[0] || p.created_at,
      })),
    ...(logPosts || []).flatMap((p: any) =>
      (p.workout_exercises || [])
        .filter((we: any) => we.exercise_name && we.weight != null && we.reps != null && we.weight > 0 && we.reps > 0)
        .map((we: any) => ({
          exercise_name: we.exercise_name,
          weight: Number(we.weight || 0),
          reps: Number(we.reps || 1),
          rpe: null,
          date: p.created_at?.split('T')[0] || p.created_at,
        }))
    ),
  ]
}

export function buildChartDataByExercise(
  allLifts: LiftRow[]
): Record<string, { date: string; e1RM: number; weight: number; reps: number }[]> {
  const chartDataByExercise: Record<string, { date: string; e1RM: number; weight: number; reps: number }[]> = {}
  allLifts.forEach((log) => {
    const ex = log.exercise_name
    if (!ex || log.weight <= 0 || log.reps <= 0) return
    const e1RM = calculateOneRepMaxWithRPE(log.weight, log.reps, log.rpe ?? 10)
    if (!chartDataByExercise[ex]) chartDataByExercise[ex] = []
    chartDataByExercise[ex].push({ date: log.date, e1RM, weight: log.weight, reps: log.reps })
  })
  Object.keys(chartDataByExercise).forEach((ex) => {
    const arr = chartDataByExercise[ex]
    arr.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const byDate: Record<string, (typeof arr)[0]> = {}
    arr.forEach((d) => {
      if (!byDate[d.date] || d.e1RM > byDate[d.date].e1RM) byDate[d.date] = d
    })
    chartDataByExercise[ex] = Object.values(byDate).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  })
  return chartDataByExercise
}

/** Latest estimated 1RM per exercise name (lbs). */
export function latestE1RMByExercise(
  chartDataByExercise: Record<string, { e1RM: number }[]>
): Record<string, number> {
  const out: Record<string, number> = {}
  Object.entries(chartDataByExercise).forEach(([name, pts]) => {
    if (pts.length > 0) out[name] = pts[pts.length - 1].e1RM
  })
  return out
}

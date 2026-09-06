import { calculateOneRepMaxWithRPE } from '@/utils/oneRepMax'
import type { LiftRow } from '@/lib/liftChartData'

export type WorkoutDaySummary = {
  date: string
  exerciseCount: number
  setCount: number
  exercises: string[]
}

export type ExerciseHistorySet = {
  weight: number
  reps: number
  rpe: number | null
  e1rm: number
  range_spot?: 'beginning' | 'middle' | 'end' | null
}

export type ExerciseHistorySession = {
  date: string
  dateLabel: string
  sets: ExerciseHistorySet[]
}

function dateKey(isoOrDate: string): string {
  return isoOrDate.split('T')[0] || isoOrDate
}

/** Days with logged work (lift_logs + workout posts). */
export function buildWorkoutDays(allLifts: LiftRow[], logPosts: any[]): WorkoutDaySummary[] {
  const byDate: Record<string, { exercises: Set<string>; setCount: number }> = {}

  allLifts.forEach((l) => {
    if (!l.date || !l.exercise_name || l.weight <= 0 || l.reps <= 0) return
    const d = dateKey(l.date)
    if (!byDate[d]) byDate[d] = { exercises: new Set(), setCount: 0 }
    byDate[d].exercises.add(l.exercise_name)
    byDate[d].setCount += 1
  })

  logPosts?.forEach((p: any) => {
    const d = dateKey(p.created_at || '')
    if (!d) return
    const wes = p.workout_exercises || []
    if (!wes.length && !p.is_pr_post) return
    if (!byDate[d]) byDate[d] = { exercises: new Set(), setCount: 0 }
    wes.forEach((we: any) => {
      if (we.exercise_name && we.weight > 0 && we.reps > 0) {
        byDate[d].exercises.add(we.exercise_name)
        byDate[d].setCount += 1
      }
    })
    if (p.is_pr_post && p.pr_exercise) {
      byDate[d].exercises.add(p.pr_exercise)
      byDate[d].setCount += 1
    }
  })

  return Object.entries(byDate)
    .map(([date, v]) => ({
      date,
      exerciseCount: v.exercises.size,
      setCount: v.setCount,
      exercises: [...v.exercises].sort(),
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
}

/** Local calendar date YYYY-MM-DD (avoids UTC vs local hydration mismatches). */
export function todayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Stable label for SSR / hints (no Today/Yesterday — avoids server vs client day boundary). */
export function formatWorkoutDateAbsolute(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function formatWorkoutDate(dateStr: string): string {
  const today = todayISO()
  if (dateStr === today) return 'Today'
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yY = yesterday.getFullYear()
  const yM = String(yesterday.getMonth() + 1).padStart(2, '0')
  const yD = String(yesterday.getDate()).padStart(2, '0')
  if (dateStr === `${yY}-${yM}-${yD}`) return 'Yesterday'
  return formatWorkoutDateAbsolute(dateStr)
}

/** Earliest selectable log date (5 years back). */
export function minSessionDateISO(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 5)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** ISO timestamp for lift_logs.logged_at from a local calendar date (YYYY-MM-DD). */
export function toLoggedAtIso(dateStr: string): string {
  const today = todayISO()
  if (dateStr === today) return new Date().toISOString()

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr)
  if (!match) return new Date().toISOString()

  const y = Number(match[1])
  const m = Number(match[2])
  const d = Number(match[3])
  if (!y || !m || !d) return new Date().toISOString()

  return new Date(y, m - 1, d, 12, 0, 0, 0).toISOString()
}

/** All sets for one exercise, grouped by session date (newest first). */
export function getExerciseHistory(exerciseName: string, allLifts: LiftRow[]): ExerciseHistorySession[] {
  const needle = exerciseName.trim().toLowerCase()
  if (!needle) return []

  const matching = allLifts.filter(
    (l) => l.exercise_name.trim().toLowerCase() === needle && l.weight > 0 && l.reps > 0
  )
  const byDate: Record<string, ExerciseHistorySet[]> = {}
  matching.forEach((l) => {
    const d = dateKey(l.date)
    if (!byDate[d]) byDate[d] = []
    byDate[d].push({
      weight: l.weight,
      reps: l.reps,
      rpe: l.rpe,
      e1rm: calculateOneRepMaxWithRPE(l.weight, l.reps, l.rpe ?? 10),
      range_spot: l.range_spot ?? null,
    })
  })

  return Object.entries(byDate)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, sets]) => ({
      date,
      dateLabel: formatWorkoutDate(date),
      sets: sets.sort((a, b) => b.weight - a.weight || b.reps - a.reps),
    }))
}

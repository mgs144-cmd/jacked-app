import { calculateOneRepMaxWithRPE } from '@/utils/oneRepMax'
import { isPrimeRangeExercise } from '@/lib/exercises'
import { createEmptySet } from '@/lib/buildLiftLogRows'
import type { SetEntry, WorkoutExerciseEntry } from '@/components/log/types'
import { formatWorkoutDate } from '@/lib/workoutSessions'

export type LiftLogRecord = {
  id: string
  user_id: string
  exercise_name: string
  weight: number
  reps: number
  rpe: number | null
  logged_at: string
  notes?: string | null
  range_spot?: 'beginning' | 'middle' | 'end' | null
}

export type WorkoutDaySetDetail = {
  id?: string
  source: 'lift_log' | 'post'
  exercise_name: string
  weight: number
  reps: number
  rpe: number | null
  range_spot?: 'beginning' | 'middle' | 'end' | null
  e1rm: number
  editable: boolean
}

export type WorkoutDayExerciseDetail = {
  exercise_name: string
  sets: WorkoutDaySetDetail[]
}

export type WorkoutDayDetail = {
  date: string
  dateLabel: string
  exercises: WorkoutDayExerciseDetail[]
  totalSets: number
  liftLogCount: number
  hasPostOnlySets: boolean
}

function dateKey(isoOrDate: string): string {
  return isoOrDate.split('T')[0] || isoOrDate
}

export function getLiftLogsForDate(liftLogs: LiftLogRecord[], date: string): LiftLogRecord[] {
  return liftLogs
    .filter((l) => dateKey(l.logged_at) === date && l.weight > 0 && l.reps > 0)
    .sort((a, b) => a.logged_at.localeCompare(b.logged_at))
}

export function buildWorkoutDayDetail(
  date: string,
  liftLogs: LiftLogRecord[],
  logPosts: any[]
): WorkoutDayDetail | null {
  const dayLogs = getLiftLogsForDate(liftLogs, date)
  const exercises: WorkoutDayExerciseDetail[] = []
  const byExercise = new Map<string, WorkoutDaySetDetail[]>()

  const addSet = (exercise_name: string, set: WorkoutDaySetDetail) => {
    if (!byExercise.has(exercise_name)) byExercise.set(exercise_name, [])
    byExercise.get(exercise_name)!.push(set)
  }

  dayLogs.forEach((l) => {
    addSet(l.exercise_name, {
      id: l.id,
      source: 'lift_log',
      exercise_name: l.exercise_name,
      weight: Number(l.weight),
      reps: Number(l.reps),
      rpe: l.rpe != null ? Number(l.rpe) : null,
      range_spot: l.range_spot ?? null,
      e1rm: calculateOneRepMaxWithRPE(Number(l.weight), Number(l.reps), l.rpe ?? 10),
      editable: true,
    })
  })

  logPosts?.forEach((p: any) => {
    const d = dateKey(p.created_at || '')
    if (d !== date) return
    if (p.is_pr_post && p.pr_exercise && p.pr_weight != null && p.pr_reps != null) {
      const weight = Number(p.pr_weight)
      const reps = Number(p.pr_reps)
      const rpe = p.pr_rpe != null ? Number(p.pr_rpe) : null
      addSet(p.pr_exercise, {
        source: 'post',
        exercise_name: p.pr_exercise,
        weight,
        reps,
        rpe,
        e1rm: calculateOneRepMaxWithRPE(weight, reps, rpe ?? 10),
        editable: false,
      })
    }
    ;(p.workout_exercises || []).forEach((we: any) => {
      if (!we.exercise_name || we.weight == null || we.reps == null || we.weight <= 0 || we.reps <= 0) return
      const weight = Number(we.weight)
      const reps = Number(we.reps)
      addSet(we.exercise_name, {
        source: 'post',
        exercise_name: we.exercise_name,
        weight,
        reps,
        rpe: null,
        e1rm: calculateOneRepMaxWithRPE(weight, reps, 10),
        editable: false,
      })
    })
  })

  if (byExercise.size === 0) return null

  byExercise.forEach((sets, exercise_name) => {
    exercises.push({
      exercise_name,
      sets: sets.sort((a, b) => {
        if (a.source !== b.source) return a.source === 'lift_log' ? -1 : 1
        return 0
      }),
    })
  })

  exercises.sort((a, b) => a.exercise_name.localeCompare(b.exercise_name))

  const totalSets = exercises.reduce((n, ex) => n + ex.sets.length, 0)
  const hasPostOnlySets = exercises.some((ex) => ex.sets.some((s) => s.source === 'post'))

  return {
    date,
    dateLabel: formatWorkoutDate(date),
    exercises,
    totalSets,
    liftLogCount: dayLogs.length,
    hasPostOnlySets,
  }
}

/** Convert lift_logs for one day into editable workout entries. */
export function liftLogsToWorkoutEntries(logs: LiftLogRecord[]): WorkoutExerciseEntry[] {
  const byExercise = new Map<string, LiftLogRecord[]>()
  for (const log of logs) {
    const name = log.exercise_name.trim()
    if (!name) continue
    if (!byExercise.has(name)) byExercise.set(name, [])
    byExercise.get(name)!.push(log)
  }

  const entries: WorkoutExerciseEntry[] = []

  byExercise.forEach((exerciseLogs, exercise_name) => {
    exerciseLogs.sort((a, b) => a.logged_at.localeCompare(b.logged_at))
    const sets: SetEntry[] = []

    if (isPrimeRangeExercise(exercise_name)) {
      const grouped = new Map<string, LiftLogRecord[]>()
      for (const l of exerciseLogs) {
        const key = `${l.logged_at}|${l.reps}`
        if (!grouped.has(key)) grouped.set(key, [])
        grouped.get(key)!.push(l)
      }
      grouped.forEach((group) => {
        const entry = createEmptySet(exercise_name)
        entry.reps = String(group[0].reps)
        entry.rpe = group[0].rpe != null ? String(group[0].rpe) : ''
        for (const l of group) {
          const w = String(l.weight)
          if (l.range_spot === 'beginning') entry.weight_beginning = w
          else if (l.range_spot === 'middle') entry.weight_middle = w
          else if (l.range_spot === 'end') entry.weight_end = w
          else entry.weight = w
        }
        sets.push(entry)
      })
    } else {
      for (const l of exerciseLogs) {
        sets.push({
          weight: String(l.weight),
          reps: String(l.reps),
          rpe: l.rpe != null ? String(l.rpe) : '',
          note: l.notes ?? undefined,
        })
      }
    }

    entries.push({
      id: crypto.randomUUID(),
      exercise_name,
      sets: sets.length ? sets : [createEmptySet(exercise_name)],
    })
  })

  return entries
}

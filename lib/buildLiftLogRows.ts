import type { SetEntry } from '@/components/log/types'
import { getLoggingModeForExercise, isPrimeRangeExercise, type ExerciseCatalogEntry } from '@/lib/exercises'

export type LiftLogInsertRow = {
  user_id: string
  exercise_name: string
  weight: number
  reps: number
  rpe: number | null
  logged_at: string
  range_spot?: 'beginning' | 'middle' | 'end' | null
}

export function createEmptySet(exerciseName: string): SetEntry {
  if (isPrimeRangeExercise(exerciseName)) {
    return {
      weight: '',
      reps: '',
      rpe: '',
      weight_beginning: '',
      weight_middle: '',
      weight_end: '',
    }
  }
  return { weight: '', reps: '', rpe: '' }
}

export function setHasLoggedData(set: SetEntry, exerciseName: string): boolean {
  const reps = parseInt(set.reps, 10)
  if (!Number.isFinite(reps) || reps <= 0) return false

  if (isPrimeRangeExercise(exerciseName)) {
    const spots = [set.weight_beginning, set.weight_middle, set.weight_end]
    return spots.some((w) => {
      const n = parseFloat(w ?? '')
      return Number.isFinite(n) && n > 0
    })
  }

  const w = parseFloat(set.weight)
  return Number.isFinite(w) && w > 0
}

export function countValidSets(
  exerciseName: string,
  sets: SetEntry[]
): number {
  return sets.filter((s) => setHasLoggedData(s, exerciseName)).length
}

export function buildLiftLogRowsFromSets(
  userId: string,
  exerciseName: string,
  sets: SetEntry[],
  loggedAt: string,
  catalog?: ExerciseCatalogEntry[]
): LiftLogInsertRow[] {
  const name = exerciseName.trim()
  if (!name) return []

  const mode = getLoggingModeForExercise(name, catalog)
  const rows: LiftLogInsertRow[] = []

  for (const s of sets) {
    const reps = parseInt(s.reps, 10)
    if (!Number.isFinite(reps) || reps <= 0) continue
    const rpe = s.rpe ? parseFloat(s.rpe) : null

    if (mode === 'prime_range') {
      const spots: { spot: 'beginning' | 'middle' | 'end'; raw: string | undefined }[] = [
        { spot: 'beginning', raw: s.weight_beginning },
        { spot: 'middle', raw: s.weight_middle },
        { spot: 'end', raw: s.weight_end },
      ]
      for (const { spot, raw } of spots) {
        const w = parseFloat(raw ?? '')
        if (Number.isFinite(w) && w > 0) {
          // range_spot only when column exists (ADD_EXERCISE_CATALOG.sql)
          rows.push({
            user_id: userId,
            exercise_name: name,
            weight: w,
            reps,
            rpe: Number.isFinite(rpe as number) ? rpe : null,
            logged_at: loggedAt,
            range_spot: spot,
          })
        }
      }
      continue
    }

    const w = parseFloat(s.weight)
    if (Number.isFinite(w) && w > 0) {
      // Do not send range_spot for standard lifts — column may not exist yet
      rows.push({
        user_id: userId,
        exercise_name: name,
        weight: w,
        reps,
        rpe: Number.isFinite(rpe as number) ? rpe : null,
        logged_at: loggedAt,
      })
    }
  }

  return rows
}

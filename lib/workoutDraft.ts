import type { SetEntry, WorkoutExerciseEntry } from '@/components/log/types'
import { countValidSets } from '@/lib/buildLiftLogRows'

export const WORKOUT_DRAFT_VERSION = 1 as const
export const WORKOUT_DRAFT_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000

export type WorkoutDraftMode = 'active-workout' | 'quick-single'

export type WorkoutDraft = {
  v: typeof WORKOUT_DRAFT_VERSION
  mode: WorkoutDraftMode
  updatedAt: number
  sessionDate?: string
  activeWorkoutSubtitle?: string | null
  workoutExercises?: WorkoutExerciseEntry[]
  singleExerciseName?: string
  singleExerciseSets?: SetEntry[]
}

export function workoutDraftStorageKey(userId: string): string {
  return `jacked:active-workout-draft:${userId}`
}

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

export function activeWorkoutHasContent(exercises: WorkoutExerciseEntry[]): boolean {
  return exercises.some((ex) => {
    if (ex.exercise_name.trim()) return true
    return countValidSets(ex.exercise_name, ex.sets) > 0 || ex.sets.some((s) => s.weight || s.reps || s.rpe)
  })
}

export function quickSingleHasContent(name: string, sets: SetEntry[]): boolean {
  if (name.trim()) return true
  return sets.some((s) => s.weight || s.reps || s.rpe)
}

export function buildWorkoutDraft(params: {
  mode: WorkoutDraftMode
  sessionDate: string
  workoutExercises: WorkoutExerciseEntry[]
  activeWorkoutSubtitle: string | null
  singleExerciseName: string
  singleExerciseSets: SetEntry[]
}): WorkoutDraft | null {
  const {
    mode,
    sessionDate,
    workoutExercises,
    activeWorkoutSubtitle,
    singleExerciseName,
    singleExerciseSets,
  } = params

  if (mode === 'active-workout') {
    if (!activeWorkoutHasContent(workoutExercises)) return null
    return {
      v: WORKOUT_DRAFT_VERSION,
      mode,
      updatedAt: Date.now(),
      sessionDate,
      activeWorkoutSubtitle,
      workoutExercises,
    }
  }

  if (!quickSingleHasContent(singleExerciseName, singleExerciseSets)) return null
  return {
    v: WORKOUT_DRAFT_VERSION,
    mode,
    updatedAt: Date.now(),
    sessionDate,
    singleExerciseName,
    singleExerciseSets,
  }
}

export function loadWorkoutDraft(userId: string): WorkoutDraft | null {
  if (!isBrowser()) return null
  try {
    const raw = localStorage.getItem(workoutDraftStorageKey(userId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as WorkoutDraft
    if (parsed.v !== WORKOUT_DRAFT_VERSION) return null
    if (!parsed.updatedAt || Date.now() - parsed.updatedAt > WORKOUT_DRAFT_MAX_AGE_MS) {
      localStorage.removeItem(workoutDraftStorageKey(userId))
      return null
    }
    if (parsed.mode === 'active-workout' && parsed.workoutExercises) {
      if (!activeWorkoutHasContent(parsed.workoutExercises)) return null
      return parsed
    }
    if (parsed.mode === 'quick-single' && parsed.singleExerciseSets) {
      if (!quickSingleHasContent(parsed.singleExerciseName ?? '', parsed.singleExerciseSets)) return null
      return parsed
    }
    return null
  } catch {
    return null
  }
}

export function saveWorkoutDraft(userId: string, draft: WorkoutDraft): void {
  if (!isBrowser()) return
  try {
    localStorage.setItem(workoutDraftStorageKey(userId), JSON.stringify({ ...draft, updatedAt: Date.now() }))
  } catch (e) {
    console.warn('workout draft save failed', e)
  }
}

export function clearWorkoutDraft(userId: string): void {
  if (!isBrowser()) return
  try {
    localStorage.removeItem(workoutDraftStorageKey(userId))
  } catch {
    /* ignore */
  }
}

export function formatDraftSavedAgo(updatedAt: number): string {
  const sec = Math.floor((Date.now() - updatedAt) / 1000)
  if (sec < 10) return 'just now'
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return new Date(updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

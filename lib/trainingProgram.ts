import { calculateOneRepMaxWithRPE, weightForRepsAtRPE } from '@/utils/oneRepMax'
import type { LiftRow } from '@/lib/liftChartData'
import type { SetEntry, WorkoutExerciseEntry } from '@/components/log/types'
import { createEmptySet } from '@/lib/buildLiftLogRows'
import { isPrimeRangeExercise } from '@/lib/exercises'

export type TrainingGoal = 'strength' | 'hypertrophy'

/** Default rep scheme when no goal toggle is shown in UI. */
export const DEFAULT_TRAINING_GOAL: TrainingGoal = 'hypertrophy'

export interface ProgramExercise {
  id: string
  exercise_name: string
  target_sets: number
  /** e.g. "5", "8-12", "3-5" */
  target_reps: string
  rest_sec?: number
  notes?: string
}

export interface ProgramDay {
  id: string
  label: string
  exercises: ProgramExercise[]
}

export interface TrainingProgramJson {
  days: ProgramDay[]
}

export interface TrainingProgramRow {
  id: string
  user_id: string
  name: string
  goal: TrainingGoal
  program_json: TrainingProgramJson
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface WorkoutTemplate {
  id: string
  label: string
  exerciseNames: string[]
  lastDate: string
  source: 'history'
}

export interface RecommendedSet {
  weight: number
  reps: number
  rpe: string
  kind: 'warmup' | 'working'
  label: string
}

export interface MuscleVolumeRow {
  muscle: string
  sets: number
  hint: string
}

const MUSCLE_KEYWORDS: Record<string, string[]> = {
  Chest: ['bench', 'press', 'fly', 'push-up', 'pushup', 'dip'],
  Back: ['row', 'pull', 'pulldown', 'deadlift', 'lat'],
  Shoulders: ['shoulder', 'ohp', 'overhead', 'lateral', 'raise', 'face pull'],
  Quads: ['squat', 'leg press', 'lunge', 'extension', 'hack'],
  Hamstrings: ['rdl', 'romanian', 'leg curl', 'good morning', 'stiff'],
  Glutes: ['hip thrust', 'glute', 'kickback'],
  Biceps: ['curl', 'bicep'],
  Triceps: ['tricep', 'skull', 'pushdown', 'extension'],
  Calves: ['calf'],
  Core: ['ab', 'plank', 'crunch', 'core'],
}

export function inferMuscleGroup(exerciseName: string): string {
  const lower = exerciseName.toLowerCase()
  for (const [muscle, keys] of Object.entries(MUSCLE_KEYWORDS)) {
    if (keys.some((k) => lower.includes(k))) return muscle
  }
  return 'Other'
}

export function parseRepTarget(targetReps: string): { min: number; max: number; mid: number } {
  const t = targetReps.trim()
  const range = t.match(/^(\d+)\s*[-–]\s*(\d+)$/)
  if (range) {
    const min = parseInt(range[1], 10)
    const max = parseInt(range[2], 10)
    return { min, max, mid: Math.round((min + max) / 2) }
  }
  const n = parseInt(t, 10)
  if (Number.isFinite(n) && n > 0) return { min: n, max: n, mid: n }
  return { min: 8, max: 12, mid: 10 }
}

export function defaultScheme(goal: TrainingGoal): { sets: number; reps: string; rest: number } {
  if (goal === 'strength') return { sets: 4, reps: '3-5', rest: 180 }
  return { sets: 3, reps: '8-12', rest: 90 }
}

export function roundToPlate(weight: number, increment = 2.5): number {
  return Math.round(weight / increment) * increment
}

function lastSessionForExercise(allLifts: LiftRow[], exerciseName: string) {
  const needle = exerciseName.trim().toLowerCase()
  const matching = allLifts.filter((l) => l.exercise_name.trim().toLowerCase() === needle && l.weight > 0 && l.reps > 0)
  if (!matching.length) return null
  const byDate: Record<string, LiftRow[]> = {}
  matching.forEach((l) => {
    if (!byDate[l.date]) byDate[l.date] = []
    byDate[l.date].push(l)
  })
  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a))
  const latest = byDate[dates[0]]
  const best = latest.reduce((a, b) => {
    const ea = calculateOneRepMaxWithRPE(a.weight, a.reps, a.rpe ?? 10)
    const eb = calculateOneRepMaxWithRPE(b.weight, b.reps, b.rpe ?? 10)
    return eb > ea ? b : a
  })
  const topSets = latest.filter((s) => s.weight >= best.weight * 0.9)
  return { date: dates[0], best, topSets, allOnDay: latest }
}

export function suggestWorkingWeight(params: {
  exerciseName: string
  goal: TrainingGoal
  targetReps: string
  allLifts: LiftRow[]
  e1rmByExercise?: Record<string, number>
}): { weight: number; reps: number; note: string } {
  const { min, max, mid } = parseRepTarget(params.targetReps)
  const last = lastSessionForExercise(params.allLifts, params.exerciseName)
  const e1rm =
    params.e1rmByExercise?.[params.exerciseName.trim()] ??
    (last ? calculateOneRepMaxWithRPE(last.best.weight, last.best.reps, last.best.rpe ?? 10) : null)

  let working = last?.best.weight ?? 0
  let reps = last?.best.reps ?? mid

  if (last && last.best.reps >= max && (last.best.rpe == null || last.best.rpe <= 8.5)) {
    working = roundToPlate(working + (params.goal === 'strength' ? 5 : 2.5))
  } else if (!working && e1rm && e1rm > 0) {
    const targetRpe = params.goal === 'strength' ? 8 : 7.5
    working = roundToPlate(weightForRepsAtRPE(e1rm, mid, targetRpe))
    reps = mid
  } else if (!working) {
    return { weight: 0, reps: mid, note: 'Log this lift once to get recommendations.' }
  }

  if (reps < min) reps = min
  if (reps > max) reps = max

  const note = last
    ? last.best.reps >= max
      ? `+${params.goal === 'strength' ? 5 : 2.5} lb from last session`
      : `Based on ${last.best.weight}×${last.best.reps} (${last.date})`
    : e1rm
      ? `~${Math.round(e1rm)} lb e1RM → ${mid} reps`
      : ''

  return { weight: working, reps, note }
}

/** Warm-up + working set prescriptions for display and pre-fill. */
export function buildProgressiveSets(params: {
  exerciseName: string
  goal: TrainingGoal
  targetSets: number
  targetReps: string
  allLifts: LiftRow[]
  e1rmByExercise?: Record<string, number>
}): RecommendedSet[] {
  const working = suggestWorkingWeight({
    exerciseName: params.exerciseName,
    goal: params.goal,
    targetReps: params.targetReps,
    allLifts: params.allLifts,
    e1rmByExercise: params.e1rmByExercise,
  })
  const { min, max, mid } = parseRepTarget(params.targetReps)
  const w = working.weight > 0 ? working.weight : 0
  const out: RecommendedSet[] = []

  if (w > 0) {
    const warmPct = params.goal === 'strength' ? [0.5, 0.7] : [0.45, 0.65]
    warmPct.forEach((pct, i) => {
      const ww = roundToPlate(w * pct)
      if (ww > 0 && ww < w) {
        out.push({
          weight: ww,
          reps: params.goal === 'strength' ? 5 : 8,
          rpe: '6',
          kind: 'warmup',
          label: `Warm-up ${i + 1}`,
        })
      }
    })
  }

  const workingCount = Math.max(1, params.targetSets)
  for (let i = 0; i < workingCount; i++) {
    const reps = params.goal === 'strength' ? Math.min(max, Math.max(min, working.reps)) : mid
    out.push({
      weight: w,
      reps,
      rpe: params.goal === 'strength' ? '8' : '7.5',
      kind: 'working',
      label: `Set ${i + 1}`,
    })
  }

  return out
}

export function recommendedSetsToSetEntries(
  sets: RecommendedSet[],
  exerciseName?: string
): SetEntry[] {
  if (exerciseName && isPrimeRangeExercise(exerciseName)) {
    return sets.map(() => createEmptySet(exerciseName))
  }
  return sets.map((s) => ({
    weight: s.weight > 0 ? String(s.weight) : '',
    reps: String(s.reps),
    rpe: s.rpe,
    note: s.kind === 'warmup' ? s.label : undefined,
  }))
}

export function buildWorkoutFromProgramDay(
  day: ProgramDay,
  allLifts: LiftRow[],
  e1rmByExercise?: Record<string, number>,
  goal: TrainingGoal = DEFAULT_TRAINING_GOAL
): WorkoutExerciseEntry[] {
  return day.exercises
    .filter((ex) => ex.exercise_name.trim())
    .map((ex) => {
      const progressive = buildProgressiveSets({
        exerciseName: ex.exercise_name,
        goal,
        targetSets: ex.target_sets,
        targetReps: ex.target_reps,
        allLifts,
        e1rmByExercise,
      })
      return {
        id: crypto.randomUUID(),
        exercise_name: ex.exercise_name,
        sets: recommendedSetsToSetEntries(progressive, ex.exercise_name),
        note: ex.notes,
      }
    })
}

export function muscleVolumeForDay(day: ProgramDay): MuscleVolumeRow[] {
  const counts: Record<string, number> = {}
  day.exercises.forEach((ex) => {
    const muscle = inferMuscleGroup(ex.exercise_name)
    counts[muscle] = (counts[muscle] || 0) + ex.target_sets + 2
  })
  const targetPerSession = '8–14'
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([muscle, sets]) => ({
      muscle,
      sets,
      hint: `${sets} sets today · aim ~${targetPerSession} working sets/muscle per session`,
    }))
}

export function extractWorkoutTemplates(logPosts: any[]): WorkoutTemplate[] {
  const map = new Map<string, WorkoutTemplate>()
  logPosts?.forEach((p: any) => {
    const names = new Set<string>()
    if (p.workout_exercises?.length) {
      p.workout_exercises.forEach((we: any) => we.exercise_name && names.add(we.exercise_name.trim()))
    }
    if (names.size < 2) return
    const sorted = [...names].sort()
    const key = sorted.join('|').toLowerCase()
    const date = p.created_at?.split('T')[0] || ''
    const existing = map.get(key)
    if (!existing || date > existing.lastDate) {
      map.set(key, {
        id: key,
        label: sorted.length <= 3 ? sorted.join(' · ') : `${sorted[0]} +${sorted.length - 1} more`,
        exerciseNames: sorted,
        lastDate: date,
        source: 'history',
      })
    }
  })
  return [...map.values()].sort((a, b) => b.lastDate.localeCompare(a.lastDate)).slice(0, 8)
}

export function buildWorkoutFromTemplate(
  template: WorkoutTemplate,
  allLifts: LiftRow[],
  e1rmByExercise?: Record<string, number>,
  goal: TrainingGoal = DEFAULT_TRAINING_GOAL
): WorkoutExerciseEntry[] {
  const scheme = defaultScheme(goal)
  return template.exerciseNames.map((name) => {
    const progressive = buildProgressiveSets({
      exerciseName: name,
      goal,
      targetSets: scheme.sets,
      targetReps: scheme.reps,
      allLifts,
      e1rmByExercise,
    })
    return {
      id: crypto.randomUUID(),
      exercise_name: name,
      sets: recommendedSetsToSetEntries(progressive, name),
    }
  })
}

export function normalizeProgramJson(raw: unknown): TrainingProgramJson {
  if (!raw || typeof raw !== 'object') return { days: [] }
  const days = (raw as TrainingProgramJson).days
  if (!Array.isArray(days)) return { days: [] }
  return {
    days: days.map((d) => ({
      id: d.id || crypto.randomUUID(),
      label: d.label || 'Day',
      exercises: (d.exercises || []).map((ex) => ({
        id: ex.id || crypto.randomUUID(),
        exercise_name: ex.exercise_name || '',
        target_sets: Number(ex.target_sets) || 3,
        target_reps: ex.target_reps || '8-12',
        rest_sec: ex.rest_sec,
        notes: ex.notes,
      })),
    })),
  }
}

export function createEmptyProgram(): TrainingProgramJson {
  return {
    days: [
      {
        id: crypto.randomUUID(),
        label: 'Day 1',
        exercises: [],
      },
    ],
  }
}

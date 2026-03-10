/** Shared types for Log tab views */

export type LogSegment = 'quick-log' | 'exercises' | 'insights'

export interface SetEntry {
  weight: string
  reps: string
  rpe: string
  note?: string
}

export interface WorkoutExerciseEntry {
  id: string
  exercise_name: string
  sets: SetEntry[]
  note?: string
}

export interface LiftRecord {
  exercise_name: string
  weight: number
  reps: number
  rpe: number | null
  date: string
  source: 'log' | 'post'
  _log?: any
}

export interface ChartPoint {
  date: string
  e1RM: number
  weight: number
  reps: number
}

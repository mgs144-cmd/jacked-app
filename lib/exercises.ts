/** Built-in exercise names (fallback when catalog table is unavailable). */
export const BUILTIN_EXERCISES: string[] = [
  'Bench Press',
  'Incline Bench Press',
  'Decline Bench Press',
  'Dumbbell Press',
  'Overhead Press',
  'Shoulder Press',
  'Lateral Raise',
  'Front Raise',
  'Cable Fly',
  'Push-up',
  'Dip',
  'Tricep Extension',
  'Bicep Curl',
  'Hammer Curl',
  'Pull-up',
  'Chin-up',
  'Lat Pulldown',
  'Barbell Row',
  'Bent Over Row',
  'T-Bar Row',
  'Cable Row',
  'Chest-Supported Row',
  'Chest-Supported Row (Prime)',
  'Face Pull',
  'Shrug',
  'Squat',
  'Back Squat',
  'Front Squat',
  'Bulgarian Split Squat',
  'Leg Press',
  'Romanian Deadlift',
  'Deadlift',
  'Sumo Deadlift',
  'Lunge',
  'Walking Lunge',
  'Leg Curl',
  'Leg Extension',
  'Leg Extension (Prime)',
  'Calf Raise',
  'Hip Thrust',
  'Good Morning',
  'Plank',
  'Farmer\'s Walk',
].sort((a, b) => a.localeCompare(b))

export const PRIME_RANGE_EXERCISES = [
  'Leg Extension (Prime)',
  'Chest-Supported Row (Prime)',
] as const

export type ExerciseLoggingMode = 'standard' | 'prime_range'

export type ExerciseCatalogEntry = {
  name: string
  logging_mode: ExerciseLoggingMode
}

export function normalizeExerciseKey(name: string): string {
  return name.trim().toLowerCase()
}

export function isPrimeRangeExercise(name: string): boolean {
  const key = normalizeExerciseKey(name)
  return PRIME_RANGE_EXERCISES.some((p) => normalizeExerciseKey(p) === key)
}

export function getLoggingModeForExercise(
  name: string,
  catalog?: ExerciseCatalogEntry[]
): ExerciseLoggingMode {
  const key = normalizeExerciseKey(name)
  const fromCatalog = catalog?.find((e) => normalizeExerciseKey(e.name) === key)
  if (fromCatalog) return fromCatalog.logging_mode
  return isPrimeRangeExercise(name) ? 'prime_range' : 'standard'
}

/** Merge catalog, builtins, and lift-history names into a deduped sorted list. */
export function mergeExerciseNameList(
  catalog: ExerciseCatalogEntry[],
  recentNames: string[] = []
): ExerciseCatalogEntry[] {
  const byKey = new Map<string, ExerciseCatalogEntry>()

  for (const name of BUILTIN_EXERCISES) {
    const key = normalizeExerciseKey(name)
    if (!byKey.has(key)) {
      byKey.set(key, {
        name,
        logging_mode: isPrimeRangeExercise(name) ? 'prime_range' : 'standard',
      })
    }
  }

  for (const entry of catalog) {
    const trimmed = entry.name.trim()
    if (!trimmed) continue
    const key = normalizeExerciseKey(trimmed)
    byKey.set(key, {
      name: trimmed,
      logging_mode: entry.logging_mode,
    })
  }

  for (const raw of recentNames) {
    const trimmed = raw.trim()
    if (!trimmed) continue
    const key = normalizeExerciseKey(trimmed)
    if (!byKey.has(key)) {
      byKey.set(key, {
        name: trimmed,
        logging_mode: isPrimeRangeExercise(trimmed) ? 'prime_range' : 'standard',
      })
    }
  }

  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name))
}

export function filterExerciseSuggestions(
  all: ExerciseCatalogEntry[],
  query: string,
  max = 8
): ExerciseCatalogEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const exact = all.find((e) => normalizeExerciseKey(e.name) === q)
  if (exact) return []

  return all
    .filter((e) => normalizeExerciseKey(e.name).includes(q))
    .slice(0, max)
}

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  BUILTIN_EXERCISES,
  type ExerciseCatalogEntry,
  isPrimeRangeExercise,
  mergeExerciseNameList,
  normalizeExerciseKey,
} from '@/lib/exercises'

function fallbackCatalog(): ExerciseCatalogEntry[] {
  return BUILTIN_EXERCISES.map((name) => ({
    name,
    logging_mode: isPrimeRangeExercise(name) ? 'prime_range' : 'standard',
  }))
}

/** Load global + user exercises from DB (falls back to builtins if table missing). */
export async function fetchExerciseCatalog(
  supabase: SupabaseClient,
  userId: string
): Promise<ExerciseCatalogEntry[]> {
  const { data, error } = await supabase
    .from('exercise_catalog')
    .select('name, logging_mode')
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .order('name')

  if (error) {
    console.warn('exercise_catalog fetch:', error.message)
    return fallbackCatalog()
  }

  return mergeExerciseNameList(
    (data || []).map((row) => ({
      name: String(row.name),
      logging_mode: row.logging_mode === 'prime_range' ? 'prime_range' : 'standard',
    }))
  )
}

/** Add user-created exercises after a successful log (skips names already in catalog). */
export async function ensureExercisesInCatalog(
  supabase: SupabaseClient,
  userId: string,
  names: string[]
): Promise<void> {
  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))]
  if (unique.length === 0) return

  const { data: existing, error: readErr } = await supabase
    .from('exercise_catalog')
    .select('name')
    .or(`user_id.is.null,user_id.eq.${userId}`)

  if (readErr) {
    console.warn('exercise_catalog read:', readErr.message)
    return
  }

  const existingKeys = new Set((existing || []).map((r) => normalizeExerciseKey(String(r.name))))

  const toInsert = unique.filter((name) => !existingKeys.has(normalizeExerciseKey(name)))
  if (toInsert.length === 0) return

  const rows = toInsert.map((name) => ({
    name,
    user_id: userId,
    logging_mode: isPrimeRangeExercise(name) ? 'prime_range' : 'standard',
  }))

  const { error: insertErr } = await supabase.from('exercise_catalog').insert(rows)
  if (insertErr) console.warn('exercise_catalog insert:', insertErr.message)
}

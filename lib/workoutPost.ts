export type WorkoutLogTier = 'none' | 'names' | 'sets_reps' | 'full'

export type WorkoutSetDraft = { weight: number | null; reps: number | null }

export type WorkoutExerciseDraft = {
  exercise_name: string
  order_index: number
  sets_data: WorkoutSetDraft[]
  set_count?: number | null
  reps_per_set?: number | null
}

export type WorkoutExerciseRow = {
  post_id: string
  exercise_name: string
  sets: number | null
  reps: number | null
  weight: number | null
  order_index: number
}

/** Build DB rows for `workout_exercises` from create-post form state. */
export function buildWorkoutExerciseRows(
  tier: WorkoutLogTier,
  exercises: WorkoutExerciseDraft[],
  postId: string
): WorkoutExerciseRow[] {
  if (tier === 'none') return []

  const filtered = exercises.filter((ex) => ex.exercise_name?.trim())
  if (filtered.length === 0) return []

  const out: WorkoutExerciseRow[] = []

  filtered.forEach((ex, exerciseIndex) => {
    const name = ex.exercise_name.trim()

    if (tier === 'names') {
      out.push({
        post_id: postId,
        exercise_name: name,
        sets: null,
        reps: null,
        weight: null,
        order_index: exerciseIndex,
      })
      return
    }

    if (tier === 'sets_reps') {
      const sc = ex.set_count != null && ex.set_count > 0 ? Math.floor(ex.set_count) : null
      const r = ex.reps_per_set != null && ex.reps_per_set > 0 ? Math.floor(ex.reps_per_set) : null
      out.push({
        post_id: postId,
        exercise_name: name,
        sets: sc,
        reps: r,
        weight: null,
        order_index: exerciseIndex,
      })
      return
    }

    // full — one row per set with any data; if none, still save exercise name
    let anySet = false
    ex.sets_data.forEach((set) => {
      if (set.weight != null || set.reps != null) {
        anySet = true
        out.push({
          post_id: postId,
          exercise_name: name,
          sets: 1,
          reps: set.reps,
          weight: set.weight,
          order_index: exerciseIndex,
        })
      }
    })
    if (!anySet) {
      out.push({
        post_id: postId,
        exercise_name: name,
        sets: null,
        reps: null,
        weight: null,
        order_index: exerciseIndex,
      })
    }
  })

  return out
}

/** Rebuild create/edit form state from `workout_exercises` rows. */
export function exercisesFromDbRows(rows: any[] | null | undefined): {
  tier: WorkoutLogTier
  exercises: WorkoutExerciseDraft[]
} {
  if (!rows?.length) return { tier: 'none', exercises: [] }

  const byOrder = new Map<number, any[]>()
  for (const r of rows) {
    const k = typeof r.order_index === 'number' ? r.order_index : 0
    if (!byOrder.has(k)) byOrder.set(k, [])
    byOrder.get(k)!.push(r)
  }
  const sortedKeys = [...byOrder.keys()].sort((a, b) => a - b)

  const exercises: WorkoutExerciseDraft[] = sortedKeys.map((k, idx) => {
    const rs = byOrder.get(k)!
    const name = String(rs[0]?.exercise_name ?? '')
    const r0 = rs[0]

    if (
      rs.length === 1 &&
      r0.weight == null &&
      r0.reps == null &&
      (r0.sets == null || r0.sets === 0)
    ) {
      return {
        exercise_name: name,
        order_index: idx,
        sets_data: [{ weight: null, reps: null }],
        set_count: null,
        reps_per_set: null,
      }
    }

    if (rs.length === 1 && r0.weight == null && (r0.sets != null || r0.reps != null)) {
      return {
        exercise_name: name,
        order_index: idx,
        sets_data: [{ weight: null, reps: null }],
        set_count: r0.sets != null && r0.sets > 0 ? Math.floor(Number(r0.sets)) : null,
        reps_per_set: r0.reps != null && r0.reps > 0 ? Math.floor(Number(r0.reps)) : null,
      }
    }

    const sets_data = rs.map((r) => ({
      weight: r.weight != null ? Number(r.weight) : null,
      reps: r.reps != null ? Number(r.reps) : null,
    }))

    return {
      exercise_name: name,
      order_index: idx,
      sets_data: sets_data.length ? sets_data : [{ weight: null, reps: null }],
      set_count: null,
      reps_per_set: null,
    }
  })

  let tier: WorkoutLogTier = 'full'
  if (
    exercises.every(
      (e) =>
        e.sets_data.length === 1 &&
        e.sets_data[0].weight == null &&
        e.sets_data[0].reps == null &&
        e.set_count == null &&
        e.reps_per_set == null
    )
  ) {
    tier = 'names'
  } else if (
    exercises.every(
      (e) =>
        e.sets_data.length === 1 &&
        e.sets_data[0].weight == null &&
        e.sets_data[0].reps == null &&
        (e.set_count != null || e.reps_per_set != null)
    )
  ) {
    tier = 'sets_reps'
  }

  return { tier, exercises }
}

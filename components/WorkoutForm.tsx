'use client'

import { useState } from 'react'
import { Plus, X, Dumbbell } from 'lucide-react'
import { ExerciseAutocomplete } from './ExerciseAutocomplete'
import type { WorkoutExerciseDraft, WorkoutLogTier } from '@/lib/workoutPost'

export type { WorkoutLogTier } from '@/lib/workoutPost'

interface WorkoutFormProps {
  tier: WorkoutLogTier
  onTierChange: (tier: WorkoutLogTier) => void
  exercises: WorkoutExerciseDraft[]
  onChange: (exercises: WorkoutExerciseDraft[]) => void
  userId?: string
}

function blankExercise(order: number, tier: WorkoutLogTier): WorkoutExerciseDraft {
  return {
    exercise_name: '',
    order_index: order,
    sets_data: [{ weight: null, reps: null }],
    set_count: tier === 'sets_reps' ? 3 : null,
    reps_per_set: tier === 'sets_reps' ? 10 : null,
  }
}

const TIER_OPTIONS: { id: WorkoutLogTier; label: string; hint: string }[] = [
  { id: 'none', label: 'None', hint: 'No workout log' },
  { id: 'names', label: 'Names only', hint: 'Exercises you did' },
  { id: 'sets_reps', label: 'Sets & reps', hint: 'No weights' },
  { id: 'full', label: 'Full log', hint: 'Weight, reps, sets' },
]

export function WorkoutForm({ tier, onTierChange, exercises, onChange, userId }: WorkoutFormProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const setTier = (next: WorkoutLogTier) => {
    if (next === tier) return
    if (next === 'none') {
      onChange([])
      onTierChange('none')
      return
    }
    if (next === 'names') {
      onChange(
        exercises.map((ex, i) => ({
          exercise_name: ex.exercise_name,
          order_index: i,
          sets_data: [{ weight: null, reps: null }],
          set_count: null,
          reps_per_set: null,
        }))
      )
      onTierChange('names')
      return
    }
    if (next === 'sets_reps') {
      onChange(
        exercises.map((ex, i) => ({
          exercise_name: ex.exercise_name,
          order_index: i,
          sets_data: [{ weight: null, reps: null }],
          set_count: ex.set_count ?? 3,
          reps_per_set: ex.reps_per_set ?? 10,
        }))
      )
      onTierChange('sets_reps')
      return
    }
    onChange(
      exercises.map((ex, i) => ({
        exercise_name: ex.exercise_name,
        order_index: i,
        sets_data:
          ex.sets_data?.length && ex.sets_data.some((s) => s.weight != null || s.reps != null)
            ? ex.sets_data
            : [{ weight: null, reps: null }],
        set_count: null,
        reps_per_set: null,
      }))
    )
    onTierChange('full')
  }

  const addExercise = () => {
    onChange([...exercises, blankExercise(exercises.length, tier)])
  }

  const removeExercise = (index: number) => {
    const next = exercises.filter((_, i) => i !== index)
    next.forEach((ex, i) => {
      ex.order_index = i
    })
    onChange(next)
  }

  const updateExercise = (index: number, patch: Partial<WorkoutExerciseDraft>) => {
    const next = [...exercises]
    next[index] = { ...next[index], ...patch }
    onChange(next)
  }

  const addSet = (exerciseIndex: number) => {
    const next = [...exercises]
    next[exerciseIndex].sets_data = [...next[exerciseIndex].sets_data, { weight: null, reps: null }]
    onChange(next)
  }

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const next = [...exercises]
    if (next[exerciseIndex].sets_data.length > 1) {
      next[exerciseIndex].sets_data = next[exerciseIndex].sets_data.filter((_, i) => i !== setIndex)
      onChange(next)
    }
  }

  const updateSet = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: number | null) => {
    const next = [...exercises]
    next[exerciseIndex].sets_data[setIndex] = {
      ...next[exerciseIndex].sets_data[setIndex],
      [field]: value,
    }
    onChange(next)
  }

  const calculateExerciseVolume = (sets: { weight: number | null; reps: number | null }[]) => {
    return sets.reduce((total, set) => {
      const weight = set.weight || 0
      const reps = set.reps || 0
      return total + weight * reps
    }, 0)
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Dumbbell className="w-5 h-5 text-white/60 shrink-0" />
          <h3 className="text-white font-semibold text-sm md:text-base truncate uppercase tracking-wide">
            Workout (optional)
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs md:text-sm text-white/50 hover:text-white/90 transition-colors shrink-0 uppercase tracking-wide"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          <p className="text-[11px] md:text-xs text-white/45 leading-relaxed">
            Pick how much you want to log. You can always post with no workout block.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TIER_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTier(opt.id)}
                className={`btn btn-tier ${tier === opt.id ? 'btn-tier-active' : ''}`}
              >
                <span className="btn-tier-title">{opt.label}</span>
                <span className="btn-tier-desc">{opt.hint}</span>
              </button>
            ))}
          </div>

          {tier !== 'none' && (
            <div className="space-y-3 pt-1">
              {exercises.map((exercise, exerciseIndex) => {
                const exerciseVolume = tier === 'full' ? calculateExerciseVolume(exercise.sets_data) : 0

                return (
                  <div
                    key={exerciseIndex}
                    className="rounded-xl border border-white/[0.08] bg-black/30 p-3 md:p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                        Exercise {exerciseIndex + 1}
                      </span>
                      {exercises.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeExercise(exerciseIndex)}
                          className="text-red-400/90 hover:text-red-300 transition-colors p-1"
                          aria-label="Remove exercise"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-white/45 mb-1">Name</label>
                      <ExerciseAutocomplete
                        value={exercise.exercise_name}
                        onChange={(value) => updateExercise(exerciseIndex, { exercise_name: value })}
                        placeholder="e.g. Bench press"
                        className="input-field w-full text-sm"
                        userId={userId}
                      />
                    </div>

                    {tier === 'sets_reps' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-medium text-white/45 mb-1">Sets</label>
                          <input
                            type="number"
                            min={1}
                            value={exercise.set_count ?? ''}
                            onChange={(e) =>
                              updateExercise(exerciseIndex, {
                                set_count: e.target.value ? parseInt(e.target.value, 10) : null,
                              })
                            }
                            placeholder="3"
                            className="input-field w-full text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-white/45 mb-1">Reps / set</label>
                          <input
                            type="number"
                            min={1}
                            value={exercise.reps_per_set ?? ''}
                            onChange={(e) =>
                              updateExercise(exerciseIndex, {
                                reps_per_set: e.target.value ? parseInt(e.target.value, 10) : null,
                              })
                            }
                            placeholder="10"
                            className="input-field w-full text-sm"
                          />
                        </div>
                      </div>
                    )}

                    {tier === 'full' && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-[10px] font-medium text-white/45">Sets</label>
                          <button
                            type="button"
                            onClick={() => addSet(exerciseIndex)}
                            className="text-[10px] font-semibold text-white/55 hover:text-white flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Add set
                          </button>
                        </div>
                        <div className="space-y-2">
                          {exercise.sets_data.map((set, setIndex) => (
                            <div key={setIndex} className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-2">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] text-white/40">Set {setIndex + 1}</span>
                                {exercise.sets_data.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeSet(exerciseIndex, setIndex)}
                                    className="text-red-400/80 hover:text-red-300 p-0.5"
                                    aria-label="Remove set"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[9px] uppercase tracking-wide text-white/35 mb-0.5">
                                    Weight (lb)
                                  </label>
                                  <input
                                    type="number"
                                    value={set.weight ?? ''}
                                    onChange={(e) =>
                                      updateSet(
                                        exerciseIndex,
                                        setIndex,
                                        'weight',
                                        e.target.value ? parseFloat(e.target.value) : null
                                      )
                                    }
                                    placeholder="—"
                                    min="0"
                                    step="0.5"
                                    className="input-field w-full text-xs py-2"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] uppercase tracking-wide text-white/35 mb-0.5">
                                    Reps
                                  </label>
                                  <input
                                    type="number"
                                    value={set.reps ?? ''}
                                    onChange={(e) =>
                                      updateSet(
                                        exerciseIndex,
                                        setIndex,
                                        'reps',
                                        e.target.value ? parseInt(e.target.value, 10) : null
                                      )
                                    }
                                    placeholder="—"
                                    min="1"
                                    className="input-field w-full text-xs py-2"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {exerciseVolume > 0 && (
                          <p className="mt-2 text-[10px] text-white/45">
                            Volume{' '}
                            <span className="text-white/80 font-semibold tabular-nums">{exerciseVolume.toLocaleString()} lb</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              <button
                type="button"
                onClick={addExercise}
                className="btn btn-dashed gap-2"
              >
                <Plus className="w-4 h-4" />
                ADD EXERCISE
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

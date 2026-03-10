'use client'

import { useState } from 'react'
import { ChevronDown, Plus, Trash2 } from 'lucide-react'
import { ExerciseAutocomplete } from '@/components/ExerciseAutocomplete'
import type { SetEntry, WorkoutExerciseEntry } from './types'

interface ActiveWorkoutViewProps {
  exercises: WorkoutExerciseEntry[]
  onExercisesChange: (exercises: WorkoutExerciseEntry[]) => void
  onFinishWorkout: () => void
  onAddExercise: () => void
  previousBestByExercise: Record<string, string>
  onSaveSet?: (exerciseId: string, set: SetEntry) => void
}

function SetRow({
  set,
  setIndex,
  onUpdate,
  onRemove,
  canRemove,
}: {
  set: SetEntry
  setIndex: number
  onUpdate: (field: 'weight' | 'reps' | 'rpe' | 'note', value: string) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/5 overflow-hidden">
      <div className="flex items-center gap-2 p-2 sm:p-3">
        <span className="text-white/50 text-sm w-6 tabular-nums">{setIndex + 1}</span>
        <input
          type="number"
          value={set.weight}
          onChange={(e) => onUpdate('weight', e.target.value)}
          placeholder="Weight"
          min="0"
          step="2.5"
          className="input-field flex-1 min-w-0 py-2.5 text-base"
        />
        <span className="text-white/40 text-sm">×</span>
        <input
          type="number"
          value={set.reps}
          onChange={(e) => onUpdate('reps', e.target.value)}
          placeholder="Reps"
          min="1"
          className="input-field w-16 sm:w-20 py-2.5 text-base tabular-nums"
        />
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          title="RPE & notes"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-white/5 transition-colors"
            aria-label="Remove set"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      {showAdvanced && (
        <div className="px-3 pb-3 pt-0 flex flex-wrap gap-2 border-t border-white/5 pt-2 mt-0">
          <select
            value={set.rpe}
            onChange={(e) => onUpdate('rpe', e.target.value)}
            className="input-field w-24 text-sm py-1.5"
            title="RPE"
          >
            <option value="">RPE</option>
            {[10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <input
            type="text"
            value={set.note ?? ''}
            onChange={(e) => onUpdate('note', e.target.value)}
            placeholder="Note (optional)"
            className="input-field flex-1 min-w-[120px] text-sm py-1.5"
          />
        </div>
      )}
    </div>
  )
}

export function ActiveWorkoutView({
  exercises,
  onExercisesChange,
  onFinishWorkout,
  onAddExercise,
  previousBestByExercise,
}: ActiveWorkoutViewProps) {
  const updateExercise = (index: number, updates: Partial<WorkoutExerciseEntry>) => {
    const next = [...exercises]
    next[index] = { ...next[index], ...updates }
    onExercisesChange(next)
  }

  const updateSet = (exIndex: number, setIndex: number, field: 'weight' | 'reps' | 'rpe' | 'note', value: string) => {
    const next = [...exercises]
    const sets = [...next[exIndex].sets]
    sets[setIndex] = { ...sets[setIndex], [field]: value }
    next[exIndex] = { ...next[exIndex], sets }
    onExercisesChange(next)
  }

  const addSet = (exIndex: number) => {
    const next = [...exercises]
    next[exIndex].sets.push({ weight: '', reps: '', rpe: '' })
    onExercisesChange(next)
  }

  const removeSet = (exIndex: number, setIndex: number) => {
    const next = [...exercises]
    if (next[exIndex].sets.length <= 1) return
    next[exIndex].sets = next[exIndex].sets.filter((_, i) => i !== setIndex)
    onExercisesChange(next)
  }

  const removeExercise = (exIndex: number) => {
    onExercisesChange(exercises.filter((_, i) => i !== exIndex))
  }

  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.weight && s.reps).length, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Active Workout</h2>
        <button
          type="button"
          onClick={onFinishWorkout}
          className="text-sm font-medium text-white bg-white/15 hover:bg-white/20 px-4 py-2 rounded-xl transition-colors"
        >
          Finish &amp; see summary
        </button>
      </div>

      {exercises.map((ex, exIndex) => (
        <div
          key={ex.id}
          className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden"
        >
          <div className="p-4 border-b border-white/5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <ExerciseAutocomplete
                  value={ex.exercise_name}
                  onChange={(name) => updateExercise(exIndex, { exercise_name: name })}
                  placeholder="Exercise name"
                  className="input-field w-full font-medium"
                />
                {previousBestByExercise[ex.exercise_name] && (
                  <p className="text-xs text-white/50 mt-1.5">
                    Previous: {previousBestByExercise[ex.exercise_name]}
                  </p>
                )}
              </div>
              {exercises.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeExercise(exIndex)}
                  className="p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-white/5 shrink-0"
                  aria-label="Remove exercise"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="p-4 space-y-2">
            {ex.sets.map((set, setIndex) => (
              <SetRow
                key={`${ex.id}-${setIndex}`}
                set={set}
                setIndex={setIndex}
                onUpdate={(field, value) => updateSet(exIndex, setIndex, field, value)}
                onRemove={() => removeSet(exIndex, setIndex)}
                canRemove={ex.sets.length > 1}
              />
            ))}
            <button
              type="button"
              onClick={() => addSet(exIndex)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-white/20 text-white/60 hover:text-white hover:border-white/30 hover:bg-white/5 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add set
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={onAddExercise}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/15 text-white/80 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
      >
        <Plus className="w-5 h-5" />
        Add exercise
      </button>

      <button
        type="button"
        onClick={onFinishWorkout}
        disabled={totalSets === 0}
        className="w-full btn-primary py-3.5 font-bold text-base disabled:opacity-50"
      >
        Finish workout {totalSets > 0 ? `(${totalSets} set${totalSets !== 1 ? 's' : ''})` : ''}
      </button>
    </div>
  )
}

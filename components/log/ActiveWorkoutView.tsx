'use client'

import { useState } from 'react'
import { ChevronDown, Plus, Trash2, History } from 'lucide-react'
import { ExerciseAutocomplete } from '@/components/ExerciseAutocomplete'
import { ExerciseHistorySheet } from '@/components/log/ExerciseHistorySheet'
import { PrimeSetRow } from '@/components/log/PrimeSetRow'
import type { LiftRow } from '@/lib/liftChartData'
import { createEmptySet, countValidSets } from '@/lib/buildLiftLogRows'
import { getLoggingModeForExercise, isPrimeRangeExercise } from '@/lib/exercises'
import { SessionDatePicker } from '@/components/log/SessionDatePicker'
import type { SetEntry, WorkoutExerciseEntry } from './types'

interface ActiveWorkoutViewProps {
  exercises: WorkoutExerciseEntry[]
  onExercisesChange: (exercises: WorkoutExerciseEntry[]) => void
  onFinishWorkout: () => void
  onAddExercise: () => void
  previousBestByExercise: Record<string, string>
  workoutSubtitle?: string
  sessionDate: string
  onSessionDateChange: (date: string) => void
  allLifts?: LiftRow[]
  userId?: string
  recentExerciseNames?: string[]
}

type SetField =
  | 'weight'
  | 'reps'
  | 'rpe'
  | 'note'
  | 'weight_beginning'
  | 'weight_middle'
  | 'weight_end'

function SetRow({
  set,
  setIndex,
  onUpdate,
  onRemove,
  canRemove,
}: {
  set: SetEntry
  setIndex: number
  onUpdate: (field: SetField, value: string) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/5 overflow-hidden">
      <div className="flex items-center gap-2 p-2 sm:p-3">
        <span className="text-white/50 text-sm w-14 shrink-0 tabular-nums truncate" title={set.note}>
          {set.note || setIndex + 1}
        </span>
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
              <option key={v} value={v}>
                {v}
              </option>
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
  workoutSubtitle,
  sessionDate,
  onSessionDateChange,
  allLifts = [],
  userId,
  recentExerciseNames = [],
}: ActiveWorkoutViewProps) {
  const [historyExercise, setHistoryExercise] = useState<string | null>(null)

  const updateExercise = (index: number, updates: Partial<WorkoutExerciseEntry>) => {
    const next = [...exercises]
    const prev = next[index]
    const merged = { ...prev, ...updates }
    if (updates.exercise_name != null && updates.exercise_name !== prev.exercise_name) {
      const wasPrime = isPrimeRangeExercise(prev.exercise_name)
      const isPrime = isPrimeRangeExercise(updates.exercise_name)
      if (wasPrime !== isPrime) {
        merged.sets = prev.sets.map(() => createEmptySet(updates.exercise_name!))
      }
    }
    next[index] = merged
    onExercisesChange(next)
  }

  const updateSet = (exIndex: number, setIndex: number, field: SetField, value: string) => {
    const next = [...exercises]
    const sets = [...next[exIndex].sets]
    sets[setIndex] = { ...sets[setIndex], [field]: value }
    next[exIndex] = { ...next[exIndex], sets }
    onExercisesChange(next)
  }

  const addSet = (exIndex: number) => {
    const next = [...exercises]
    const name = next[exIndex].exercise_name
    next[exIndex].sets.push(createEmptySet(name))
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

  const totalSets = exercises.reduce(
    (acc, ex) => acc + countValidSets(ex.exercise_name, ex.sets),
    0
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="log-screen-section-title">Active workout</h2>
          {workoutSubtitle && <p className="log-screen-meta mt-1 truncate">{workoutSubtitle}</p>}
        </div>
        <button type="button" onClick={onFinishWorkout} className="btn btn-secondary btn-sm shrink-0">
          Finish &amp; see summary
        </button>
      </div>

      <SessionDatePicker value={sessionDate} onChange={onSessionDateChange} />

      {exercises.map((ex, exIndex) => {
        const prime = getLoggingModeForExercise(ex.exercise_name) === 'prime_range'
        return (
          <div
            key={ex.id}
            className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden"
          >
            <div className="p-4 border-b border-white/5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <label className="label-caps block mb-2">Exercise</label>
                  <ExerciseAutocomplete
                    value={ex.exercise_name}
                    onChange={(name) => updateExercise(exIndex, { exercise_name: name })}
                    placeholder="Exercise name"
                    className="input-field w-full font-medium"
                    userId={userId}
                    recentExerciseNames={recentExerciseNames}
                  />
                  {prime && (
                    <p className="ui-meta mt-2">Prime: log beginning, middle, and end stack weights per set.</p>
                  )}
                  {ex.exercise_name.trim() && (
                    <button
                      type="button"
                      onClick={() => setHistoryExercise(ex.exercise_name.trim())}
                      className="mt-2 w-full text-left rounded-lg px-2 py-2 -mx-2 hover:bg-white/5 transition-colors group"
                    >
                      <span className="flex items-center gap-1.5 ui-body-medium text-white">
                        <History className="w-4 h-4 text-white/50 shrink-0" />
                        {ex.exercise_name.trim()}
                      </span>
                      <span className="block ui-meta mt-0.5 pl-5">Past sets, reps &amp; RPE by day</span>
                    </button>
                  )}
                  {previousBestByExercise[ex.exercise_name] && (
                    <p className="ui-meta mt-1">Last best: {previousBestByExercise[ex.exercise_name]}</p>
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
              {ex.sets.map((set, setIndex) =>
                prime ? (
                  <PrimeSetRow
                    key={`${ex.id}-${setIndex}`}
                    set={set}
                    setIndex={setIndex}
                    onUpdate={(field, value) => updateSet(exIndex, setIndex, field, value)}
                    onRemove={() => removeSet(exIndex, setIndex)}
                    canRemove={ex.sets.length > 1}
                  />
                ) : (
                  <SetRow
                    key={`${ex.id}-${setIndex}`}
                    set={set}
                    setIndex={setIndex}
                    onUpdate={(field, value) => updateSet(exIndex, setIndex, field, value)}
                    onRemove={() => removeSet(exIndex, setIndex)}
                    canRemove={ex.sets.length > 1}
                  />
                )
              )}
              <button type="button" onClick={() => addSet(exIndex)} className="btn btn-dashed gap-2">
                <Plus className="w-4 h-4" />
                Add set
              </button>
            </div>
          </div>
        )
      })}

      <button type="button" onClick={onAddExercise} className="btn btn-secondary btn-block gap-2">
        <Plus className="w-5 h-5" />
        Add exercise
      </button>

      <button
        type="button"
        onClick={onFinishWorkout}
        disabled={totalSets === 0}
        className="w-full btn btn-primary btn-block disabled:opacity-50"
      >
        Finish workout {totalSets > 0 ? `(${totalSets} set${totalSets !== 1 ? 's' : ''})` : ''}
      </button>

      <ExerciseHistorySheet
        exerciseName={historyExercise || ''}
        allLifts={allLifts}
        open={Boolean(historyExercise)}
        onClose={() => setHistoryExercise(null)}
      />
    </div>
  )
}

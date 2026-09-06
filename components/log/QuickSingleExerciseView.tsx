'use client'

import { Plus, Trash2 } from 'lucide-react'
import { ExerciseAutocomplete } from '@/components/ExerciseAutocomplete'
import { PrimeSetRow } from '@/components/log/PrimeSetRow'
import { createEmptySet, countValidSets } from '@/lib/buildLiftLogRows'
import { getLoggingModeForExercise } from '@/lib/exercises'
import { SessionDatePicker } from '@/components/log/SessionDatePicker'
import type { SetEntry } from './types'

type SetField =
  | 'weight'
  | 'reps'
  | 'rpe'
  | 'note'
  | 'weight_beginning'
  | 'weight_middle'
  | 'weight_end'

interface QuickSingleExerciseViewProps {
  exerciseName: string
  onExerciseNameChange: (name: string) => void
  sets: SetEntry[]
  onSetsChange: (sets: SetEntry[]) => void
  onLog: () => void
  onBack: () => void
  previousBest: string | null
  loading?: boolean
  sessionDate: string
  onSessionDateChange: (date: string) => void
  userId?: string
  recentExerciseNames?: string[]
}

export function QuickSingleExerciseView({
  exerciseName,
  onExerciseNameChange,
  sets,
  onSetsChange,
  onLog,
  onBack,
  previousBest,
  loading = false,
  sessionDate,
  onSessionDateChange,
  userId,
  recentExerciseNames = [],
}: QuickSingleExerciseViewProps) {
  const prime = getLoggingModeForExercise(exerciseName) === 'prime_range'

  const handleNameChange = (name: string) => {
    onExerciseNameChange(name)
    const nextPrime = getLoggingModeForExercise(name) === 'prime_range'
    if (nextPrime !== prime) {
      onSetsChange([createEmptySet(name)])
    }
  }

  const addSet = () => onSetsChange([...sets, createEmptySet(exerciseName)])
  const removeSet = (i: number) => onSetsChange(sets.filter((_, idx) => idx !== i))
  const updateSet = (i: number, field: SetField, value: string) =>
    onSetsChange(sets.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)))

  const validCount = countValidSets(exerciseName, sets)

  return (
    <div className="space-y-5 animate-fade-in">
      <button type="button" onClick={onBack} className="ui-body text-sm text-white/60 hover:text-white">
        ← Back
      </button>

      <SessionDatePicker value={sessionDate} onChange={onSessionDateChange} />

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <label className="label-caps block mb-2">Exercise</label>
          <ExerciseAutocomplete
            value={exerciseName}
            onChange={handleNameChange}
            placeholder="e.g., Bench Press"
            className="input-field w-full font-medium"
            userId={userId}
            recentExerciseNames={recentExerciseNames}
          />
          {prime && (
            <p className="ui-meta mt-2">Prime: log beginning, middle, and end stack weights per set.</p>
          )}
          {previousBest && <p className="ui-meta mt-1.5">Previous: {previousBest}</p>}
        </div>
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="label-caps">Sets</span>
            <button
              type="button"
              onClick={addSet}
              className="action-text text-white/70 hover:text-white flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add set
            </button>
          </div>
          {sets.map((s, i) =>
            prime ? (
              <PrimeSetRow
                key={i}
                set={s}
                setIndex={i}
                onUpdate={(field, value) => updateSet(i, field, value)}
                onRemove={() => removeSet(i)}
                canRemove={sets.length > 1}
              />
            ) : (
              <div
                key={i}
                className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/5"
              >
                <span className="text-white/50 text-sm w-6 tabular-nums">{i + 1}</span>
                <input
                  type="number"
                  value={s.weight}
                  onChange={(e) => updateSet(i, 'weight', e.target.value)}
                  placeholder="Weight"
                  min="0"
                  step="2.5"
                  className="input-field flex-1 min-w-0 py-2"
                />
                <span className="text-white/40 text-sm">×</span>
                <input
                  type="number"
                  value={s.reps}
                  onChange={(e) => updateSet(i, 'reps', e.target.value)}
                  placeholder="Reps"
                  min="1"
                  className="input-field w-16 py-2 tabular-nums"
                />
                <select
                  value={s.rpe}
                  onChange={(e) => updateSet(i, 'rpe', e.target.value)}
                  className="input-field w-20 flex-shrink-0 py-2 text-sm"
                  title="RPE"
                >
                  <option value="">RPE</option>
                  {[10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                {sets.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSet(i)}
                    className="p-1.5 text-white/50 hover:text-red-400 rounded-lg"
                    aria-label="Remove set"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onLog}
        disabled={loading || validCount === 0}
        className="w-full btn btn-primary btn-block disabled:opacity-50"
      >
        {loading ? 'Logging…' : `Log ${validCount} set${validCount !== 1 ? 's' : ''}`}
      </button>
    </div>
  )
}

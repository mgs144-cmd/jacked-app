'use client'

import { useState } from 'react'
import { Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { ExerciseAutocomplete } from '@/components/ExerciseAutocomplete'
import {
  type ProgramDay,
  type ProgramExercise,
  type TrainingProgramJson,
  DEFAULT_TRAINING_GOAL,
  defaultScheme,
  muscleVolumeForDay,
  parseRepTarget,
} from '@/lib/trainingProgram'

interface ProgramBuilderProps {
  name: string
  program: TrainingProgramJson
  onNameChange: (v: string) => void
  onProgramChange: (p: TrainingProgramJson) => void
  onSave: () => void
  onCancel: () => void
  saving?: boolean
}

function newExercise(): ProgramExercise {
  const s = defaultScheme(DEFAULT_TRAINING_GOAL)
  return {
    id: crypto.randomUUID(),
    exercise_name: '',
    target_sets: s.sets,
    target_reps: s.reps,
    rest_sec: s.rest,
  }
}

export function ProgramBuilder({
  name,
  program,
  onNameChange,
  onProgramChange,
  onSave,
  onCancel,
  saving,
}: ProgramBuilderProps) {
  const [expandedDay, setExpandedDay] = useState<string | null>(program.days[0]?.id ?? null)

  const updateDay = (dayId: string, patch: Partial<ProgramDay>) => {
    onProgramChange({
      days: program.days.map((d) => (d.id === dayId ? { ...d, ...patch } : d)),
    })
  }

  const updateExercise = (dayId: string, exId: string, patch: Partial<ProgramExercise>) => {
    onProgramChange({
      days: program.days.map((d) =>
        d.id === dayId
          ? {
              ...d,
              exercises: d.exercises.map((ex) => (ex.id === exId ? { ...ex, ...patch } : ex)),
            }
          : d
      ),
    })
  }

  const addDay = () => {
    const id = crypto.randomUUID()
    onProgramChange({
      days: [...program.days, { id, label: `Day ${program.days.length + 1}`, exercises: [newExercise()] }],
    })
    setExpandedDay(id)
  }

  const removeDay = (dayId: string) => {
    if (program.days.length <= 1) return
    onProgramChange({ days: program.days.filter((d) => d.id !== dayId) })
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <input
        className="input-field w-full text-base font-semibold"
        placeholder="Program name (e.g. PPL, Upper/Lower)"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
      />
      <p className="log-screen-support text-xs -mt-2">
        Add split days and exercises with target sets and reps. Use them when starting today&apos;s workout.
      </p>

      {program.days.map((day) => {
        const open = expandedDay === day.id
        const volume = muscleVolumeForDay(day)
        return (
          <div key={day.id} className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
            <button
              type="button"
              onClick={() => setExpandedDay(open ? null : day.id)}
              className="btn btn-row"
            >
              <input
                className="bg-transparent font-semibold text-white flex-1 min-w-0"
                value={day.label}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => updateDay(day.id, { label: e.target.value })}
              />
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-white/40">{day.exercises.filter((e) => e.exercise_name).length} lifts</span>
                {open ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
              </div>
            </button>

            {open && (
              <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                {volume.length > 0 && (
                  <div className="rounded-xl bg-black/30 px-3 py-2 space-y-1">
                    <p className="log-screen-eyebrow">Sets by muscle</p>
                    {volume.map((v) => (
                      <div key={v.muscle} className="flex justify-between text-xs text-white/60">
                        <span>{v.muscle}</span>
                        <span className="tabular-nums">{v.sets} sets</span>
                      </div>
                    ))}
                  </div>
                )}

                {day.exercises.map((ex) => (
                  <div key={ex.id} className="rounded-xl border border-white/[0.08] p-3 space-y-2 bg-black/20">
                    <ExerciseAutocomplete
                      value={ex.exercise_name}
                      onChange={(n) => updateExercise(day.id, ex.id, { exercise_name: n })}
                      placeholder="Exercise"
                      className="input-field w-full text-sm"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-white/40 block mb-1">Sets</label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          className="input-field w-full text-sm"
                          value={ex.target_sets}
                          onChange={(e) =>
                            updateExercise(day.id, ex.id, { target_sets: parseInt(e.target.value, 10) || 1 })
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] text-white/40 block mb-1">Reps</label>
                        <input
                          className="input-field w-full text-sm"
                          placeholder="8-12"
                          value={ex.target_reps}
                          onChange={(e) => updateExercise(day.id, ex.id, { target_reps: e.target.value })}
                        />
                      </div>
                    </div>
                    {day.exercises.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          updateDay(day.id, { exercises: day.exercises.filter((x) => x.id !== ex.id) })
                        }
                        className="text-xs text-red-400/80 hover:text-red-400"
                      >
                        Remove exercise
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => updateDay(day.id, { exercises: [...day.exercises, newExercise()] })}
                  className="btn btn-dashed gap-1"
                >
                  <Plus className="w-4 h-4" /> Add exercise
                </button>

                {program.days.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDay(day.id)}
                    className="text-xs text-white/40 hover:text-red-400"
                  >
                    Delete this day
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}

      <button
        type="button"
        onClick={addDay}
        className="btn btn-dashed"
      >
        + Add split day
      </button>

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 btn btn-secondary">
          Cancel
        </button>
        <button
          type="button"
          disabled={saving || !name.trim()}
          onClick={onSave}
          className="flex-1 btn btn-primary disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save program'}
        </button>
      </div>
    </div>
  )
}

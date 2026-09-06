'use client'

import { Plus, X, GitBranch } from 'lucide-react'
import { ExerciseAutocomplete } from '@/components/ExerciseAutocomplete'
import {
  type TemplateDayExercise,
  type WorkoutDayTemplateJson,
  getSlotOptions,
  isVariationSlot,
  templateHasValidSlots,
} from '@/lib/workoutDayTemplates'

interface TemplateDayBuilderProps {
  label: string
  template: WorkoutDayTemplateJson
  onLabelChange: (v: string) => void
  onTemplateChange: (t: WorkoutDayTemplateJson) => void
  onSave: () => void
  onCancel: () => void
  saving?: boolean
}

function newExercise(): TemplateDayExercise {
  return {
    id: crypto.randomUUID(),
    exercise_name: '',
    target_sets: null,
    target_reps: null,
  }
}

export function TemplateDayBuilder({
  label,
  template,
  onLabelChange,
  onTemplateChange,
  onSave,
  onCancel,
  saving,
}: TemplateDayBuilderProps) {
  const updateExercise = (id: string, patch: Partial<TemplateDayExercise>) => {
    onTemplateChange({
      exercises: template.exercises.map((ex) => (ex.id === id ? { ...ex, ...patch } : ex)),
    })
  }

  const addExercise = () => {
    onTemplateChange({ exercises: [...template.exercises, newExercise()] })
  }

  const removeExercise = (id: string) => {
    if (template.exercises.length <= 1) return
    onTemplateChange({ exercises: template.exercises.filter((ex) => ex.id !== id) })
  }

  const enableVariations = (id: string) => {
    const ex = template.exercises.find((e) => e.id === id)
    if (!ex) return
    const seed = ex.exercise_name.trim()
    updateExercise(id, {
      exercise_name: '',
      alternatives: seed ? [seed, ''] : ['', ''],
    })
  }

  const addVariationOption = (id: string) => {
    const ex = template.exercises.find((e) => e.id === id)
    if (!ex) return
    const alts = [...(ex.alternatives ?? getSlotOptions(ex)), '']
    updateExercise(id, { exercise_name: '', alternatives: alts })
  }

  const updateVariationOption = (id: string, index: number, value: string) => {
    const ex = template.exercises.find((e) => e.id === id)
    if (!ex) return
    const alts = [...(ex.alternatives ?? getSlotOptions(ex))]
    alts[index] = value
    updateExercise(id, { alternatives: alts })
  }

  const removeVariationOption = (id: string, index: number) => {
    const ex = template.exercises.find((e) => e.id === id)
    if (!ex) return
    const alts = (ex.alternatives ?? getSlotOptions(ex)).filter((_, i) => i !== index)
    if (alts.length <= 1) {
      updateExercise(id, {
        exercise_name: alts[0] ?? '',
        alternatives: undefined,
      })
      return
    }
    updateExercise(id, { alternatives: alts })
  }

  const onSetsInputChange = (id: string, raw: string) => {
    if (raw === '') {
      updateExercise(id, { target_sets: null })
      return
    }
    const n = parseInt(raw, 10)
    if (Number.isFinite(n) && n > 0) {
      updateExercise(id, { target_sets: n })
    }
  }

  const setsInputValue = (ex: TemplateDayExercise) =>
    ex.target_sets != null && ex.target_sets > 0 ? String(ex.target_sets) : ''

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <p className="log-screen-section-title text-sm">Template day</p>
        <h2 className="ui-section-title mt-0.5">Build template</h2>
        <p className="text-xs text-white/45 mt-1">
          List exercises or add alternatives (pick one when you start the workout). Sets and reps are optional.
        </p>
      </div>

      <input
        className="input-field w-full text-base font-semibold uppercase"
        placeholder="PULL DAY"
        value={label}
        onChange={(e) => onLabelChange(e.target.value)}
      />

      <div className="space-y-2">
        {template.exercises.map((ex, i) => {
          const variation = isVariationSlot(ex)
          const alts = ex.alternatives ?? (variation ? getSlotOptions(ex) : [])

          return (
            <div
              key={ex.id}
              className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
                  {variation ? `Pick one · slot ${i + 1}` : `Exercise ${i + 1}`}
                </span>
                {template.exercises.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExercise(ex.id)}
                    className="p-1 text-white/35 hover:text-red-400"
                    aria-label="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {variation ? (
                <div className="space-y-2">
                  <p className="text-[10px] text-white/40">Choose one of these on workout day:</p>
                  {alts.map((alt, vi) => (
                    <div key={vi} className="flex gap-2 items-start">
                      <ExerciseAutocomplete
                        value={alt}
                        onChange={(v) => updateVariationOption(ex.id, vi, v)}
                        placeholder={`Option ${vi + 1}`}
                        className="input-field flex-1 text-sm"
                      />
                      {alts.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeVariationOption(ex.id, vi)}
                          className="p-2 text-white/35 hover:text-red-400 shrink-0"
                          aria-label="Remove option"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addVariationOption(ex.id)}
                    className="text-xs font-medium text-white/55 hover:text-white flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add option
                  </button>
                </div>
              ) : (
                <>
                  <ExerciseAutocomplete
                    value={ex.exercise_name}
                    onChange={(v) => updateExercise(ex.id, { exercise_name: v })}
                    placeholder="e.g. Barbell row"
                    className="input-field w-full text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => enableVariations(ex.id)}
                    className="text-xs font-medium text-white/55 hover:text-white flex items-center gap-1.5"
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    Add alternatives (pick one on workout day)
                  </button>
                </>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
                <div>
                  <label className="block text-[10px] font-medium text-white/40 mb-1">
                    Sets <span className="text-white/25">(optional)</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={setsInputValue(ex)}
                    onChange={(e) => onSetsInputChange(ex.id, e.target.value)}
                    placeholder="—"
                    className="input-field w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-white/40 mb-1">
                    Reps note <span className="text-white/25">(optional)</span>
                  </label>
                  <input
                    value={ex.target_reps ?? ''}
                    onChange={(e) =>
                      updateExercise(ex.id, {
                        target_reps: e.target.value.trim() ? e.target.value : null,
                      })
                    }
                    placeholder="e.g. 8-12"
                    className="input-field w-full text-sm"
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <button
        type="button"
        onClick={addExercise}
        className="btn btn-dashed gap-2"
      >
        <Plus className="w-4 h-4" />
        ADD EXERCISE
      </button>

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 btn btn-secondary">
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !label.trim() || !templateHasValidSlots(template)}
          className="flex-1 btn btn-primary disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save template'}
        </button>
      </div>
    </div>
  )
}

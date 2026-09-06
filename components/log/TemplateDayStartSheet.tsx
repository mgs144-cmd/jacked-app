'use client'

import { useEffect, useMemo, useState } from 'react'
import { X, List, History, Play } from 'lucide-react'
import type { WorkoutDayTemplateRow, TemplateSlotResolution } from '@/lib/workoutDayTemplates'
import {
  defaultResolutionForTemplate,
  getTemplateSlots,
  getVariationSlots,
} from '@/lib/workoutDayTemplates'
import { formatWorkoutDate } from '@/lib/workoutSessions'

type StartMode = 'blank' | 'last'

interface TemplateDayStartSheetProps {
  template: WorkoutDayTemplateRow
  lastSession: { date: string; setCount: number } | null
  onClose: () => void
  onStart: (mode: StartMode, resolved: TemplateSlotResolution) => void
}

export function TemplateDayStartSheet({
  template,
  lastSession,
  onClose,
  onStart,
}: TemplateDayStartSheetProps) {
  const variationSlots = useMemo(() => getVariationSlots(template), [template])
  const slotCount = getTemplateSlots(template).length

  const [mode, setMode] = useState<StartMode | null>(null)
  const [resolved, setResolved] = useState<TemplateSlotResolution>(() =>
    defaultResolutionForTemplate(template)
  )

  useEffect(() => {
    setResolved(defaultResolutionForTemplate(template))
    setMode(null)
  }, [template])

  const allVariationsPicked = variationSlots.every((s) => resolved[s.id]?.trim())

  const handleStart = () => {
    if (!mode || !allVariationsPicked) return
    onStart(mode, resolved)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="log-screen-eyebrow">Start workout</p>
            <h3 className="log-screen-section-title text-base mt-1">{template.label}</h3>
            <p className="log-screen-support text-xs mt-1.5">
              {slotCount} exercise slot{slotCount !== 1 ? 's' : ''}
            </p>
          </div>
          <button type="button" onClick={onClose} className="btn btn-icon" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 mb-4">
          <button
            type="button"
            onClick={() => setMode('blank')}
            className={`btn btn-choice gap-3 ${mode === 'blank' ? 'btn-choice-active' : ''}`}
          >
            <List className="w-4 h-4 text-white/50 mt-0.5 shrink-0" />
            <span>
              <span className="btn-choice-title">Blank</span>
              <span className="btn-choice-desc">Exercise list — empty sets to fill in</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => lastSession && setMode('last')}
            disabled={!lastSession}
            className={`btn btn-choice gap-3 ${mode === 'last' ? 'btn-choice-active' : ''}`}
          >
            <History className="w-4 h-4 text-white/50 mt-0.5 shrink-0" />
            <span>
              <span className="btn-choice-title">Last session</span>
              <span className="btn-choice-desc">
                {lastSession
                  ? `${formatWorkoutDate(lastSession.date)} · ${lastSession.setCount} sets`
                  : 'Log this day once to unlock'}
              </span>
            </span>
          </button>
        </div>

        {variationSlots.length > 0 && (
          <div className="mb-4 space-y-3 border-t border-white/10 pt-4">
            <p className="log-screen-eyebrow">
              Pick today&apos;s variation
            </p>
            {variationSlots.map((slot, idx) => (
              <div key={slot.id}>
                <p className="text-xs text-white/50 mb-1.5">Slot {idx + 1}</p>
                <div className="flex flex-wrap gap-1.5">
                  {slot.options.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setResolved((r) => ({ ...r, [slot.id]: name }))}
                      className={`btn btn-pill ${
                        resolved[slot.id] === name ? 'btn-pill-active bg-white text-black' : ''
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={handleStart}
          disabled={!mode || !allVariationsPicked}
          className="btn btn-primary btn-block gap-2 disabled:opacity-40"
        >
          <Play className="w-4 h-4 fill-current shrink-0" />
          Start workout
        </button>
      </div>
    </div>
  )
}

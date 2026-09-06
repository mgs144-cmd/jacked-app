'use client'

import { X } from 'lucide-react'
import { getExerciseHistory } from '@/lib/workoutSessions'
import type { LiftRow } from '@/lib/liftChartData'

interface ExerciseHistorySheetProps {
  exerciseName: string
  allLifts: LiftRow[]
  open: boolean
  onClose: () => void
}

export function ExerciseHistorySheet({ exerciseName, allLifts, open, onClose }: ExerciseHistorySheetProps) {
  if (!open || !exerciseName.trim()) return null

  const sessions = getExerciseHistory(exerciseName, allLifts)

  return (
    <div className="fixed inset-0 z-[90] flex flex-col justify-end">
      <button type="button" className="absolute inset-0 bg-black/70" onClick={onClose} aria-label="Close" />
      <div className="relative max-h-[min(70vh,520px)] w-full max-w-[640px] mx-auto rounded-t-2xl border border-white/10 bg-[#111] flex flex-col animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-white/40">History</p>
            <h3 className="ui-heading text-base text-white truncate">{exerciseName}</h3>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-white/50 hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {sessions.length === 0 ? (
            <p className="text-sm text-white/45 text-center py-8">No logged sets for this exercise yet.</p>
          ) : (
            sessions.map((session) => (
              <div key={session.date}>
                <p className="text-xs font-medium text-white/55 mb-2">{session.dateLabel}</p>
                <ul className="rounded-xl border border-white/[0.08] divide-y divide-white/[0.06] overflow-hidden">
                  {session.sets.map((s, i) => (
                    <li key={i} className="flex items-center justify-between px-3 py-2.5 text-sm bg-black/20">
                      <span className="tabular-nums text-white font-medium">
                        {s.weight} lb
                        {s.range_spot ? (
                          <span className="text-white/45 font-normal"> ({s.range_spot})</span>
                        ) : null}{' '}
                        × {s.reps}
                        {s.rpe != null ? <span className="text-white/45 font-normal"> @ {s.rpe} RPE</span> : null}
                      </span>
                      <span className="text-xs text-white/40 tabular-nums">e1RM {Math.round(s.e1rm)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

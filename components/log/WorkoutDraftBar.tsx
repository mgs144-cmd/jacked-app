'use client'

import { Cloud, Trash2 } from 'lucide-react'

interface WorkoutDraftBarProps {
  savedLabel: string | null
  onSaveNow?: () => void
  onDiscard?: () => void
  compact?: boolean
}

/** Auto-save status + optional manual save / discard for in-progress workouts. */
export function WorkoutDraftBar({ savedLabel, onSaveNow, onDiscard, compact = false }: WorkoutDraftBarProps) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] ${
        compact ? 'px-3 py-2' : 'px-4 py-3'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Cloud className="w-4 h-4 text-white/40 shrink-0" />
        <p className="ui-meta text-white/50">
          {savedLabel ? (
            <>
              Draft saved · <span className="text-white/70">{savedLabel}</span>
            </>
          ) : (
            'Saving draft…'
          )}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {onSaveNow && (
          <button type="button" onClick={onSaveNow} className="btn btn-ghost btn-sm action-text">
            Save now
          </button>
        )}
        {onDiscard && (
          <button
            type="button"
            onClick={onDiscard}
            className="btn btn-ghost btn-sm action-text text-white/45 hover:text-red-400 gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Discard
          </button>
        )}
      </div>
    </div>
  )
}

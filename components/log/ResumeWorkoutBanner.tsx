'use client'

import { Play, Trash2 } from 'lucide-react'
import { formatDraftSavedAgo } from '@/lib/workoutDraft'

interface ResumeWorkoutBannerProps {
  subtitle?: string | null
  exerciseCount: number
  updatedAt: number
  onResume: () => void
  onDiscard: () => void
}

export function ResumeWorkoutBanner({
  subtitle,
  exerciseCount,
  updatedAt,
  onResume,
  onDiscard,
}: ResumeWorkoutBannerProps) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/[0.06] p-4 space-y-3">
      <div>
        <p className="label-caps text-white/45">Workout in progress</p>
        <p className="ui-body-medium text-white mt-1">
          {subtitle || `${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''}`}
        </p>
        <p className="ui-meta mt-1">Last saved {formatDraftSavedAgo(updatedAt)} · survives refresh &amp; app close</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onResume} className="btn btn-primary gap-2 flex-1 min-w-[140px]">
          <Play className="w-4 h-4" />
          Resume workout
        </button>
        <button type="button" onClick={onDiscard} className="btn btn-ghost gap-1.5 text-white/50">
          <Trash2 className="w-4 h-4" />
          Discard
        </button>
      </div>
    </div>
  )
}

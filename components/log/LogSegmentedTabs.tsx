'use client'

import { ClipboardList, BarChart3, Sparkles } from 'lucide-react'
import type { LogSegment } from './types'

interface LogSegmentedTabsProps {
  active: LogSegment
  onChange: (segment: LogSegment) => void
}

const segments: { id: LogSegment; label: string; icon: typeof ClipboardList }[] = [
  { id: 'workout', label: 'Workout', icon: ClipboardList },
  { id: 'exercises', label: 'Exercises', icon: BarChart3 },
  { id: 'insights', label: 'Insights', icon: Sparkles },
]

export function LogSegmentedTabs({ active, onChange }: LogSegmentedTabsProps) {
  return (
    <div className="btn-tab-wrap mb-5">
      {segments.map((seg) => {
        const Icon = seg.icon
        const isActive = active === seg.id
        return (
          <button
            key={seg.id}
            type="button"
            onClick={() => onChange(seg.id)}
            className={`btn btn-tab gap-1.5 ${isActive ? 'btn-tab-active' : ''}`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {seg.label}
          </button>
        )
      })}
    </div>
  )
}

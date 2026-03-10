'use client'

import { ClipboardList, BarChart3, Sparkles } from 'lucide-react'
import type { LogSegment } from './types'

interface LogSegmentedTabsProps {
  active: LogSegment
  onChange: (segment: LogSegment) => void
}

const segments: { id: LogSegment; label: string; icon: typeof ClipboardList }[] = [
  { id: 'quick-log', label: 'Quick Log', icon: ClipboardList },
  { id: 'exercises', label: 'Exercises', icon: BarChart3 },
  { id: 'insights', label: 'Insights', icon: Sparkles },
]

export function LogSegmentedTabs({ active, onChange }: LogSegmentedTabsProps) {
  return (
    <div className="flex gap-0.5 p-1 rounded-xl bg-white/5 border border-white/5 overflow-x-auto">
      {segments.map((seg) => {
        const Icon = seg.icon
        const isActive = active === seg.id
        return (
          <button
            key={seg.id}
            type="button"
            onClick={() => onChange(seg.id)}
            className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? 'bg-white text-black'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {seg.label}
          </button>
        )
      })}
    </div>
  )
}

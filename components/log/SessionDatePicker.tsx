'use client'

import { useEffect, useState } from 'react'
import { Calendar } from 'lucide-react'
import { formatWorkoutDate, minSessionDateISO, todayISO } from '@/lib/workoutSessions'

interface SessionDatePickerProps {
  value: string
  onChange: (date: string) => void
  className?: string
}

export function SessionDatePicker({ value, onChange, className = '' }: SessionDatePickerProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const today = mounted ? todayISO() : ''
  const label = mounted && value ? formatWorkoutDate(value) : 'Select date'

  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 ${className}`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Calendar className="w-4 h-4 text-white/40 shrink-0" />
        <div className="min-w-0">
          <p className="label-caps">Workout date</p>
          <p className="ui-meta truncate">{label}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <input
          type="date"
          value={value}
          min={mounted ? minSessionDateISO() : undefined}
          max={mounted ? today : undefined}
          onChange={(e) => {
            const next = e.target.value
            if (next) onChange(next)
          }}
          className="input-field py-1.5 text-sm w-[9.5rem]"
          aria-label="Workout date"
        />
        {value !== today && (
          <button
            type="button"
            onClick={() => onChange(today)}
            className="text-xs font-medium text-white/70 hover:text-white px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            Today
          </button>
        )}
      </div>
    </div>
  )
}

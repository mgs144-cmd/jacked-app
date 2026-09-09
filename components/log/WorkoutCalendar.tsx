'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { WorkoutDaySummary } from '@/lib/workoutSessions'
import { todayISO } from '@/lib/workoutSessions'
import { buildWorkoutDayDetail, type LiftLogRecord } from '@/lib/workoutDayDetail'
import { WorkoutDayDetailPanel } from '@/components/log/WorkoutDayDetailPanel'

interface WorkoutCalendarProps {
  workoutDays: WorkoutDaySummary[]
  selectedDate: string | null
  onSelectDate: (date: string | null) => void
  liftLogs: LiftLogRecord[]
  logPosts: any[]
  onEditWorkout?: (date: string) => void
  /** Nested inside Log hub section — no extra card chrome */
  embedded?: boolean
  /** Week strip vs full month grid */
  mode?: 'week' | 'month'
}

function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function weekDates(anchorISO: string): string[] {
  const d = new Date(`${anchorISO}T12:00:00`)
  const start = new Date(d)
  start.setDate(d.getDate() - d.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(start)
    x.setDate(start.getDate() + i)
    return toISODate(x)
  })
}

function monthMatrix(year: number, month: number): (string | null)[][] {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startPad = first.getDay()
  const days: (string | null)[] = []
  for (let i = 0; i < startPad; i++) days.push(null)
  for (let d = 1; d <= last.getDate(); d++) {
    const m = String(month + 1).padStart(2, '0')
    const day = String(d).padStart(2, '0')
    days.push(`${year}-${m}-${day}`)
  }
  while (days.length % 7 !== 0) days.push(null)
  const rows: (string | null)[][] = []
  for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7))
  return rows
}

export function WorkoutCalendar({
  workoutDays,
  selectedDate,
  onSelectDate,
  liftLogs,
  logPosts,
  onEditWorkout,
  embedded = false,
  mode = 'month',
}: WorkoutCalendarProps) {
  const [mounted, setMounted] = useState(false)
  const [view, setView] = useState({ year: 2020, month: 0 })
  const [weekAnchor, setWeekAnchor] = useState('2020-01-01')

  useEffect(() => {
    const n = new Date()
    setView({ year: n.getFullYear(), month: n.getMonth() })
    setWeekAnchor(todayISO())
    setMounted(true)
  }, [])

  const today = mounted ? todayISO() : ''
  const workoutSet = useMemo(() => new Set(workoutDays.map((d) => d.date)), [workoutDays])

  const detail = useMemo(
    () => (selectedDate ? buildWorkoutDayDetail(selectedDate, liftLogs, logPosts) : null),
    [selectedDate, liftLogs, logPosts]
  )

  const matrix = monthMatrix(view.year, view.month)
  const monthLabel = new Date(view.year, view.month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const week = useMemo(() => (mounted ? weekDates(weekAnchor) : []), [mounted, weekAnchor])
  const weekLabel = useMemo(() => {
    if (!week.length) return ''
    const a = new Date(`${week[0]}T12:00:00`)
    const b = new Date(`${week[6]}T12:00:00`)
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
    return `${a.toLocaleDateString('en-US', opts)} – ${b.toLocaleDateString('en-US', opts)}`
  }, [week])

  const shiftMonth = (delta: number) => {
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }

  const shiftWeek = (delta: number) => {
    setWeekAnchor((prev) => {
      const d = new Date(`${prev}T12:00:00`)
      d.setDate(d.getDate() + delta * 7)
      return toISODate(d)
    })
  }

  if (!mounted) {
    return (
      <div className={embedded ? 'p-0' : 'rounded-2xl border border-white/10 bg-white/[0.02] p-4'}>
        <div className={`rounded-lg bg-white/[0.04] animate-pulse ${mode === 'week' ? 'h-[72px]' : 'h-[220px]'}`} aria-hidden />
      </div>
    )
  }

  const dayButton = (date: string) => {
    const hasWorkout = workoutSet.has(date)
    const isToday = date === today
    const isSelected = selectedDate === date
    return (
      <button
        key={date}
        type="button"
        onClick={() => onSelectDate(isSelected ? null : date)}
        className={`aspect-square rounded-lg text-xs font-medium transition-colors relative ${
          isSelected
            ? 'bg-white text-black'
            : isToday
              ? 'bg-white/15 text-white ring-1 ring-white/30'
              : hasWorkout
                ? 'bg-white/10 text-white hover:bg-white/15'
                : 'text-white/40 hover:bg-white/5'
        }`}
      >
        {parseInt(date.slice(8), 10)}
        {hasWorkout && !isSelected && (
          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
        )}
      </button>
    )
  }

  return (
    <div className={embedded ? 'p-0' : 'rounded-2xl border border-white/10 bg-white/[0.02] p-4'}>
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => (mode === 'week' ? shiftWeek(-1) : shiftMonth(-1))}
          className="p-1.5 rounded-lg text-white/50 hover:bg-white/10"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-white">{mode === 'week' ? weekLabel : monthLabel}</span>
        <button
          type="button"
          onClick={() => (mode === 'week' ? shiftWeek(1) : shiftMonth(1))}
          className="p-1.5 rounded-lg text-white/50 hover:bg-white/10"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-white/35 mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span key={`${d}-${i}`}>{d}</span>
        ))}
      </div>

      {mode === 'week' ? (
        <div className="grid grid-cols-7 gap-1">{week.map((date) => dayButton(date))}</div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {matrix.flat().map((date, i) => {
            if (!date) return <div key={`empty-${i}`} className="aspect-square" />
            return dayButton(date)
          })}
        </div>
      )}

      {selectedDate && !detail && (
        <p className="mt-3 pt-3 border-t border-white/5 text-xs text-white/45 text-center">
          No workout logged for this day.
        </p>
      )}

      {selectedDate && detail && (
        <WorkoutDayDetailPanel
          detail={detail}
          onEdit={onEditWorkout ? () => onEditWorkout(selectedDate) : undefined}
        />
      )}
    </div>
  )
}

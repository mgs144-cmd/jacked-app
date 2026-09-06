'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface WorkoutExercise {
  id?: string
  exercise_name: string
  sets: number | null
  reps: number | null
  weight: number | null
  order_index: number
}

interface WorkoutDetailsProps {
  exercises: WorkoutExercise[]
  postId: string
  /** `inline` = beside photo on feed; compact, always expanded */
  layout?: 'stack' | 'inline'
  defaultExpanded?: boolean
}

function groupByOrderIndex(exercises: WorkoutExercise[]): Map<number, WorkoutExercise[]> {
  const map = new Map<number, WorkoutExercise[]>()
  const sorted = [...exercises].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
  sorted.forEach((row) => {
    const k = row.order_index ?? 0
    if (!map.has(k)) map.set(k, [])
    map.get(k)!.push(row)
  })
  return map
}

function formatExerciseBlock(name: string, rows: WorkoutExercise[]): { title: string; lines: string[] } {
  const r0 = rows[0]
  const allEmpty =
    rows.length === 1 &&
    r0.weight == null &&
    r0.reps == null &&
    (r0.sets == null || r0.sets === 0)

  if (allEmpty) {
    return { title: name, lines: [] }
  }

  if (rows.length === 1 && r0.weight == null && (r0.sets != null || r0.reps != null)) {
    const s = r0.sets != null && r0.sets > 0 ? r0.sets : null
    const r = r0.reps != null && r0.reps > 0 ? r0.reps : null
    let line = ''
    if (s && r) line = `${s}×${r}`
    else if (s) line = `${s} set${s === 1 ? '' : 's'}`
    else if (r) line = `${r} reps`
    return { title: name, lines: line ? [line] : [] }
  }

  const lines = rows
    .map((r) => {
      const parts: string[] = []
      if (r.weight != null) parts.push(`${r.weight} lb`)
      if (r.reps != null) parts.push(`${r.reps} reps`)
      return parts.length ? parts.join(' · ') : null
    })
    .filter((x): x is string => Boolean(x))

  return { title: name, lines }
}

function primaryMetric(lines: string[]): string | null {
  if (!lines.length) return null
  return lines[0]
}

function InlineWorkoutPanel({
  blocks,
  postId,
  keys,
}: {
  blocks: { title: string; lines: string[] }[]
  postId: string
  keys: number[]
}) {
  const scroll = blocks.length > 7

  return (
    <div className="flex h-full min-h-0 flex-col justify-center px-3 py-3 sm:px-3.5 sm:py-3.5">
      <div className="mb-2 flex items-center justify-between gap-2 shrink-0">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Workout</span>
        <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium tabular-nums text-white/50">
          {blocks.length}
        </span>
      </div>

      <ul
        className={`rounded-[14px] border border-white/[0.07] bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${
          scroll ? 'max-h-[min(42svh,340px)] overflow-y-auto overscroll-contain' : ''
        }`}
      >
        {blocks.map((block, idx) => {
          const metric = primaryMetric(block.lines)
          return (
            <li
              key={`${postId}-${keys[idx]}`}
              className={`flex items-start gap-2.5 px-2.5 py-2.5 ${
                idx > 0 ? 'border-t border-white/[0.05]' : ''
              }`}
            >
              <span
                className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-[9px] font-semibold tabular-nums text-white/35"
                aria-hidden
              >
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-medium uppercase leading-[1.35] tracking-[0.06em] text-white/88 line-clamp-3">
                    {block.title}
                  </p>
                  {metric && (
                    <span className="shrink-0 text-[10px] font-medium tabular-nums text-white/40 pt-px">{metric}</span>
                  )}
                </div>
                {block.lines.length > 1 && (
                  <ul className="mt-1 space-y-0.5">
                    {block.lines.slice(1).map((line, i) => (
                      <li key={i} className="text-[10px] tabular-nums leading-snug text-white/38">
                        {line}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function WorkoutDetails({
  exercises,
  postId,
  layout = 'stack',
  defaultExpanded,
}: WorkoutDetailsProps) {
  const initiallyOpen = layout === 'inline' ? true : defaultExpanded ?? false
  const [isExpanded, setIsExpanded] = useState(initiallyOpen)

  if (!exercises || exercises.length === 0) return null

  const groups = groupByOrderIndex(exercises)
  const keys = [...groups.keys()].sort((a, b) => a - b)
  const blocks = keys.map((k) => {
    const rows = groups.get(k)!
    const name = rows[0]?.exercise_name || 'Exercise'
    return formatExerciseBlock(name, rows)
  })

  if (layout === 'inline') {
    return <InlineWorkoutPanel blocks={blocks} postId={postId} keys={keys} />
  }

  const list = (
    <ul className="mt-1.5 flex flex-col gap-2">
      {blocks.map((block, idx) => (
        <li key={`${postId}-${keys[idx]}`} className="list-none">
          <p className="text-[13px] font-medium uppercase tracking-wide leading-snug text-white/90 md:text-sm">
            {block.title}
          </p>
          {block.lines.length > 0 && (
            <ul className="mt-1 space-y-0.5">
              {block.lines.map((line, i) => (
                <li key={i} className="text-[11px] tabular-nums leading-snug text-white/45 md:text-[12px]">
                  {line}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  )

  return (
    <div className="mt-2 pt-2 border-t border-white/[0.06]">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left py-1.5"
      >
        <span className="text-[11px] md:text-[12px] font-semibold uppercase tracking-wide text-white/55">
          Workout · {blocks.length} exercise{blocks.length === 1 ? '' : 's'}
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-white/35 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/35 shrink-0" />
        )}
      </button>
      {isExpanded && list}
    </div>
  )
}

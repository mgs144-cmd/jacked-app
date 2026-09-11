'use client'

import { useEffect, useMemo, useState } from 'react'
import { Pencil, Lock, Copy, Check } from 'lucide-react'
import type { WorkoutDayDetail } from '@/lib/workoutDayDetail'
import { formatWorkoutForAiExport, type AiExportStrain } from '@/lib/workoutAiExport'

function formatSetLine(set: WorkoutDayDetail['exercises'][0]['sets'][0]): string {
  const spot =
    set.range_spot === 'beginning'
      ? ' (beginning)'
      : set.range_spot === 'middle'
        ? ' (middle)'
        : set.range_spot === 'end'
          ? ' (end)'
          : ''
  const rpe = set.rpe != null && set.rpe < 10 ? ` @${set.rpe}` : ''
  return `${set.weight} × ${set.reps}${rpe}${spot}`
}

interface WorkoutDayDetailPanelProps {
  detail: WorkoutDayDetail
  onEdit?: () => void
}

export function WorkoutDayDetailPanel({ detail, onEdit }: WorkoutDayDetailPanelProps) {
  const canEdit = detail.liftLogCount > 0
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)
  const [strain, setStrain] = useState<AiExportStrain | null>(null)

  useEffect(() => {
    let cancelled = false
    setStrain(null)
    ;(async () => {
      try {
        const res = await fetch('/api/wearables/sync-strain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionDate: detail.date }),
        })
        const json = await res.json().catch(() => ({}))
        if (cancelled || !res.ok) return

        let best: AiExportStrain | null = null
        for (const [provider, result] of Object.entries(json.results || {})) {
          for (const s of (result as any)?.scores || []) {
            const candidate: AiExportStrain = {
              provider,
              score: s.score,
              scaleMax: s.scaleMax,
              averageHeartRate: s.averageHeartRate,
              maxHeartRate: s.maxHeartRate,
            }
            if (!best || candidate.score > best.score) best = candidate
          }
        }
        if (!cancelled) setStrain(best)
      } catch {
        /* wearables optional for export */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [detail.date])

  const summarySets = useMemo(
    () =>
      detail.exercises.flatMap((ex) =>
        ex.sets.map((s) => ({
          exercise_name: ex.exercise_name,
          weight: s.weight,
          reps: s.reps,
          rpe: s.rpe,
        }))
      ),
    [detail.exercises]
  )

  const aiExportText = useMemo(
    () =>
      formatWorkoutForAiExport({
        summarySets,
        sessionDate: detail.date,
        loggedDateLabel: detail.dateLabel,
        strain,
      }),
    [summarySets, detail.date, detail.dateLabel, strain]
  )

  const onExportToAi = async () => {
    setCopyError(null)
    try {
      await navigator.clipboard.writeText(aiExportText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopyError('Could not copy — select the text manually')
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">{detail.dateLabel}</p>
          <p className="ui-meta mt-0.5">
            {detail.exercises.length} exercise{detail.exercises.length !== 1 ? 's' : ''} · {detail.totalSets} set
            {detail.totalSets !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void onExportToAi()}
            className="btn btn-secondary btn-sm gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Export to AI'}
          </button>
          {canEdit && onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="btn btn-secondary btn-sm gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
          )}
        </div>
      </div>

      {copyError && <p className="text-xs text-red-400">{copyError}</p>}

      {detail.hasPostOnlySets && (
        <p className="text-xs text-white/45 rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2">
          Sets from feed posts are shown for reference. Edit updates your training log entries only.
        </p>
      )}

      <ul className="space-y-3 max-h-[min(50vh,420px)] overflow-y-auto pr-0.5">
        {detail.exercises.map((ex) => {
          const bestE1 = Math.max(...ex.sets.map((s) => s.e1rm))
          return (
            <li
              key={ex.exercise_name}
              className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden"
            >
              <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-white truncate">{ex.exercise_name}</span>
                <span className="text-xs text-white/45 tabular-nums shrink-0">best e1RM {bestE1}</span>
              </div>
              <ul className="divide-y divide-white/5">
                {ex.sets.map((set, i) => (
                  <li
                    key={set.id ?? `${ex.exercise_name}-${i}`}
                    className="px-3 py-2 flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0">
                      <span className="text-white tabular-nums">{formatSetLine(set)}</span>
                      <span className="text-white/40 text-xs ml-2 tabular-nums">{set.e1rm} e1RM</span>
                    </div>
                    {set.source === 'post' ? (
                      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-white/35 shrink-0">
                        <Lock className="w-3 h-3" />
                        Feed
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-wider text-white/30 shrink-0">Log</span>
                    )}
                  </li>
                ))}
              </ul>
            </li>
          )
        })}
      </ul>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
        <p className="text-xs text-white/45">Paste-ready summary</p>
        <pre className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/70 whitespace-pre-wrap font-mono leading-relaxed max-h-36 overflow-y-auto">
          {aiExportText}
        </pre>
      </div>
    </div>
  )
}

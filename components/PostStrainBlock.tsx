'use client'

import { Download, Loader2 } from 'lucide-react'
import { useState } from 'react'
import type { ZoneDurationsMs } from '@/lib/wearables/types'
import { downloadWorkoutSharePng, formatShareDuration } from '@/lib/workoutSharePng'

export type PostWearableMetrics = {
  provider: string
  score: number
  scaleMax: number
  averageHeartRate?: number | null
  maxHeartRate?: number | null
  startedAt?: string | null
  endedAt?: string | null
  zoneDurations?: ZoneDurationsMs | null
  externalId?: string | null
}

export function parsePostWearableMetrics(raw: unknown): PostWearableMetrics | null {
  if (!raw || typeof raw !== 'object') return null
  const m = raw as Record<string, unknown>
  const score = Number(m.score)
  const scaleMax = Number(m.scaleMax)
  if (!Number.isFinite(score) || !Number.isFinite(scaleMax) || !m.provider) return null
  return {
    provider: String(m.provider),
    score,
    scaleMax,
    averageHeartRate: m.averageHeartRate != null ? Number(m.averageHeartRate) : null,
    maxHeartRate: m.maxHeartRate != null ? Number(m.maxHeartRate) : null,
    startedAt: typeof m.startedAt === 'string' ? m.startedAt : null,
    endedAt: typeof m.endedAt === 'string' ? m.endedAt : null,
    zoneDurations: (m.zoneDurations as ZoneDurationsMs) || null,
    externalId: m.externalId != null ? String(m.externalId) : null,
  }
}

function durationMs(m: PostWearableMetrics): number | null {
  if (!m.startedAt || !m.endedAt) return null
  const ms = new Date(m.endedAt).getTime() - new Date(m.startedAt).getTime()
  return Number.isFinite(ms) && ms > 0 ? ms : null
}

interface PostStrainBlockProps {
  metrics: PostWearableMetrics
  totalLbs?: number | null
  showShare?: boolean
  compact?: boolean
}

export function PostStrainBlock({
  metrics,
  totalLbs = null,
  showShare = false,
  compact = false,
}: PostStrainBlockProps) {
  const [sharing, setSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dur = durationMs(metrics)
  const scoreDisplay = Number.isInteger(metrics.score)
    ? String(metrics.score)
    : metrics.score.toFixed(1)

  const onShare = async () => {
    setSharing(true)
    setError(null)
    try {
      await downloadWorkoutSharePng(
        {
          totalLbs: totalLbs && totalLbs > 0 ? totalLbs : null,
          strain: metrics.score,
          strainScaleMax: metrics.scaleMax,
          durationMs: dur,
          averageHeartRate: metrics.averageHeartRate,
          maxHeartRate: metrics.maxHeartRate,
          zoneDurations: metrics.zoneDurations,
        },
        `jacked-workout-${metrics.provider}.png`
      )
    } catch (e: any) {
      setError(e?.message || 'Share failed')
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className={`text-center ${compact ? 'py-2' : 'py-4'}`}>
      <p className="label-caps text-white/45 mb-1">Strain</p>
      <p
        className={`font-metric font-bold tabular-nums text-white tracking-tight leading-none ${
          compact ? 'text-5xl' : 'text-6xl md:text-7xl'
        }`}
      >
        {scoreDisplay}
      </p>
      <p className="mt-2 text-xs md:text-sm text-white/40 uppercase tracking-[0.14em] font-metric">
        / {metrics.scaleMax}
        <span className="text-white/25 mx-2">·</span>
        {metrics.provider}
      </p>
      {(dur || metrics.averageHeartRate || metrics.maxHeartRate) && (
        <p className="mt-2 text-sm text-white/55 font-metric tabular-nums">
          {[
            dur ? formatShareDuration(dur) : null,
            metrics.averageHeartRate ? `Avg ${metrics.averageHeartRate}` : null,
            metrics.maxHeartRate ? `Max ${metrics.maxHeartRate}` : null,
          ]
            .filter(Boolean)
            .join('  ·  ')}
        </p>
      )}
      {showShare && (
        <button
          type="button"
          disabled={sharing}
          onClick={() => void onShare()}
          className="mt-3 btn btn-secondary btn-sm gap-1.5 mx-auto"
        >
          {sharing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          Share workout
        </button>
      )}
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  )
}

export function totalLbsFromWorkoutExercises(exercises: any[] | undefined | null): number | null {
  if (!Array.isArray(exercises) || !exercises.length) return null
  let total = 0
  for (const ex of exercises) {
    const sets = Array.isArray(ex.sets_data) ? ex.sets_data : []
    if (sets.length) {
      for (const s of sets) {
        const w = Number(s.weight)
        const r = Number(s.reps)
        if (Number.isFinite(w) && Number.isFinite(r) && w > 0 && r > 0) total += w * r
      }
    } else if (ex.weight != null && ex.reps != null) {
      const w = Number(ex.weight)
      const r = Number(ex.reps)
      const setCount = Number(ex.sets) > 0 ? Number(ex.sets) : 1
      if (Number.isFinite(w) && Number.isFinite(r) && w > 0 && r > 0) total += w * r * setCount
    }
  }
  return total > 0 ? total : null
}

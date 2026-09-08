'use client'

import { useEffect, useMemo, useState } from 'react'
import { Activity, CheckCircle2, Download, Loader2, TrendingUp } from 'lucide-react'
import { calculateOneRepMaxWithRPE } from '@/utils/oneRepMax'
import type { ZoneDurationsMs } from '@/lib/wearables/types'
import { downloadWorkoutSharePng } from '@/lib/workoutSharePng'

interface SummarySet {
  exercise_name: string
  weight: number
  reps: number
  rpe?: number | null
}

type StrainSnippet = {
  provider: string
  score: number
  scaleMax: number
  averageHeartRate?: number | null
  maxHeartRate?: number | null
  startedAt?: string | null
  endedAt?: string | null
  zoneDurations?: ZoneDurationsMs | null
}

interface PostWorkoutSummaryViewProps {
  summarySets: SummarySet[]
  loggedDateLabel?: string
  /** YYYY-MM-DD — used to pull wearable strain for this session */
  sessionDate?: string | null
  onViewInsights: () => void
  onLogAgain: () => void
}

export function PostWorkoutSummaryView({
  summarySets,
  loggedDateLabel,
  sessionDate,
  onViewInsights,
  onLogAgain,
}: PostWorkoutSummaryViewProps) {
  const [strain, setStrain] = useState<StrainSnippet | null>(null)
  const [strainStatus, setStrainStatus] = useState<'idle' | 'loading' | 'done' | 'none'>('idle')
  const [sharing, setSharing] = useState(false)
  const [shareError, setShareError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionDate) return
    let cancelled = false
    setStrainStatus('loading')
    ;(async () => {
      try {
        const res = await fetch('/api/wearables/sync-strain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionDate }),
        })
        const json = await res.json()
        if (cancelled) return
        if (!res.ok) {
          setStrainStatus('none')
          return
        }
        const all: StrainSnippet[] = []
        for (const [provider, result] of Object.entries(json.results || {})) {
          const scores = (result as any)?.scores || []
          for (const s of scores) {
            all.push({
              provider,
              score: s.score,
              scaleMax: s.scaleMax,
              averageHeartRate: s.averageHeartRate,
              maxHeartRate: s.maxHeartRate,
              startedAt: s.startedAt,
              endedAt: s.endedAt,
              zoneDurations: s.zoneDurations ?? null,
            })
          }
        }
        if (all.length) {
          // Prefer Whoop when both exist
          const preferred = all.find((s) => s.provider === 'whoop') || all[0]
          setStrain(preferred)
          setStrainStatus('done')
        } else {
          setStrainStatus('none')
        }
      } catch {
        if (!cancelled) setStrainStatus('none')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [sessionDate])

  const byExercise = summarySets.reduce<Record<string, SummarySet[]>>((acc, s) => {
    const name = s.exercise_name || 'Unknown'
    if (!acc[name]) acc[name] = []
    acc[name].push(s)
    return acc
  }, {})

  const totalLbs = useMemo(() => {
    return summarySets.reduce((sum, s) => {
      const w = Number(s.weight)
      const r = Number(s.reps)
      if (!Number.isFinite(w) || !Number.isFinite(r) || w <= 0 || r <= 0) return sum
      return sum + w * r
    }, 0)
  }, [summarySets])

  const durationMs = useMemo(() => {
    if (!strain?.startedAt || !strain?.endedAt) return null
    const ms = new Date(strain.endedAt).getTime() - new Date(strain.startedAt).getTime()
    return Number.isFinite(ms) && ms > 0 ? ms : null
  }, [strain])

  const canShare =
    (strain?.provider === 'whoop' || strain?.provider === 'oura') &&
    strainStatus === 'done' &&
    (totalLbs > 0 || strain.score != null || durationMs != null)

  const onDownloadShare = async () => {
    if (!strain || sharing) return
    setSharing(true)
    setShareError(null)
    try {
      await downloadWorkoutSharePng(
        {
          totalLbs: totalLbs > 0 ? totalLbs : null,
          strain: strain.score,
          strainScaleMax: strain.scaleMax,
          durationMs,
          averageHeartRate: strain.averageHeartRate,
          maxHeartRate: strain.maxHeartRate,
          zoneDurations: strain.zoneDurations,
          dateLabel: loggedDateLabel && loggedDateLabel !== 'Today' ? loggedDateLabel : null,
        },
        `jacked-workout-${sessionDate || 'today'}.png`
      )
    } catch (e: any) {
      setShareError(e?.message || 'Could not create share image')
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="log-screen-section-title text-base">Workout logged</h2>
        <p className="log-screen-support text-sm mt-2">
          {summarySets.length} set{summarySets.length !== 1 ? 's' : ''} across{' '}
          {Object.keys(byExercise).length} exercise{Object.keys(byExercise).length !== 1 ? 's' : ''}
          {loggedDateLabel && loggedDateLabel !== 'Today' ? (
            <span className="block mt-1 text-white/50">Logged for {loggedDateLabel}</span>
          ) : null}
        </p>
      </div>

      {(strainStatus === 'loading' || strain) && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 flex items-center gap-3">
          <Activity className="w-4 h-4 text-white/50 shrink-0" />
          {strainStatus === 'loading' ? (
            <p className="text-sm text-white/50">Checking wearables for strain…</p>
          ) : strain ? (
            <div className="min-w-0">
              <p className="text-sm text-white font-medium">
                Strain {strain.score}
                <span className="text-white/40 font-normal"> / {strain.scaleMax}</span>
                <span className="text-white/35 text-xs ml-2 uppercase tracking-wider">
                  {strain.provider}
                </span>
              </p>
              {(strain.averageHeartRate || strain.maxHeartRate) && (
                <p className="text-xs text-white/45 mt-0.5">
                  {strain.averageHeartRate ? `Avg HR ${strain.averageHeartRate}` : ''}
                  {strain.averageHeartRate && strain.maxHeartRate ? ' · ' : ''}
                  {strain.maxHeartRate ? `Max HR ${strain.maxHeartRate}` : ''}
                </p>
              )}
            </div>
          ) : null}
        </div>
      )}

      {canShare && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
          <div>
            <p className="text-sm font-medium text-white">Share card</p>
            <p className="text-xs text-white/45 mt-1">
              Download a Story-ready PNG with volume, strain, time, and a simplified heart-rate chart
              from your wearable.
            </p>
          </div>
          <button
            type="button"
            disabled={sharing}
            onClick={() => void onDownloadShare()}
            className="w-full btn btn-primary gap-2"
          >
            {sharing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {sharing ? 'Creating…' : 'Download PNG'}
          </button>
          {shareError && <p className="text-sm text-red-400">{shareError}</p>}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5">
          <p className="log-screen-eyebrow">Summary</p>
        </div>
        <ul className="divide-y divide-white/5">
          {Object.entries(byExercise).map(([name, sets]) => {
            const best = sets.reduce((best, s) => {
              const e1 = calculateOneRepMaxWithRPE(s.weight, s.reps, s.rpe ?? 10)
              const bestE = calculateOneRepMaxWithRPE(best.weight, best.reps, best.rpe ?? 10)
              return e1 > bestE ? s : best
            }, sets[0])
            const e1RM = calculateOneRepMaxWithRPE(best.weight, best.reps, best.rpe ?? 10)
            const setsDisplay = sets
              .map((s) => `${s.weight}×${s.reps}${s.rpe ? `@${s.rpe}` : ''}`)
              .join(' · ')
            return (
              <li key={name} className="px-4 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-white truncate">{name}</p>
                  <p className="text-xs text-white/50 truncate">{setsDisplay}</p>
                </div>
                <span className="text-white font-semibold tabular-nums shrink-0">
                  e1RM {e1RM} lbs
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button type="button" onClick={onViewInsights} className="flex-1 btn btn-secondary gap-2">
          <TrendingUp className="w-4 h-4" />
          View insights
        </button>
        <button type="button" onClick={onLogAgain} className="flex-1 btn btn-primary">
          Log again
        </button>
      </div>
    </div>
  )
}

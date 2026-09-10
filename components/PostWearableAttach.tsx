'use client'

import { useEffect, useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { ZoneDurationsMs } from '@/lib/wearables/types'
import { downloadWorkoutSharePng, formatShareDuration } from '@/lib/workoutSharePng'
import { todayISO } from '@/lib/workoutSessions'
import type { PostWearableMetrics } from '@/components/PostStrainBlock'

export type WearableStrainAttach = {
  id: string
  provider: string
  score: number
  scaleMax: number
  averageHeartRate?: number | null
  maxHeartRate?: number | null
  startedAt?: string | null
  endedAt?: string | null
  zoneDurations?: ZoneDurationsMs | null
}

interface PostWearableAttachProps {
  strain: WearableStrainAttach | null
  onStrainChange: (strain: WearableStrainAttach | null) => void
  totalLbs?: number
  /** YYYY-MM-DD — which day of wearable workouts to load */
  sessionDate?: string
  /** When true (default), auto-picks the first workout if none selected */
  autoSelectFirst?: boolean
  /** Show a date picker (useful when editing older posts) */
  allowDatePick?: boolean
  onSessionDateChange?: (date: string) => void
}

export function wearableMetricsToAttach(
  m: PostWearableMetrics | null | undefined
): WearableStrainAttach | null {
  if (!m) return null
  return {
    id: String(m.externalId || `${m.provider}-${m.startedAt || m.score}`),
    provider: m.provider,
    score: m.score,
    scaleMax: m.scaleMax,
    averageHeartRate: m.averageHeartRate,
    maxHeartRate: m.maxHeartRate,
    startedAt: m.startedAt,
    endedAt: m.endedAt,
    zoneDurations: m.zoneDurations,
  }
}

function durationFor(s: WearableStrainAttach): number | null {
  if (!s.startedAt || !s.endedAt) return null
  const ms = new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()
  return Number.isFinite(ms) && ms > 0 ? ms : null
}

function workoutLabel(s: WearableStrainAttach): string {
  const dur = durationFor(s)
  const time =
    s.startedAt != null
      ? new Date(s.startedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : null
  const bits = [
    s.provider.toUpperCase(),
    `Strain ${Number(s.score).toFixed(1)}/${s.scaleMax}`,
    time,
    dur ? formatShareDuration(dur) : null,
  ].filter(Boolean)
  return bits.join(' · ')
}

export function PostWearableAttach({
  strain,
  onStrainChange,
  totalLbs = 0,
  sessionDate: sessionDateProp,
  autoSelectFirst = true,
  allowDatePick = false,
  onSessionDateChange,
}: PostWearableAttachProps) {
  const [localDate, setLocalDate] = useState(sessionDateProp || todayISO())
  const sessionDate = sessionDateProp ?? localDate
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'none' | 'error'>('idle')
  const [workouts, setWorkouts] = useState<WearableStrainAttach[]>([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)

  const setDate = (next: string) => {
    setLocalDate(next)
    onSessionDateChange?.(next)
  }

  useEffect(() => {
    if (sessionDateProp) setLocalDate(sessionDateProp)
  }, [sessionDateProp])

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    setError(null)
    ;(async () => {
      try {
        const connRes = await fetch('/api/wearables/connections')
        const connJson = await connRes.json().catch(() => ({}))
        if (!connRes.ok) {
          if (!cancelled) setStatus('none')
          return
        }
        const connections = connJson.connections || []
        if (!connections.length) {
          if (!cancelled) {
            setConnected(false)
            setWorkouts([])
            setStatus('none')
          }
          return
        }
        if (!cancelled) setConnected(true)

        const res = await fetch('/api/wearables/sync-strain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionDate }),
        })
        const json = await res.json().catch(() => ({}))
        if (cancelled) return
        if (!res.ok) {
          setStatus('error')
          setError(json.error || 'Could not sync wearables')
          return
        }

        const all: WearableStrainAttach[] = []
        for (const [provider, result] of Object.entries(json.results || {})) {
          let i = 0
          for (const s of (result as any)?.scores || []) {
            all.push({
              id: String(s.externalId || `${provider}-${s.startedAt || i}`),
              provider,
              score: s.score,
              scaleMax: s.scaleMax,
              averageHeartRate: s.averageHeartRate,
              maxHeartRate: s.maxHeartRate,
              startedAt: s.startedAt,
              endedAt: s.endedAt,
              zoneDurations: s.zoneDurations ?? null,
            })
            i += 1
          }
        }

        all.sort((a, b) => {
          if (a.provider === b.provider) {
            return String(b.startedAt || '').localeCompare(String(a.startedAt || ''))
          }
          if (a.provider === 'whoop') return -1
          if (b.provider === 'whoop') return 1
          return a.provider.localeCompare(b.provider)
        })

        setWorkouts(all)
        if (all.length) {
          setStatus('done')
          if (autoSelectFirst) {
            onStrainChange(all[0])
          } else {
            // Keep current selection if still present; otherwise leave as-is
            const stillThere = strain && all.some((w) => w.id === strain.id)
            if (strain && !stillThere) {
              // Prefer matching by external time if ids differ across syncs
              const byTime = all.find(
                (w) =>
                  w.provider === strain.provider &&
                  w.startedAt &&
                  strain.startedAt &&
                  w.startedAt === strain.startedAt
              )
              if (byTime) onStrainChange(byTime)
            }
          }
        } else {
          setStatus('none')
          if (autoSelectFirst) onStrainChange(null)
        }
      } catch {
        if (!cancelled) {
          setStatus('error')
          setError('Could not load wearable metrics')
        }
      }
    })()
    return () => {
      cancelled = true
    }
    // Intentionally re-run when sessionDate changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionDate])

  const download = async () => {
    if (!strain) return
    setSharing(true)
    setError(null)
    try {
      const durationMs = durationFor(strain)
      await downloadWorkoutSharePng({
        totalLbs: totalLbs > 0 ? totalLbs : null,
        strain: strain.score,
        strainScaleMax: strain.scaleMax,
        durationMs,
        averageHeartRate: strain.averageHeartRate,
        maxHeartRate: strain.maxHeartRate,
        zoneDurations: strain.zoneDurations,
      })
    } catch (e: any) {
      setError(e?.message || 'Share failed')
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="space-y-3">
      {allowDatePick && (
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">Workout day</label>
          <input
            type="date"
            value={sessionDate}
            onChange={(e) => setDate(e.target.value)}
            className="input-field w-full sm:w-auto"
          />
        </div>
      )}

      {status === 'loading' && (
        <div className="rounded-[12px] border border-white/10 bg-white/[0.02] px-4 py-3 flex items-center gap-2 text-sm text-white/50">
          <Loader2 className="w-4 h-4 animate-spin" />
          Checking wearables…
        </div>
      )}

      {status === 'none' && (
        <div className="rounded-[12px] border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/50 space-y-2">
          <p>
            {connected ? (
              <>
                No wearable workouts found for {sessionDate}.
                {allowDatePick
                  ? ' Try another day, or finish a session on your device.'
                  : ' Finish a session on your device, then refresh.'}
              </>
            ) : (
              <>
                Connect WHOOP or Oura in{' '}
                <Link href="/settings" className="text-white/80 underline underline-offset-2">
                  Settings
                </Link>{' '}
                to link workouts.
              </>
            )}
          </p>
          {strain && (
            <button
              type="button"
              onClick={() => onStrainChange(null)}
              className="text-xs text-white/45 hover:text-white/70 underline underline-offset-2"
            >
              Clear linked {strain.provider} strain {Number(strain.score).toFixed(1)}
            </button>
          )}
        </div>
      )}

      {status === 'error' && !workouts.length && (
        <div className="rounded-[12px] border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300/90">
          {error || 'Wearables unavailable'}
        </div>
      )}

      {workouts.length > 0 && (
        <>
          <ul className="space-y-2">
            {workouts.map((w) => {
              const selected = strain?.id === w.id
              const dur = durationFor(w)
              return (
                <li key={w.id}>
                  <button
                    type="button"
                    onClick={() => onStrainChange(selected ? null : w)}
                    className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
                      selected
                        ? 'border-white bg-white/[0.08] text-white'
                        : 'border-white/10 bg-white/[0.02] text-white/75 hover:border-white/25'
                    }`}
                  >
                    <p className="text-sm font-medium">{workoutLabel(w)}</p>
                    <p className="text-xs text-white/45 mt-1">
                      {[
                        w.averageHeartRate ? `Avg HR ${w.averageHeartRate}` : null,
                        w.maxHeartRate ? `Max ${w.maxHeartRate}` : null,
                        dur ? formatShareDuration(dur) : null,
                      ]
                        .filter(Boolean)
                        .join(' · ') || 'Tap to link'}
                    </p>
                  </button>
                </li>
              )
            })}
          </ul>

          {strain && (
            <button
              type="button"
              onClick={() => onStrainChange(null)}
              className="text-xs text-white/45 hover:text-white/70 underline underline-offset-2"
            >
              Clear wearable metrics
            </button>
          )}

          <button
            type="button"
            disabled={sharing || !strain}
            onClick={() => void download()}
            className="btn btn-secondary btn-sm gap-1.5 w-full sm:w-auto disabled:opacity-40"
          >
            {sharing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Share workout
          </button>
        </>
      )}

      {error && workouts.length > 0 && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

export function formatStrainCaptionLine(strain: WearableStrainAttach): string {
  const bits = [
    `${strain.provider.toUpperCase()} strain ${Number(strain.score).toFixed(1)}/${strain.scaleMax}`,
    strain.averageHeartRate ? `avg HR ${strain.averageHeartRate}` : null,
    strain.maxHeartRate ? `max ${strain.maxHeartRate}` : null,
  ].filter(Boolean)
  return bits.join(' · ')
}

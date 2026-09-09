'use client'

import { useEffect, useState } from 'react'
import { Activity, Download, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { ZoneDurationsMs } from '@/lib/wearables/types'
import { downloadWorkoutSharePng, formatShareDuration } from '@/lib/workoutSharePng'
import { todayISO } from '@/lib/workoutSessions'

export type WearableStrainAttach = {
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
  include: boolean
  onIncludeChange: (include: boolean) => void
  strain: WearableStrainAttach | null
  onStrainChange: (strain: WearableStrainAttach | null) => void
  totalLbs?: number
}

export function PostWearableAttach({
  include,
  onIncludeChange,
  strain,
  onStrainChange,
  totalLbs = 0,
}: PostWearableAttachProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'none' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)

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
            onStrainChange(null)
            setStatus('none')
          }
          return
        }

        const res = await fetch('/api/wearables/sync-strain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionDate: todayISO() }),
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
          for (const s of (result as any)?.scores || []) {
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
          const preferred = all.find((s) => s.provider === 'whoop') || all[0]
          onStrainChange(preferred)
          setStatus('done')
        } else {
          onStrainChange(null)
          setStatus('none')
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
  }, []) // load once on mount


  const durationMs =
    strain?.startedAt && strain?.endedAt
      ? new Date(strain.endedAt).getTime() - new Date(strain.startedAt).getTime()
      : null

  const download = async () => {
    if (!strain) return
    setSharing(true)
    try {
      await downloadWorkoutSharePng({
        totalLbs: totalLbs > 0 ? totalLbs : null,
        strain: strain.score,
        strainScaleMax: strain.scaleMax,
        durationMs: durationMs && durationMs > 0 ? durationMs : null,
        averageHeartRate: strain.averageHeartRate,
        maxHeartRate: strain.maxHeartRate,
        zoneDurations: strain.zoneDurations,
      })
    } catch (e: any) {
      setError(e?.message || 'Download failed')
    } finally {
      setSharing(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="rounded-[12px] border border-white/10 bg-white/[0.02] px-4 py-3 flex items-center gap-2 text-sm text-white/50">
        <Loader2 className="w-4 h-4 animate-spin" />
        Checking wearables…
      </div>
    )
  }

  if (status === 'none') {
    return (
      <div className="rounded-[12px] border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/50">
        Connect WHOOP or Oura in{' '}
        <Link href="/settings" className="text-white/80 underline underline-offset-2">
          Settings
        </Link>{' '}
        to attach strain metrics.
      </div>
    )
  }

  if (status === 'error' && !strain) {
    return (
      <div className="rounded-[12px] border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300/90">
        {error || 'Wearables unavailable'}
      </div>
    )
  }

  if (!strain) return null

  return (
    <div className="rounded-[12px] border border-white/10 bg-white/[0.02] p-4 space-y-3">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={include}
          onChange={(e) => onIncludeChange(e.target.checked)}
          className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-white focus:ring-white focus:ring-offset-0"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Activity className="w-4 h-4 text-white/70" />
            Include wearable metrics
          </div>
          <p className="text-xs text-white/45 mt-1">
            Adds today&apos;s {strain.provider.toUpperCase()} strain to your caption.
          </p>
        </div>
      </label>

      <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/80">
        <p>
          Strain {Number(strain.score).toFixed(1)}
          <span className="text-white/40"> / {strain.scaleMax}</span>
          <span className="text-white/35 text-xs ml-2 uppercase tracking-wider">{strain.provider}</span>
        </p>
        <p className="text-xs text-white/45 mt-1">
          {[
            durationMs && durationMs > 0 ? formatShareDuration(durationMs) : null,
            strain.averageHeartRate ? `Avg HR ${strain.averageHeartRate}` : null,
            strain.maxHeartRate ? `Max ${strain.maxHeartRate}` : null,
          ]
            .filter(Boolean)
            .join(' · ') || 'Synced for today'}
        </p>
      </div>

      <button
        type="button"
        disabled={sharing}
        onClick={() => void download()}
        className="btn btn-secondary btn-sm gap-1.5 w-full sm:w-auto"
      >
        {sharing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
        Download share PNG
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
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

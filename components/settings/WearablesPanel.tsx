'use client'

import { useCallback, useEffect, useState } from 'react'
import { Activity, Link2, Link2Off, Loader2, RefreshCw } from 'lucide-react'
import type { WearableProvider } from '@/lib/wearables/types'

type Connection = { provider: WearableProvider; connectedAt: string }

const PROVIDERS: { id: WearableProvider; name: string; blurb: string }[] = [
  {
    id: 'whoop',
    name: 'WHOOP',
    blurb: 'Pull workout strain (0–21) for Story templates.',
  },
  {
    id: 'oura',
    name: 'Oura',
    blurb: 'Map workout intensity to a 0–10 strain score.',
  },
]

export function WearablesPanel() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wearables/connections')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load')
      setConnections(json.connections || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load connections')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('connected') === '1') {
      setMessage(`${params.get('wearable') === 'oura' ? 'Oura' : 'WHOOP'} connected.`)
    }
    if (params.get('error')) {
      setError(decodeURIComponent(params.get('error') || 'Connection failed'))
    }
  }, [load])

  const connectedSet = new Set(connections.map((c) => c.provider))

  const disconnect = async (provider: WearableProvider) => {
    if (!confirm(`Disconnect ${provider === 'whoop' ? 'WHOOP' : 'Oura'}?`)) return
    setBusy(provider)
    setError(null)
    try {
      const res = await fetch('/api/wearables/connections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Disconnect failed')
      setMessage('Disconnected.')
      await load()
    } catch (e: any) {
      setError(e?.message || 'Disconnect failed')
    } finally {
      setBusy(null)
    }
  }

  const syncNow = async (provider?: WearableProvider) => {
    setBusy(provider || 'sync')
    setError(null)
    try {
      const res = await fetch('/api/wearables/sync-strain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(provider ? { provider } : {}),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Sync failed')
      const total = Object.values(json.results || {}).reduce(
        (n: number, r: any) => n + (r?.saved || 0),
        0
      )
      setMessage(total ? `Synced ${total} strain score${total === 1 ? '' : 's'}.` : 'No matching workouts found in the last 6 hours.')
    } catch (e: any) {
      setError(e?.message || 'Sync failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="border-t border-white/10 p-8 space-y-4">
      <div className="flex items-start gap-3">
        <Activity className="w-5 h-5 text-white/70 mt-0.5 shrink-0" />
        <div>
          <h2 className="ui-section-title text-base">Wearables &amp; strain</h2>
          <p className="text-sm text-white/50 mt-1">
            Connect WHOOP or Oura to attach strain scores to logged workouts for Story sharing.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-white/50 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : (
        <ul className="space-y-3">
          {PROVIDERS.map((p) => {
            const connected = connectedSet.has(p.id)
            return (
              <li
                key={p.id}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-white text-sm">{p.name}</p>
                  <p className="text-xs text-white/45 mt-0.5">{p.blurb}</p>
                  {connected && (
                    <p className="text-[11px] text-emerald-400/80 mt-1">Connected</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {connected ? (
                    <>
                      <button
                        type="button"
                        disabled={busy != null}
                        onClick={() => void syncNow(p.id)}
                        className="btn btn-secondary btn-sm gap-1.5"
                      >
                        {busy === p.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                        Sync strain
                      </button>
                      <button
                        type="button"
                        disabled={busy != null}
                        onClick={() => void disconnect(p.id)}
                        className="btn btn-ghost btn-sm gap-1.5 text-white/50"
                      >
                        <Link2Off className="w-3.5 h-3.5" />
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <a
                      href={`/api/wearables/${p.id}/connect`}
                      className="btn btn-primary btn-sm gap-1.5"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      Connect {p.name}
                    </a>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {connections.length > 0 && (
        <button
          type="button"
          disabled={busy != null}
          onClick={() => void syncNow()}
          className="btn btn-secondary btn-sm gap-1.5"
        >
          {busy === 'sync' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Sync all connected
        </button>
      )}

      {message && <p className="text-sm text-emerald-400/90">{message}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Scale } from 'lucide-react'
import type { BodyWeightTrendPoint } from '@/lib/bodyWeight'
import type { StrengthSex } from '@/lib/strengthStandards'

interface BodyWeightPanelProps {
  logs: BodyWeightTrendPoint[]
  strengthSex: StrengthSex | null
  onLogsChange: (logs: BodyWeightTrendPoint[]) => void
  onSexChange: (sex: StrengthSex) => void
  onSaveWeight: (weightLb: number) => Promise<{ error: string | null }>
}

export function BodyWeightPanel({
  logs,
  strengthSex,
  onLogsChange,
  onSexChange,
  onSaveWeight,
}: BodyWeightPanelProps) {
  const latest = logs.length > 0 ? logs[logs.length - 1] : null
  const [input, setInput] = useState(latest ? String(Math.round(latest.weight)) : '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSave = async () => {
    const w = parseFloat(input)
    if (!Number.isFinite(w) || w <= 0) {
      setMessage('Enter a valid weight in lb')
      return
    }
    setSaving(true)
    setMessage(null)
    const { error } = await onSaveWeight(w)
    setSaving(false)
    if (error) {
      setMessage(error)
      return
    }
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    const dateKey = `${y}-${m}-${d}`
    const next = [...logs.filter((p) => p.date !== dateKey), { date: dateKey, weight: w }].sort((a, b) =>
      a.date.localeCompare(b.date)
    )
    onLogsChange(next)
    setMessage('Saved for today')
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
        <Scale className="w-4 h-4 text-white/45" />
        <h3 className="ui-heading text-sm text-white/85">Body weight</h3>
      </div>

      <div className="p-4 space-y-4">
        <p className="ui-subtitle">
          Log weight when you want — used for strength percentiles on your lift charts.
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSexChange('male')}
            className={`btn btn-sm ${strengthSex === 'male' ? 'btn-secondary' : 'btn-ghost'}`}
          >
            Male benchmarks
          </button>
          <button
            type="button"
            onClick={() => onSexChange('female')}
            className={`btn btn-sm ${strengthSex === 'female' ? 'btn-secondary' : 'btn-ghost'}`}
          >
            Female benchmarks
          </button>
        </div>
        {!strengthSex && (
          <p className="ui-meta text-white/40">Pick male or female so percentiles match population tables.</p>
        )}

        <div className="flex gap-2">
          <input
            type="number"
            min="50"
            max="500"
            step="0.1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Weight (lb)"
            className="input-field flex-1 tabular-nums"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary shrink-0 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save today'}
          </button>
        </div>
        {message && <p className="ui-meta text-white/50">{message}</p>}
        {latest && (
          <p className="ui-meta">
            Latest: <span className="text-white/70 tabular-nums">{Math.round(latest.weight)} lb</span>
            {' · '}
            {format(new Date(latest.date + 'T12:00:00'), 'MMM d, yyyy')}
          </p>
        )}

        {logs.length >= 2 && (
          <div className="h-36 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={logs} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="bwGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }}
                  tickFormatter={(v) => format(new Date(v + 'T12:00:00'), 'M/d')}
                  stroke="rgba(255,255,255,0.15)"
                />
                <YAxis
                  domain={['dataMin - 5', 'dataMax + 5']}
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9 }}
                  width={36}
                  stroke="rgba(255,255,255,0.15)"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#000',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number | undefined) => [`${v ?? 0} lb`, 'Weight']}
                  labelFormatter={(l) => format(new Date(l + 'T12:00:00'), 'MMM d, yyyy')}
                />
                <Area
                  type="monotone"
                  dataKey="weight"
                  stroke="#fff"
                  strokeWidth={1.5}
                  fill="url(#bwGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

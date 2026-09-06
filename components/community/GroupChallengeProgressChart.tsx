'use client'

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { LineChart as LineChartIcon } from 'lucide-react'
import type { GroupChallengeRow, LiftLogRow } from '@/lib/groupChallenges'
import {
  buildGroupChallengeComparisonChart,
  type GroupChallengeChartMetric,
} from '@/lib/groupChallengeChartData'

interface GroupChallengeProgressChartProps {
  challenge: GroupChallengeRow
  memberIds: string[]
  usernameById: Record<string, string>
  liftLogRows: LiftLogRow[]
}

export function GroupChallengeProgressChart({
  challenge,
  memberIds,
  usernameById,
  liftLogRows,
}: GroupChallengeProgressChartProps) {
  const [metric, setMetric] = useState<GroupChallengeChartMetric>('weight')
  const [hidden, setHidden] = useState<Set<string>>(() => new Set())

  const built = useMemo(
    () => buildGroupChallengeComparisonChart(challenge, memberIds, usernameById, liftLogRows, metric),
    [challenge, memberIds, usernameById, liftLogRows, metric]
  )

  if (!built || built.points.length < 1) return null

  const { points, series } = built
  const target =
    challenge.target_weight != null && Number(challenge.target_weight) > 0
      ? Number(challenge.target_weight)
      : null

  const toggleSeries = (dataKey: string) => {
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(dataKey)) next.delete(dataKey)
      else next.add(dataKey)
      return next
    })
  }

  const visibleSeries = series.filter((s) => !hidden.has(s.dataKey))

  return (
    <div className="mt-3 rounded-lg border border-white/08 bg-black/25 overflow-hidden">
      <div className="px-3 py-2 border-b border-white/06 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-white/45 flex items-center gap-1">
          <LineChartIcon className="w-3 h-3" />
          Progress over time
          {challenge.exercise_name ? ` · ${challenge.exercise_name}` : ''}
        </p>
        <div className="flex rounded-lg border border-white/10 overflow-hidden text-[10px]">
          <button
            type="button"
            onClick={() => setMetric('weight')}
            className={`px-2.5 py-1 font-medium transition-colors ${
              metric === 'weight' ? 'bg-white/15 text-white' : 'text-white/45 hover:text-white/70'
            }`}
          >
            Weight (lb)
          </button>
          <button
            type="button"
            onClick={() => setMetric('e1rm')}
            className={`px-2.5 py-1 font-medium transition-colors ${
              metric === 'e1rm' ? 'bg-white/15 text-white' : 'text-white/45 hover:text-white/70'
            }`}
          >
            Est. 1RM
          </button>
        </div>
      </div>
      <div className="p-3 pt-1 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="date"
              stroke="rgba(255,255,255,0.25)"
              tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10 }}
              tickFormatter={(v) => format(new Date(v + 'T12:00:00'), 'M/d')}
            />
            <YAxis
              stroke="rgba(255,255,255,0.25)"
              tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 10 }}
              width={36}
              domain={['auto', 'auto']}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0a0a0a',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10,
                fontSize: 12,
              }}
              labelStyle={{ color: 'rgba(255,255,255,0.75)' }}
              labelFormatter={(label) => format(new Date(String(label) + 'T12:00:00'), 'MMM d, yyyy')}
              formatter={(value, name) => {
                const key = String(name ?? '')
                const s = series.find((x) => x.dataKey === key)
                const unit = metric === 'weight' ? 'lb' : 'lb e1RM'
                const num = typeof value === 'number' ? value : undefined
                return [`${num ?? '—'} ${unit}`, s?.label || key]
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              onClick={(e) => {
                const payload = e as { dataKey?: string }
                if (typeof payload.dataKey === 'string') toggleSeries(payload.dataKey)
              }}
              formatter={(value, entry) => {
                const key = (entry as { dataKey?: string }).dataKey
                const off = key && hidden.has(key)
                return (
                  <span
                    style={{
                      color: off ? 'rgba(255,255,255,0.35)' : (entry as { color?: string }).color,
                      cursor: 'pointer',
                    }}
                  >
                    {value}
                  </span>
                )
              }}
            />
            {target != null && metric === 'weight' && (
              <ReferenceLine
                y={target}
                stroke="rgba(52, 211, 153, 0.55)"
                strokeDasharray="4 4"
                label={{
                  value: `Goal ${target}`,
                  fill: 'rgba(52,211,153,0.8)',
                  fontSize: 10,
                  position: 'insideTopRight',
                }}
              />
            )}
            {visibleSeries.map((s) => (
              <Line
                key={s.userId}
                type="monotone"
                dataKey={s.dataKey}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 0, fill: s.color }}
                activeDot={{ r: 5 }}
                connectNulls
                isAnimationActive
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

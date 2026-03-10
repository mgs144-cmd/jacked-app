'use client'

import { format } from 'date-fns'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import { TrendingUp, Zap, ChevronLeft } from 'lucide-react'
import { calculateOneRepMaxWithRPE } from '@/utils/oneRepMax'
import type { ChartPoint } from './types'

interface ExerciseDetailViewProps {
  exerciseName: string
  chartData: ChartPoint[]
  recentTopSets: { date: string; weight: number; reps: number; rpe: number | null; e1RM: number }[]
  overloadStatus: 'progressing' | 'steady' | 'plateau' | 'regression' | 'insufficient_data'
  progressionSummary: string
  onQuickLog: () => void
  onBack: () => void
}

const statusConfig = {
  progressing: { label: 'Progressing', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  steady: { label: 'Holding steady', color: 'text-white/80', bg: 'bg-white/10' },
  plateau: { label: 'Plateau', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  regression: { label: 'Regression', color: 'text-red-400', bg: 'bg-red-500/10' },
  insufficient_data: { label: 'Need more data', color: 'text-white/50', bg: 'bg-white/5' },
}

export function ExerciseDetailView({
  exerciseName,
  chartData,
  recentTopSets,
  overloadStatus,
  progressionSummary,
  onQuickLog,
  onBack,
}: ExerciseDetailViewProps) {
  const config = statusConfig[overloadStatus]
  const hasChart = chartData.length > 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-white truncate flex-1">{exerciseName}</h2>
      </div>

      {/* Overload status callout */}
      <div className={`rounded-xl px-4 py-3 flex items-center justify-between ${config.bg} border border-white/5`}>
        <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
        <button
          type="button"
          onClick={onQuickLog}
          className="flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-white"
        >
          <Zap className="w-4 h-4" />
          Quick log
        </button>
      </div>

      {/* e1RM trend chart */}
      {hasChart && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <h3 className="text-sm font-medium text-white/70">Estimated 1RM trend</h3>
          </div>
          <div className="p-4">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="e1rmGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="date"
                    stroke="rgba(255,255,255,0.3)"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                    tickFormatter={(v) => format(new Date(v), 'M/d')}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.3)"
                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                    domain={['dataMin - 10', 'dataMax + 10']}
                    tickFormatter={(v) => `${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0a0a0a',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 10,
                    }}
                    labelStyle={{ color: 'rgba(255,255,255,0.8)' }}
                    formatter={(value: number | undefined) => [`${value ?? 0} lbs`, 'e1RM']}
                    labelFormatter={(label) => format(new Date(label), 'MMM d, yyyy')}
                  />
                  <Area
                    type="monotone"
                    dataKey="e1RM"
                    stroke="#ffffff"
                    strokeWidth={2}
                    fill="url(#e1rmGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Recent top sets */}
      {recentTopSets.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-white/5" />
            <h3 className="text-sm font-medium text-white/70">Best recent sets</h3>
          </div>
          <ul className="divide-y divide-white/5">
            {recentTopSets.slice(0, 8).map((set, i) => (
              <li key={`${set.date}-${i}`} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium tabular-nums">
                    {set.weight} × {set.reps}
                    {set.rpe != null && set.rpe < 10 ? ` @${set.rpe}` : ''}
                  </p>
                  <p className="text-xs text-white/50">{format(new Date(set.date), 'MMM d')}</p>
                </div>
                <span className="text-white/80 font-semibold tabular-nums">{set.e1RM} lbs e1RM</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {progressionSummary && (
        <p className="text-sm text-white/60">{progressionSummary}</p>
      )}

      <button
        type="button"
        onClick={onQuickLog}
        className="w-full btn-primary py-3 font-semibold flex items-center justify-center gap-2"
      >
        <Zap className="w-4 h-4" />
        Quick log this exercise
      </button>
    </div>
  )
}

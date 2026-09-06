'use client'

import { AlertCircle, TrendingUp } from 'lucide-react'
import type { LiftStrengthRow } from '@/lib/strengthStandards'
import { STRENGTH_STANDARDS_FOOTNOTE } from '@/lib/strengthStandards'

interface StrengthOverviewPanelProps {
  ranked: LiftStrengthRow[]
  behind: LiftStrengthRow[]
  unmappedCount: number
  medianPercentile: number | null
  bodyweightLb: number
  onSelectExercise: (name: string) => void
}

export function StrengthOverviewPanel({
  ranked,
  behind,
  unmappedCount,
  medianPercentile,
  bodyweightLb,
  onSelectExercise,
}: StrengthOverviewPanelProps) {
  if (ranked.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <p className="ui-subtitle">
          Log bench, squat, deadlift, and similar lifts — then add body weight — to see where you rank.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-white/45" />
        <h3 className="ui-heading text-sm text-white/85">Lift balance</h3>
      </div>
      <div className="p-4 space-y-4">
        <div className="flex flex-wrap gap-4 text-sm">
          {medianPercentile != null && (
            <div>
              <p className="label-caps text-white/35">Typical rank</p>
              <p className="text-white font-medium tabular-nums">~{medianPercentile}th %ile</p>
            </div>
          )}
          <div>
            <p className="label-caps text-white/35">Body weight</p>
            <p className="text-white font-medium tabular-nums">{Math.round(bodyweightLb)} lb</p>
          </div>
          {behind.length > 0 && (
            <div>
              <p className="label-caps text-white/35">Below average</p>
              <p className="text-white font-medium tabular-nums">{behind.length} lift{behind.length !== 1 ? 's' : ''}</p>
            </div>
          )}
        </div>

        {behind.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 flex gap-2">
            <AlertCircle className="w-4 h-4 text-white/50 shrink-0 mt-0.5" />
            <p className="ui-subtitle text-white/50">
              These lifts rank below the 50th percentile for your body weight — good targets to bring up.
            </p>
          </div>
        )}

        <ul className="space-y-1">
          {ranked.map((row) => {
            const weak = row.assessment.percentile < 50
            return (
              <li key={row.exerciseName}>
                <button
                  type="button"
                  onClick={() => onSelectExercise(row.exerciseName)}
                  className="btn btn-list gap-3 w-full"
                >
                  <span className="min-w-0 flex-1 text-left">
                    <span className="ui-body-medium text-white block truncate">{row.exerciseName}</span>
                    <span className="ui-meta block">
                      {row.assessment.levelLabel} · {row.assessment.ratio.toFixed(2)}× BW
                    </span>
                  </span>
                  <span
                    className={`shrink-0 tabular-nums text-sm font-medium ${
                      weak ? 'text-white/90' : 'text-white/55'
                    }`}
                  >
                    {row.assessment.percentile}
                    <span className="text-white/40 text-xs font-normal"> %ile</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        {unmappedCount > 0 && (
          <p className="ui-meta">
            {unmappedCount} other exercise{unmappedCount !== 1 ? 's' : ''} have no standard benchmark yet.
          </p>
        )}

        <p className="text-[10px] text-white/30 leading-relaxed">{STRENGTH_STANDARDS_FOOTNOTE}</p>
      </div>
    </div>
  )
}

'use client'

import type { StrengthAssessment } from '@/lib/strengthStandards'
import { STRENGTH_STANDARDS_FOOTNOTE } from '@/lib/strengthStandards'

interface StrengthPercentileCardProps {
  assessment: StrengthAssessment
  compact?: boolean
}

export function StrengthPercentileCard({ assessment, compact = false }: StrengthPercentileCardProps) {
  const pct = assessment.percentile
  const barWidth = Math.min(100, Math.max(4, pct))

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between gap-2">
        <h3 className="ui-heading text-sm text-white/85">Strength vs bodyweight</h3>
        <span className="label-caps text-white/40">~{assessment.ratio.toFixed(2)}× BW</span>
      </div>
      <div className={compact ? 'p-4 space-y-3' : 'p-4 space-y-4'}>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-3xl font-semibold text-white tabular-nums leading-none">{pct}</p>
            <p className="ui-meta mt-1">estimated percentile</p>
          </div>
          <div className="text-right">
            <p className="ui-body-medium text-white">{assessment.levelLabel}</p>
            <p className="ui-meta mt-0.5">
              {Math.round(assessment.e1rmLb)} lb e1RM · {Math.round(assessment.bodyweightLb)} lb BW
            </p>
          </div>
        </div>

        <div>
          <div className="h-2 rounded-full bg-black border border-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-white/85 transition-all"
              style={{ width: `${barWidth}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="label-caps text-white/30">5th</span>
            <span className="label-caps text-white/30">50th</span>
            <span className="label-caps text-white/30">95th</span>
          </div>
        </div>

        {assessment.nextLevel && (
          <p className="ui-subtitle text-white/45">
            Next: <span className="text-white/70">{assessment.nextLevel.levelLabel}</span> (~
            {assessment.nextLevel.percentile}th) at{' '}
            <span className="text-white/80 tabular-nums">{assessment.nextLevel.targetE1rm} lb</span> e1RM
          </p>
        )}

        {!compact && (
          <p className="text-[10px] text-white/30 leading-relaxed border-t border-white/[0.06] pt-3">
            {STRENGTH_STANDARDS_FOOTNOTE}
          </p>
        )}
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { ChevronRight, Target } from 'lucide-react'
import type { CoachPlanRow } from '@/components/log/LiftGoalsView'
import { getCoachProgramSummary } from '@/lib/coachProgram'

interface ExercisesGoalsPanelProps {
  plans: CoachPlanRow[]
  exerciseBaselines: Record<string, number>
  onOpenExercise: (exerciseName: string) => void
}

export function ExercisesGoalsPanel({ plans, exerciseBaselines, onOpenExercise }: ExercisesGoalsPanelProps) {
  if (!plans.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-6 text-center">
        <Target className="w-8 h-8 text-white/25 mx-auto mb-2" />
        <p className="log-screen-support text-sm">No lift goals yet.</p>
        <p className="log-screen-support text-xs mt-1 max-w-sm mx-auto">
          Add a target weight and reps — optional date — then track progress here and in Coach chat.
        </p>
        <Link
          href="/log/goals"
          className="inline-flex mt-4 items-center gap-1 text-sm font-medium text-white hover:text-white/90"
        >
          Add a goal
          <ChevronRight className="w-4 h-4 text-white/50" />
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between gap-3">
        <div>
          <p className="log-screen-section-title text-sm">Lift goals</p>
          <p className="log-screen-support text-xs mt-1">Progress, timeline notes, and recommendations</p>
        </div>
        <Link href="/log/goals" className="action-text text-white/55 hover:text-white shrink-0">
          Manage
        </Link>
      </div>
      <ul className="divide-y divide-white/5">
        {plans.map((plan) => {
          const key = plan.exercise_name.trim()
          const current = exerciseBaselines[key] ?? null
          const target = Number(plan.target_weight)
          const pct =
            current != null && target > 0 ? Math.min(100, Math.round((current / target) * 100)) : null
          const gap = current != null && target > 0 ? Math.max(0, Math.round(target - current)) : null
          const summary = getCoachProgramSummary(plan.program_json)
          const blurb = summary.length > 220 ? `${summary.slice(0, 220)}…` : summary

          const hasDate = plan.target_date != null && String(plan.target_date).trim() !== ''
          const dateLabel = hasDate
            ? new Date(plan.target_date as string).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : null

          return (
            <li key={plan.id} className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onOpenExercise(plan.exercise_name)}
                    className="text-left ui-body-medium text-white truncate hover:text-white/90"
                  >
                    {plan.exercise_name}
                  </button>
                  <p className="text-xs text-white/45 mt-1">
                    Target {target} lb × {plan.target_reps}
                    {dateLabel ? ` · ${dateLabel}` : ' · date TBD'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenExercise(plan.exercise_name)}
                  className="text-xs font-medium text-white/50 hover:text-white whitespace-nowrap shrink-0"
                >
                  Chart & sets
                </button>
              </div>

              {current != null && (
                <p className="text-[11px] text-white/40 mb-2">
                  Est. strength now · <span className="text-white/70 tabular-nums">{Math.round(current)} lb</span> e1RM
                </p>
              )}

              {pct != null && (
                <div className="mb-3">
                  <div className="flex justify-between text-[11px] text-white/45 mb-1">
                    <span>Progress to target</span>
                    <span className="tabular-nums">
                      {pct}%
                      {gap != null && gap > 0 ? <span className="text-white/35"> · {gap} lb</span> : null}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-black/50 border border-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-white/85" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}

              {blurb ? (
                <div className="rounded-xl border border-white/08 bg-black/40 px-3 py-2.5">
                  <p className="text-[10px] font-medium text-white/35 uppercase tracking-wide mb-1">Recommendation</p>
                  <p className="text-xs text-white/60 leading-relaxed">{blurb}</p>
                </div>
              ) : null}

              <Link
                href="/log/goals"
                className="inline-flex items-center gap-0.5 mt-3 text-xs font-medium text-white/45 hover:text-white/75"
              >
                Full timeline & program
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

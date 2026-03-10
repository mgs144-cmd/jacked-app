'use client'

import { CheckCircle2, TrendingUp } from 'lucide-react'
import { calculateOneRepMaxWithRPE } from '@/utils/oneRepMax'

interface SummarySet {
  exercise_name: string
  weight: number
  reps: number
  rpe?: number | null
}

interface PostWorkoutSummaryViewProps {
  summarySets: SummarySet[]
  onViewInsights: () => void
  onLogAgain: () => void
}

export function PostWorkoutSummaryView({
  summarySets,
  onViewInsights,
  onLogAgain,
}: PostWorkoutSummaryViewProps) {
  const byExercise = summarySets.reduce<Record<string, SummarySet[]>>((acc, s) => {
    const name = s.exercise_name || 'Unknown'
    if (!acc[name]) acc[name] = []
    acc[name].push(s)
    return acc
  }, {})

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-semibold text-white">Workout logged</h2>
        <p className="text-white/60 text-sm mt-1">
          {summarySets.length} set{summarySets.length !== 1 ? 's' : ''} across {Object.keys(byExercise).length} exercise{Object.keys(byExercise).length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5">
          <h3 className="text-sm font-medium text-white/70">Summary</h3>
        </div>
        <ul className="divide-y divide-white/5">
          {Object.entries(byExercise).map(([name, sets]) => {
            const best = sets.reduce((best, s) => {
              const e1 = calculateOneRepMaxWithRPE(s.weight, s.reps, s.rpe ?? 10)
              const bestE = calculateOneRepMaxWithRPE(best.weight, best.reps, best.rpe ?? 10)
              return e1 > bestE ? s : best
            }, sets[0])
            const e1RM = calculateOneRepMaxWithRPE(best.weight, best.reps, best.rpe ?? 10)
            const setsDisplay = sets.map((s) => `${s.weight}×${s.reps}${s.rpe ? `@${s.rpe}` : ''}`).join(' · ')
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
        <button
          type="button"
          onClick={onViewInsights}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/15 text-white/90 hover:bg-white/5 transition-colors text-sm font-medium"
        >
          <TrendingUp className="w-4 h-4" />
          View insights
        </button>
        <button
          type="button"
          onClick={onLogAgain}
          className="flex-1 btn-primary py-3 font-semibold"
        >
          Log again
        </button>
      </div>
    </div>
  )
}

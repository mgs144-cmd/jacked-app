'use client'

import { Zap, ClipboardList, LayoutTemplate } from 'lucide-react'

interface QuickLogViewProps {
  onStartWorkout: () => void
  onQuickAddExercise: () => void
  recentExercises: string[]
  recentTemplates: { name: string; exerciseCount: number }[]
  onSelectRecentExercise: (name: string) => void
  onSelectTemplate: (name: string) => void
}

export function QuickLogView({
  onStartWorkout,
  onQuickAddExercise,
  recentExercises,
  recentTemplates,
  onSelectRecentExercise,
  onSelectTemplate,
}: QuickLogViewProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button type="button" onClick={onStartWorkout} className="btn btn-choice gap-3">
          <ClipboardList className="w-4 h-4 text-white/50 shrink-0 mt-0.5" />
          <span>
            <span className="btn-choice-title">Start workout</span>
            <span className="btn-choice-desc">Log a full session</span>
          </span>
        </button>
        <button type="button" onClick={onQuickAddExercise} className="btn btn-choice gap-3">
          <Zap className="w-4 h-4 text-white/50 shrink-0 mt-0.5" />
          <span>
            <span className="btn-choice-title">Quick add</span>
            <span className="btn-choice-desc">Log one exercise</span>
          </span>
        </button>
      </div>

      {recentExercises.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-white/40" />
            <h3 className="text-[10px] font-metric font-semibold uppercase tracking-widest text-white/50">
              Recent exercises
            </h3>
          </div>
          <div className="p-2">
            <div className="flex flex-wrap gap-1.5">
              {recentExercises.slice(0, 12).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => onSelectRecentExercise(name)}
                  className="btn btn-pill normal-case font-body text-xs tracking-normal"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {recentTemplates.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-white/40" />
            <h3 className="text-[10px] font-metric font-semibold uppercase tracking-widest text-white/50">
              Recent workouts
            </h3>
          </div>
          <ul className="divide-y divide-white/5 p-1">
            {recentTemplates.slice(0, 5).map((t) => (
              <li key={t.name}>
                <button type="button" onClick={() => onSelectTemplate(t.name)} className="btn btn-list">
                  <span>{t.name}</span>
                  <span className="btn-list-label">{t.exerciseCount} exercises</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {recentExercises.length === 0 && recentTemplates.length === 0 && (
        <p className="text-center text-white/50 text-sm py-6">
          Log a workout or add an exercise to see recents here.
        </p>
      )}
    </div>
  )
}

'use client'

import { Zap, Plus, ClipboardList, LayoutTemplate } from 'lucide-react'

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
      {/* Primary actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onStartWorkout}
          className="flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15 transition-all text-left group active:scale-[0.99]"
        >
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/15 transition-colors">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-white text-base">Start Workout</p>
            <p className="text-sm text-white/60 mt-0.5">Log a full session</p>
          </div>
        </button>
        <button
          type="button"
          onClick={onQuickAddExercise}
          className="flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15 transition-all text-left group active:scale-[0.99]"
        >
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/15 transition-colors">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-white text-base">Quick Add Exercise</p>
            <p className="text-sm text-white/60 mt-0.5">Log a single exercise</p>
          </div>
        </button>
      </div>

      {/* Recent exercises */}
      {recentExercises.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-white/5" />
            <h3 className="text-sm font-medium text-white/70">Recent Exercises</h3>
          </div>
          <div className="p-2">
            <div className="flex flex-wrap gap-2">
              {recentExercises.slice(0, 12).map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => onSelectRecentExercise(name)}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 text-sm font-medium transition-colors"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent templates */}
      {recentTemplates.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-white/5" />
            <h3 className="text-sm font-medium text-white/70">Recent Workouts</h3>
          </div>
          <ul className="divide-y divide-white/5">
            {recentTemplates.slice(0, 5).map((t) => (
              <li key={t.name}>
                <button
                  type="button"
                  onClick={() => onSelectTemplate(t.name)}
                  className="w-full px-4 py-3 text-left text-sm text-white/90 hover:bg-white/5 transition-colors flex items-center justify-between"
                >
                  <span className="font-medium">{t.name}</span>
                  <span className="text-white/50">{t.exerciseCount} exercises</span>
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

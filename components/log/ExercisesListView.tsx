'use client'

import { useState } from 'react'
import { Search, BarChart3 } from 'lucide-react'

interface ExercisesListViewProps {
  exercises: string[]
  chartDataByExercise: Record<string, { date: string; e1RM: number; weight: number; reps: number }[]>
  onSelectExercise: (name: string) => void
}

export function ExercisesListView({
  exercises,
  chartDataByExercise,
  onSelectExercise,
}: ExercisesListViewProps) {
  const [search, setSearch] = useState('')
  const filtered = search.trim()
    ? exercises.filter((ex) => ex.toLowerCase().includes(search.toLowerCase()))
    : exercises

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search exercises"
          className="input-field w-full pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
          <BarChart3 className="w-10 h-10 text-white/20 mx-auto mb-2" />
          <p className="text-white/60 text-sm">
            {search.trim() ? 'No exercises match.' : 'Log some lifts to see exercise trends.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-1">
          {filtered.map((name) => {
            const data = chartDataByExercise[name] || []
            const latest = data.length > 0 ? data[data.length - 1] : null
            return (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => onSelectExercise(name)}
                  className="w-full flex items-center justify-between gap-4 px-4 py-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15 transition-all text-left"
                >
                  <span className="font-medium text-white truncate">{name}</span>
                  {latest ? (
                    <span className="text-white/60 text-sm tabular-nums shrink-0">
                      {latest.e1RM} lbs e1RM
                    </span>
                  ) : (
                    <span className="text-white/40 text-sm shrink-0">—</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

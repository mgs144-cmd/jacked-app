'use client'

import { useState } from 'react'
import { Search, BarChart3 } from 'lucide-react'

interface ExercisesListViewProps {
  exercises: string[]
  chartDataByExercise: Record<string, { date: string; e1RM: number; weight: number; reps: number }[]>
  percentileByExercise?: Record<string, number>
  onSelectExercise: (name: string) => void
}

export function ExercisesListView({
  exercises,
  chartDataByExercise,
  percentileByExercise = {},
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
          <p className="log-screen-support text-sm">
            {search.trim() ? 'No exercises match.' : 'Log some lifts to see exercise trends.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-1">
          {filtered.map((name) => {
            const data = chartDataByExercise[name] || []
            const latest = data.length > 0 ? data[data.length - 1] : null
            const pct = percentileByExercise[name]
            return (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => onSelectExercise(name)}
                  className="btn btn-list gap-4"
                >
                  <span className="min-w-0 flex-1 text-left">
                    <span className="ui-body-medium text-white block truncate">{name}</span>
                    {pct != null && (
                      <span className="ui-meta block">~{pct}th percentile · BW</span>
                    )}
                  </span>
                  {latest ? (
                    <span className="text-white/60 text-sm tabular-nums shrink-0">
                      {latest.e1RM} lb
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

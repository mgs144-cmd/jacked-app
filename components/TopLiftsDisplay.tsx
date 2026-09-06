'use client'

import { calculateOneRepMax } from '@/utils/oneRepMax'
import { Dumbbell } from 'lucide-react'

interface TopLift {
  exercise: string
  weight: number
  reps: number
}

interface TopLiftsDisplayProps {
  topLift1?: TopLift | null
  topLift2?: TopLift | null
  topLift3?: TopLift | null
}

export function TopLiftsDisplay({ topLift1, topLift2, topLift3 }: TopLiftsDisplayProps) {
  const lifts = [topLift1, topLift2, topLift3].filter(
    (lift): lift is TopLift =>
      lift !== null && lift !== undefined && !!lift.exercise && lift.weight > 0 && lift.reps > 0
  )

  if (lifts.length === 0) {
    return null
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-3 md:rounded-2xl md:px-4 md:py-3.5">
      <div className="mb-2.5 flex items-center gap-1.5">
        <Dumbbell className="h-4 w-4 text-white/80" />
        <h3 className="ui-section-title text-sm md:text-base">Top Lifts</h3>
      </div>

      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {lifts.map((lift, index) => {
          const oneRM = lift.reps > 1 ? calculateOneRepMax(lift.weight, lift.reps) : null

          return (
            <div
              key={index}
              className="min-w-0 rounded-lg border border-white/[0.06] bg-white/[0.02] px-1.5 py-2 text-center sm:px-2 sm:py-2.5"
            >
              <p className="mb-1 truncate text-[9px] font-semibold uppercase tracking-wide text-white/45 sm:text-[10px]">
                {lift.exercise}
              </p>
              <p className="ui-stat-value text-xl sm:text-2xl md:text-3xl tabular-nums leading-none">
                {lift.weight}
                {lift.reps > 1 ? (
                  <span className="text-sm font-semibold text-white/55 sm:text-base">×{lift.reps}</span>
                ) : null}
              </p>
              <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/40 sm:text-[10px]">
                lbs
              </p>
              {oneRM != null && (
                <p className="mt-1 text-[9px] font-medium tabular-nums text-white/45 sm:text-[10px]">
                  ~<span className="text-white/70">{oneRM}</span> 1RM
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

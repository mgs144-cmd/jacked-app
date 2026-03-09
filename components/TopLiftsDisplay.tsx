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
  const lifts = [topLift1, topLift2, topLift3].filter((lift): lift is TopLift => 
    lift !== null && lift !== undefined && !!lift.exercise && lift.weight > 0 && lift.reps > 0
  )

  if (lifts.length === 0) {
    return null
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 md:p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Dumbbell className="w-5 h-5 text-white" />
        <h3 className="text-lg font-semibold text-white tracking-tight">Top Lifts</h3>
      </div>
      
      <div className="flex flex-row gap-3 md:gap-4 overflow-x-auto pb-1 -mx-1">
        {lifts.map((lift, index) => {
          const oneRM = lift.reps > 1 ? calculateOneRepMax(lift.weight, lift.reps) : null
          
          return (
            <div 
              key={index}
              className="flex-1 min-w-[min(140px,100%)] rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center"
            >
              {/* Exercise name - matches PostCard */}
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/50 mb-2">
                {lift.exercise}
              </p>
              {/* Weight - matches PostCard hero numbers */}
              <p className="text-3xl md:text-4xl font-bold tabular-nums text-white tracking-tight leading-none">
                {lift.weight}
              </p>
              {/* LBS + reps - matches PostCard labels */}
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/50 mt-1 tabular-nums">
                LBS{lift.reps > 1 && <span className="normal-case font-normal"> × {lift.reps} reps</span>}
              </p>
              {/* Est. 1RM - matches PostCard */}
              {oneRM && (
                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/50 mt-2 tabular-nums">
                  Est. 1RM <span className="font-semibold text-white/70 normal-case">{oneRM} lbs</span>
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}


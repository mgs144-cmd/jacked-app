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
    <div className="card p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Dumbbell className="w-5 h-5 text-red-600" />
        <h3 className="text-lg font-semibold text-primary tracking-tight">Top Lifts</h3>
      </div>
      
      <div className="space-y-3">
        {lifts.map((lift, index) => {
          const oneRM = lift.reps > 1 ? calculateOneRepMax(lift.weight, lift.reps) : null
          
          return (
            <div 
              key={index}
              className="card p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-secondary mb-1">
                    {lift.exercise}
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-semibold text-primary tabular-nums">
                      {lift.weight}
                    </span>
                    <span className="text-sm text-secondary font-medium">lbs</span>
                    {lift.reps > 1 && (
                      <span className="text-sm text-secondary">
                        × {lift.reps} reps
                      </span>
                    )}
                  </div>
                  {oneRM && (
                    <div className="mt-2 text-xs text-tertiary">
                      Est. 1RM: <span className="text-red-600 font-semibold tabular-nums">{oneRM} lbs</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


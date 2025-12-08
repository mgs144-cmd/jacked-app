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
    <div className="bg-gradient-to-br from-gray-900/60 to-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Dumbbell className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-black text-white tracking-tight">Top Lifts</h3>
      </div>
      
      <div className="space-y-3">
        {lifts.map((lift, index) => {
          const oneRM = lift.reps > 1 ? calculateOneRepMax(lift.weight, lift.reps) : null
          
          return (
            <div 
              key={index}
              className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm font-bold text-gray-400 mb-1">
                    {lift.exercise}
                  </div>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-black text-white tabular-nums">
                      {lift.weight}
                    </span>
                    <span className="text-sm text-gray-500 font-bold">lbs</span>
                    {lift.reps > 1 && (
                      <span className="text-sm text-gray-400">
                        × {lift.reps} reps
                      </span>
                    )}
                  </div>
                  {oneRM && (
                    <div className="mt-2 text-xs text-gray-500">
                      Est. 1RM: <span className="text-primary font-bold tabular-nums">{oneRM} lbs</span>
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


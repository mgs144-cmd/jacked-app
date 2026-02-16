'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Dumbbell, Activity } from 'lucide-react'

interface WorkoutExercise {
  id?: string
  exercise_name: string
  sets: number | null
  reps: number | null
  weight: number | null
  order_index: number
}

interface WorkoutDetailsProps {
  exercises: WorkoutExercise[]
  postId: string
}

export function WorkoutDetails({ exercises, postId }: WorkoutDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!exercises || exercises.length === 0) return null

  const sortedExercises = [...exercises].sort((a, b) => a.order_index - b.order_index)

  return (
    <div className="px-8 py-4 border-t border-white/5 mt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left py-1"
      >
        <div className="flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-[#ff5555]" />
          <span className="text-white font-semibold text-base">
            Workout Details ({exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'})
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-[#a1a1a1]" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[#a1a1a1]" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {sortedExercises.map((exercise, index) => (
            <div
              key={exercise.id || index}
              className="bg-white/5 rounded-lg p-4 border border-white/5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#ff5555] flex-shrink-0 mt-0.5" />
                  <h4 className="text-[18px] font-semibold text-white">{exercise.exercise_name}</h4>
                </div>
                {(exercise.sets || exercise.reps || exercise.weight) && (
                  <div className="flex items-center gap-4 text-sm text-[#a1a1a1]">
                    {exercise.sets != null && (
                      <span><span className="font-semibold text-white tabular-nums">{exercise.sets}</span> sets</span>
                    )}
                    {exercise.reps != null && (
                      <span><span className="font-semibold text-white tabular-nums">{exercise.reps}</span> reps</span>
                    )}
                    {exercise.weight != null && (
                      <span><span className="font-semibold text-white tabular-nums">{exercise.weight}</span> lbs</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


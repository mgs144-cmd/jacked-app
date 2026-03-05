'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

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
    <div className="mt-5 pt-5 border-t border-white/[0.06]">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left py-1.5 text-[13px] font-medium text-white/60 hover:text-white/90 transition-colors"
      >
        <span>Workout details ({exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'})</span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-white/40" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/40" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-1">
          {sortedExercises.map((exercise, index) => (
            <div
              key={exercise.id || index}
              className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-white/[0.04] text-[14px]"
            >
              <span className="font-medium text-white">{exercise.exercise_name}</span>
              {(exercise.sets || exercise.reps || exercise.weight) && (
                <span className="text-white/55 tabular-nums text-[13px]">
                  {[exercise.sets != null && `${exercise.sets} sets`, exercise.reps != null && `${exercise.reps} reps`, exercise.weight != null && `${exercise.weight} lbs`].filter(Boolean).join(' · ')}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


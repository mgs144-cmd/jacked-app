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
    <div className="mt-3 pt-3 border-t border-white/5">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left py-1 text-sm text-white/80 hover:text-white transition-colors"
      >
        <span>Workout ({exercises.length})</span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-white/50" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/50" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-2">
          {sortedExercises.map((exercise, index) => (
            <div
              key={exercise.id || index}
              className="flex items-center justify-between py-2 text-sm"
            >
              <span className="font-medium text-white">{exercise.exercise_name}</span>
              {(exercise.sets || exercise.reps || exercise.weight) && (
                <span className="text-white/60 tabular-nums">
                  {[exercise.sets != null && `${exercise.sets}s`, exercise.reps != null && `${exercise.reps}r`, exercise.weight != null && `${exercise.weight}lb`].filter(Boolean).join(' · ')}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Dumbbell } from 'lucide-react'

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
    <div className="px-5 py-3 border-b border-gray-800/40">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center space-x-2">
          <Dumbbell className="w-4 h-4 text-primary" />
          <span className="text-white font-bold text-sm">
            Workout Details ({exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'})
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-3">
          {sortedExercises.map((exercise, index) => (
            <div
              key={exercise.id || index}
              className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/40"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="text-white font-bold text-sm">{exercise.exercise_name}</h4>
                {(exercise.sets || exercise.reps || exercise.weight) && (
                  <div className="flex items-center space-x-3 text-xs text-gray-400">
                    {exercise.sets && (
                      <span>
                        <span className="font-bold text-gray-300">{exercise.sets}</span> sets
                      </span>
                    )}
                    {exercise.reps && (
                      <span>
                        <span className="font-bold text-gray-300">{exercise.reps}</span> reps
                      </span>
                    )}
                    {exercise.weight && (
                      <span>
                        <span className="font-bold text-gray-300">{exercise.weight}</span> lbs
                      </span>
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


'use client'

import { useState } from 'react'
import { Plus, X, Dumbbell } from 'lucide-react'
import { ExerciseAutocomplete } from './ExerciseAutocomplete'

interface WorkoutSet {
  weight: number | null
  reps: number | null
}

interface WorkoutExercise {
  exercise_name: string
  sets_data: WorkoutSet[] // Array of sets with different weights
  order_index: number
}

interface WorkoutFormProps {
  exercises: WorkoutExercise[]
  onChange: (exercises: WorkoutExercise[]) => void
}

export function WorkoutForm({ exercises, onChange }: WorkoutFormProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const addExercise = () => {
    onChange([
      ...exercises,
      {
        exercise_name: '',
        sets_data: [{ weight: null, reps: null }],
        order_index: exercises.length,
      },
    ])
  }

  const removeExercise = (index: number) => {
    const newExercises = exercises.filter((_, i) => i !== index)
    // Reorder indices
    newExercises.forEach((ex, i) => {
      ex.order_index = i
    })
    onChange(newExercises)
  }

  const updateExercise = (index: number, field: keyof WorkoutExercise, value: any) => {
    const newExercises = [...exercises]
    newExercises[index] = { ...newExercises[index], [field]: value }
    onChange(newExercises)
  }

  const addSet = (exerciseIndex: number) => {
    const newExercises = [...exercises]
    newExercises[exerciseIndex].sets_data.push({ weight: null, reps: null })
    onChange(newExercises)
  }

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const newExercises = [...exercises]
    if (newExercises[exerciseIndex].sets_data.length > 1) {
      newExercises[exerciseIndex].sets_data = newExercises[exerciseIndex].sets_data.filter((_, i) => i !== setIndex)
      onChange(newExercises)
    }
  }

  const updateSet = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: number | null) => {
    const newExercises = [...exercises]
    newExercises[exerciseIndex].sets_data[setIndex] = {
      ...newExercises[exerciseIndex].sets_data[setIndex],
      [field]: value,
    }
    onChange(newExercises)
  }

  const calculateExerciseVolume = (sets: WorkoutSet[]) => {
    return sets.reduce((total, set) => {
      const weight = set.weight || 0
      const reps = set.reps || 0
      return total + (weight * reps)
    }, 0)
  }

  return (
    <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800/60 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Dumbbell className="w-5 h-5 text-primary" />
          <h3 className="text-white font-bold">Workout Details (Optional)</h3>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {exercises.map((exercise, exerciseIndex) => {
            const exerciseVolume = calculateExerciseVolume(exercise.sets_data)
            
            return (
              <div
                key={exerciseIndex}
                className="bg-gray-800/40 rounded-lg p-4 border border-gray-700/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-bold">EXERCISE {exerciseIndex + 1}</span>
                  {exercises.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExercise(exerciseIndex)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">EXERCISE NAME</label>
                  <ExerciseAutocomplete
                    value={exercise.exercise_name}
                    onChange={(value) => updateExercise(exerciseIndex, 'exercise_name', value)}
                    placeholder="e.g., Bench Press"
                    className="input-field w-full text-sm"
                  />
                </div>

                {/* Sets with Different Weights */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-gray-400">SETS</label>
                    <button
                      type="button"
                      onClick={() => addSet(exerciseIndex)}
                      className="text-primary hover:text-primary/80 transition-colors flex items-center space-x-1 text-xs font-bold"
                    >
                      <Plus className="w-3 h-3" />
                      <span>ADD SET</span>
                    </button>
                  </div>
                  <div className="space-y-2">
                    {exercise.sets_data.map((set, setIndex) => (
                      <div key={setIndex} className="bg-gray-900/60 rounded-lg p-2 border border-gray-700/40">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-500">Set {setIndex + 1}</span>
                          {exercise.sets_data.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSet(exerciseIndex, setIndex)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">WEIGHT (lbs)</label>
                            <input
                              type="number"
                              value={set.weight || ''}
                              onChange={(e) => updateSet(exerciseIndex, setIndex, 'weight', e.target.value ? parseFloat(e.target.value) : null)}
                              placeholder="225"
                              min="0"
                              step="0.5"
                              className="input-field w-full text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">REPS</label>
                            <input
                              type="number"
                              value={set.reps || ''}
                              onChange={(e) => updateSet(exerciseIndex, setIndex, 'reps', e.target.value ? parseInt(e.target.value) : null)}
                              placeholder="10"
                              min="1"
                              className="input-field w-full text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {exerciseVolume > 0 && (
                    <div className="mt-2 text-xs text-gray-400">
                      Exercise Volume: <span className="text-primary font-bold">{exerciseVolume.toLocaleString()} lbs</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          <button
            type="button"
            onClick={addExercise}
            className="w-full btn-secondary py-3 flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span className="font-bold text-sm">ADD EXERCISE</span>
          </button>
        </div>
      )}
    </div>
  )
}

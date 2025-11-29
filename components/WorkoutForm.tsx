'use client'

import { useState } from 'react'
import { Plus, X, Dumbbell } from 'lucide-react'
import { ExerciseAutocomplete } from './ExerciseAutocomplete'

interface WorkoutExercise {
  exercise_name: string
  sets: number | null
  reps: number | null
  weight: number | null
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
        sets: null,
        reps: null,
        weight: null,
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
          {exercises.map((exercise, index) => (
            <div
              key={index}
              className="bg-gray-800/40 rounded-lg p-4 border border-gray-700/40 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-bold">EXERCISE {index + 1}</span>
                {exercises.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExercise(index)}
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
                  onChange={(value) => updateExercise(index, 'exercise_name', value)}
                  placeholder="e.g., Bench Press"
                  className="input-field w-full text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">SETS</label>
                  <input
                    type="number"
                    value={exercise.sets || ''}
                    onChange={(e) => updateExercise(index, 'sets', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="3"
                    min="1"
                    className="input-field w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">REPS</label>
                  <input
                    type="number"
                    value={exercise.reps || ''}
                    onChange={(e) => updateExercise(index, 'reps', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="10"
                    min="1"
                    className="input-field w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1">WEIGHT (lbs)</label>
                  <input
                    type="number"
                    value={exercise.weight || ''}
                    onChange={(e) => updateExercise(index, 'weight', e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="225"
                    min="0"
                    step="0.5"
                    className="input-field w-full text-sm"
                  />
                </div>
              </div>
            </div>
          ))}

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


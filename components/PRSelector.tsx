'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Dumbbell, Loader2, ArrowRight } from 'lucide-react'
import { calculateOneRepMax } from '@/utils/oneRepMax'

interface WorkoutExercise {
  id: string
  exercise_name: string
  weight: number
  reps: number
  sets: number
  post_id: string
  created_at: string
}

interface PRSelectorProps {
  userId: string
  onSelect: (exercise: { exercise: string; weight: number; reps: number }) => void
  onClose: () => void
  currentLiftNumber: number
}

export function PRSelector({ userId, onSelect, onClose, currentLiftNumber }: PRSelectorProps) {
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedExercise, setSelectedExercise] = useState<string>('')
  const supabase = createClient()

  useEffect(() => {
    loadUserPRs()
  }, [userId])

  const loadUserPRs = async () => {
    try {
      // Get all workout exercises from user's posts
      const { data: posts } = await supabase
        .from('posts')
        .select(`
          id,
          created_at,
          workout_exercises (
            id,
            exercise_name,
            weight,
            reps,
            sets
          )
        `)
        .eq('user_id', userId)
        .not('workout_exercises', 'is', null)
        .order('created_at', { ascending: false })

      // Flatten the workout exercises
      const allExercises: WorkoutExercise[] = []
      posts?.forEach((post: any) => {
        if (post.workout_exercises && Array.isArray(post.workout_exercises)) {
          post.workout_exercises.forEach((ex: any) => {
            allExercises.push({
              ...ex,
              post_id: post.id,
              created_at: post.created_at
            })
          })
        }
      })

      // Group by exercise name and find the best set (highest weight or highest calculated 1RM)
      const exerciseMap = new Map<string, WorkoutExercise>()
      
      allExercises.forEach((ex) => {
        const name = ex.exercise_name
        const existing = exerciseMap.get(name)
        
        if (!existing) {
          exerciseMap.set(name, ex)
        } else {
          // Compare by 1RM estimate
          const existingRM = ex.reps > 1 ? calculateOneRepMax(existing.weight, existing.reps) : existing.weight
          const currentRM = ex.reps > 1 ? calculateOneRepMax(ex.weight, ex.reps) : ex.weight
          
          if (currentRM > existingRM) {
            exerciseMap.set(name, ex)
          }
        }
      })

      // Convert to array and sort by 1RM
      const sortedExercises = Array.from(exerciseMap.values()).sort((a, b) => {
        const aRM = a.reps > 1 ? calculateOneRepMax(a.weight, a.reps) : a.weight
        const bRM = b.reps > 1 ? calculateOneRepMax(b.weight, b.reps) : b.weight
        return bRM - aRM
      })

      setExercises(sortedExercises)
    } catch (error) {
      console.error('Error loading PRs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (exercise: WorkoutExercise) => {
    onSelect({
      exercise: exercise.exercise_name,
      weight: exercise.weight,
      reps: exercise.reps
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center space-x-2">
              <Dumbbell className="w-6 h-6 text-primary" />
              <span>Select Lift #{currentLiftNumber}</span>
            </h2>
            <p className="text-xs md:text-sm text-gray-400 mt-1">Choose from your posted PRs</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : exercises.length === 0 ? (
            <div className="text-center py-12">
              <Dumbbell className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">No workout exercises found</p>
              <p className="text-gray-600 text-sm mt-2">Post some PR workouts to see them here!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {exercises.map((ex) => {
                const oneRM = ex.reps > 1 ? calculateOneRepMax(ex.weight, ex.reps) : null
                
                return (
                  <button
                    key={ex.id}
                    onClick={() => handleSelect(ex)}
                    className="w-full text-left bg-gray-800/60 hover:bg-gray-800 border border-gray-700 hover:border-primary/50 rounded-xl p-3 md:p-4 transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-base md:text-lg font-bold text-white truncate">
                            {ex.exercise_name}
                          </h3>
                        </div>
                        <div className="flex items-baseline space-x-2 flex-wrap">
                          <span className="text-xl md:text-2xl font-black text-primary tabular-nums">
                            {ex.weight}
                          </span>
                          <span className="text-sm text-gray-500 font-bold">lbs</span>
                          {ex.reps > 1 && (
                            <span className="text-sm text-gray-400">× {ex.reps} reps</span>
                          )}
                        </div>
                        {oneRM && (
                          <div className="mt-1 text-xs text-gray-500">
                            Est. 1RM: <span className="text-primary font-bold tabular-nums">{oneRM} lbs</span>
                          </div>
                        )}
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-primary transition-colors shrink-0 ml-2" />
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-4">
          <button
            onClick={onClose}
            className="btn-secondary w-full py-3 font-bold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}


'use client'

import { Trophy, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface PR {
  id: string
  exercise_name: string
  weight: number | null
  reps: number | null
  date: string
  video_url: string | null
  post_id: string | null
}

interface PRDisplayProps {
  prs: PR[]
  userId: string
  isOwnProfile?: boolean
}

export function PRDisplay({ prs, userId, isOwnProfile = false }: PRDisplayProps) {
  if (!prs || prs.length === 0) {
    if (isOwnProfile) {
      return (
        <div className="card p-8 text-center">
          <Trophy className="w-12 h-12 text-tertiary mx-auto mb-4" />
          <p className="text-secondary font-medium mb-2">No PRs yet</p>
          <p className="text-tertiary text-sm">Start tracking your personal records!</p>
        </div>
      )
    }
    return null
  }

  // Group PRs by exercise
  const prsByExercise = prs.reduce((acc, pr) => {
    if (!acc[pr.exercise_name]) {
      acc[pr.exercise_name] = []
    }
    acc[pr.exercise_name].push(pr)
    return acc
  }, {} as Record<string, PR[]>)

  // Sort exercises alphabetically
  const exercises = Object.keys(prsByExercise).sort()

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2.5">
        <Trophy className="w-5 h-5 text-red-600" />
        <h2 className="text-lg font-semibold text-primary tracking-tight">Personal Records</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exercises.map((exercise) => {
          const exercisePRs = prsByExercise[exercise]
          // Get the most recent PR for this exercise
          const latestPR = exercisePRs.sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          )[0]

          return (
            <div
              key={exercise}
              className="card transition-all duration-200 hover:border-red-600/20"
            >
              <div className="p-5">
                <div className="space-y-4">
                  {/* Exercise Name with Trophy */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <Trophy className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <h3 className="text-xl font-semibold text-primary">{exercise}</h3>
                    </div>
                    {latestPR.post_id && (
                      <Link
                        href={`/post/${latestPR.post_id}`}
                        className="text-red-600 hover:text-red-700 text-xs font-medium transition-colors"
                      >
                        View Post
                      </Link>
                    )}
                  </div>

                  {/* Weight and Reps */}
                  {(latestPR.weight || latestPR.reps) && (
                    <div className="flex items-center space-x-6 pl-7">
                      {latestPR.weight && (
                        <div className="flex items-baseline space-x-1.5">
                          <span className="text-2xl font-semibold text-primary">{latestPR.weight}</span>
                          <span className="text-sm font-medium text-secondary">lbs</span>
                        </div>
                      )}
                      
                      {latestPR.reps && (
                        <div className="flex items-baseline space-x-1.5">
                          <span className="text-2xl font-semibold text-primary">{latestPR.reps}</span>
                          <span className="text-sm font-medium text-secondary">reps</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Date */}
                  <div className="flex items-center space-x-2 text-xs text-tertiary pl-7">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {formatDistanceToNow(new Date(latestPR.date), { addSuffix: true })}
                    </span>
                  </div>

                  {/* Video Link */}
                  {latestPR.video_url && (
                    <div className="pl-7 pt-2">
                      <a
                        href={latestPR.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-600 hover:text-red-700 text-xs font-medium transition-colors"
                      >
                        Watch Video →
                      </a>
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


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
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800/60 p-8 text-center">
          <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 font-semibold mb-2">No PRs yet</p>
          <p className="text-gray-600 text-sm">Start tracking your personal records!</p>
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
      <div className="flex items-center space-x-3">
        <Trophy className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-black text-white tracking-tight">Personal Records</h2>
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
              className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800/60 p-4 hover:border-primary/30 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-white font-bold text-lg">{exercise}</h3>
                {latestPR.post_id && (
                  <Link
                    href={`/post/${latestPR.post_id}`}
                    className="text-primary hover:text-white text-xs font-bold"
                  >
                    VIEW POST
                  </Link>
                )}
              </div>

              <div className="space-y-2">
                {latestPR.weight && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Weight</span>
                    <span className="text-white font-bold">{latestPR.weight} lbs</span>
                  </div>
                )}
                {latestPR.reps && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Reps</span>
                    <span className="text-white font-bold">{latestPR.reps}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-xs text-gray-500 pt-2 border-t border-gray-800/40">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {formatDistanceToNow(new Date(latestPR.date), { addSuffix: true })}
                  </span>
                </div>
              </div>

              {latestPR.video_url && (
                <div className="mt-3 pt-3 border-t border-gray-800/40">
                  <a
                    href={latestPR.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-white text-xs font-bold"
                  >
                    WATCH VIDEO →
                  </a>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}


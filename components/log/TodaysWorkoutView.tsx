'use client'

import { useEffect, useState } from 'react'
import { LogHubActions } from '@/components/log/LogHubActions'
import { LogBrandHeading } from '@/components/log/LogBrandHeading'
import { ResumeWorkoutBanner } from '@/components/log/ResumeWorkoutBanner'
import { todayISO } from '@/lib/workoutSessions'

interface TodaysWorkoutViewProps {
  onStartWorkout: (sessionDate: string) => void
  onQuickAddExercise: () => void
  resumeBanner?: {
    subtitle: string | null
    exerciseCount: number
    updatedAt: number
  } | null
  onResumeWorkout?: () => void
  onDiscardWorkout?: () => void
}

export function TodaysWorkoutView({
  onStartWorkout,
  onQuickAddExercise,
  resumeBanner,
  onResumeWorkout,
  onDiscardWorkout,
}: TodaysWorkoutViewProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="mb-0.5">
        <LogBrandHeading variant="section">Today&apos;s workout</LogBrandHeading>
      </div>

      {mounted && resumeBanner && onResumeWorkout && onDiscardWorkout && (
        <ResumeWorkoutBanner
          subtitle={resumeBanner.subtitle}
          exerciseCount={resumeBanner.exerciseCount}
          updatedAt={resumeBanner.updatedAt}
          onResume={onResumeWorkout}
          onDiscard={onDiscardWorkout}
        />
      )}

      <div suppressHydrationWarning>
        <LogHubActions
          startTitle="Start workout"
          startDescription="Today's full session"
          onStartWorkout={() => onStartWorkout(todayISO())}
          onQuickAddExercise={onQuickAddExercise}
        />
      </div>
    </div>
  )
}

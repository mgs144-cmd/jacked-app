'use client'

import { ActiveWorkoutView } from '@/components/log/ActiveWorkoutView'
import { createEmptySet } from '@/lib/buildLiftLogRows'
import { formatWorkoutDate } from '@/lib/workoutSessions'
import type { LiftRow } from '@/lib/liftChartData'
import type { WorkoutExerciseEntry } from '@/components/log/types'

interface EditPastWorkoutViewProps {
  originalDate: string
  sessionDate: string
  onSessionDateChange: (date: string) => void
  exercises: WorkoutExerciseEntry[]
  onExercisesChange: (exercises: WorkoutExerciseEntry[]) => void
  onSave: () => void
  onCancel: () => void
  onDeleteWorkout: () => void
  previousBestByExercise: Record<string, string>
  allLifts: LiftRow[]
  userId: string
  recentExerciseNames: string[]
  loading?: boolean
}

export function EditPastWorkoutView({
  originalDate,
  sessionDate,
  onSessionDateChange,
  exercises,
  onExercisesChange,
  onSave,
  onCancel,
  onDeleteWorkout,
  previousBestByExercise,
  allLifts,
  userId,
  recentExerciseNames,
  loading = false,
}: EditPastWorkoutViewProps) {
  const handleDelete = () => {
    if (
      !confirm(
        `Delete all logged sets for ${formatWorkoutDate(originalDate)}? This cannot be undone.`
      )
    ) {
      return
    }
    onDeleteWorkout()
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onCancel} className="ui-body text-sm text-white/60 hover:text-white">
          ← Back
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="text-xs font-medium text-red-400/80 hover:text-red-400"
        >
          Delete workout
        </button>
      </div>

      <div>
        <h2 className="log-screen-section-title">Edit workout</h2>
        <p className="log-screen-meta mt-1">Originally logged for {formatWorkoutDate(originalDate)}</p>
      </div>

      <ActiveWorkoutView
        exercises={exercises}
        onExercisesChange={onExercisesChange}
        onFinishWorkout={onSave}
        onAddExercise={() =>
          onExercisesChange([
            ...exercises,
            {
              id: crypto.randomUUID(),
              exercise_name: '',
              sets: [createEmptySet('')],
            },
          ])
        }
        previousBestByExercise={previousBestByExercise}
        workoutSubtitle="Editing logged sets"
        sessionDate={sessionDate}
        onSessionDateChange={onSessionDateChange}
        allLifts={allLifts}
        userId={userId}
        recentExerciseNames={recentExerciseNames}
      />

      {loading && (
        <p className="text-center text-sm text-white/50 animate-pulse">Saving…</p>
      )}
    </div>
  )
}

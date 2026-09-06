'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { SetEntry, WorkoutExerciseEntry } from '@/components/log/types'
import {
  buildWorkoutDraft,
  clearWorkoutDraft,
  formatDraftSavedAgo,
  loadWorkoutDraft,
  saveWorkoutDraft,
  type WorkoutDraft,
  type WorkoutDraftMode,
} from '@/lib/workoutDraft'

type QuickLogSubView =
  | 'default'
  | 'active-workout'
  | 'quick-single'
  | 'post-summary'
  | 'edit-past-workout'

type DraftRestore = {
  mode: WorkoutDraftMode
  sessionDate?: string
  workoutExercises?: WorkoutExerciseEntry[]
  activeWorkoutSubtitle?: string | null
  singleExerciseName?: string
  singleExerciseSets?: SetEntry[]
}

export function useWorkoutDraftPersistence(
  userId: string,
  quickLogSubView: QuickLogSubView,
  sessionDate: string,
  workoutExercises: WorkoutExerciseEntry[],
  activeWorkoutSubtitle: string | null,
  singleExerciseName: string,
  singleExerciseSets: SetEntry[]
) {
  const hydrated = useRef(false)
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null)
  const [pendingRestore, setPendingRestore] = useState<WorkoutDraft | null>(null)

  const persistNow = useCallback(() => {
    if (quickLogSubView === 'post-summary' || quickLogSubView === 'edit-past-workout') {
      clearWorkoutDraft(userId)
      setDraftSavedAt(null)
      return
    }

    const mode: WorkoutDraftMode | null =
      quickLogSubView === 'active-workout'
        ? 'active-workout'
        : quickLogSubView === 'quick-single'
          ? 'quick-single'
          : null

    if (!mode) {
      const idleDraft = buildWorkoutDraft({
        mode: 'active-workout',
        sessionDate,
        workoutExercises,
        activeWorkoutSubtitle,
        singleExerciseName,
        singleExerciseSets,
      })
      if (idleDraft && workoutExercises.length > 0) {
        saveWorkoutDraft(userId, idleDraft)
        setDraftSavedAt(Date.now())
      }
      return
    }

    const draft = buildWorkoutDraft({
      mode,
      sessionDate,
      workoutExercises,
      activeWorkoutSubtitle,
      singleExerciseName,
      singleExerciseSets,
    })

    if (!draft) {
      clearWorkoutDraft(userId)
      setDraftSavedAt(null)
      return
    }

    saveWorkoutDraft(userId, draft)
    setDraftSavedAt(draft.updatedAt)
  }, [
    userId,
    quickLogSubView,
    sessionDate,
    workoutExercises,
    activeWorkoutSubtitle,
    singleExerciseName,
    singleExerciseSets,
  ])

  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true
    const draft = loadWorkoutDraft(userId)
    if (draft) setPendingRestore(draft)
  }, [userId])

  useEffect(() => {
    if (!hydrated.current) return
    const t = window.setTimeout(persistNow, 350)
    return () => window.clearTimeout(t)
  }, [persistNow])

  useEffect(() => {
    if (!hydrated.current) return
    const flush = () => persistNow()
    window.addEventListener('pagehide', flush)
    window.addEventListener('beforeunload', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      window.removeEventListener('beforeunload', flush)
    }
  }, [persistNow])

  const applyPendingRestore = useCallback((): DraftRestore | null => {
    if (!pendingRestore) return null
    const current = pendingRestore
    setPendingRestore(null)
    setDraftSavedAt(current.updatedAt)
    return {
      mode: current.mode,
      sessionDate: current.sessionDate,
      workoutExercises: current.workoutExercises,
      activeWorkoutSubtitle: current.activeWorkoutSubtitle ?? null,
      singleExerciseName: current.singleExerciseName,
      singleExerciseSets: current.singleExerciseSets,
    }
  }, [pendingRestore])

  const discardDraft = useCallback(() => {
    clearWorkoutDraft(userId)
    setDraftSavedAt(null)
    setPendingRestore(null)
  }, [userId])

  const draftSavedLabel = draftSavedAt != null ? formatDraftSavedAgo(draftSavedAt) : null

  return {
    pendingRestore,
    draftSavedLabel,
    persistNow,
    discardDraft,
    applyPendingRestore,
    clearDraft: () => {
      discardDraft()
    },
  }
}

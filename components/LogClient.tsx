'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { calculateOneRepMaxWithRPE } from '@/utils/oneRepMax'
import { collectAllLiftsFromSources, buildChartDataByExercise, latestE1RMByExercise } from '@/lib/liftChartData'
import { getCoachProgramSummary } from '@/lib/coachProgram'
import type { LogSegment, WorkoutExerciseEntry, SetEntry } from '@/components/log/types'
import { LogSegmentedTabs } from '@/components/log/LogSegmentedTabs'
import { BrandHeading } from '@/components/BrandHeading'
import { TodaysWorkoutView } from '@/components/log/TodaysWorkoutView'
import { TrackingView } from '@/components/log/TrackingView'
import { ActiveWorkoutView } from '@/components/log/ActiveWorkoutView'
import { QuickSingleExerciseView } from '@/components/log/QuickSingleExerciseView'
import { PostWorkoutSummaryView } from '@/components/log/PostWorkoutSummaryView'
import { EditPastWorkoutView } from '@/components/log/EditPastWorkoutView'
import { ExercisesListView } from '@/components/log/ExercisesListView'
import { ExerciseDetailView } from '@/components/log/ExerciseDetailView'
import type { InsightsChatMessage } from '@/components/log/InsightsView'
import Link from 'next/link'
import { ChevronRight, Target } from 'lucide-react'
import type { CoachPlanRow } from '@/components/log/LiftGoalsView'
import { ExercisesGoalsPanel } from '@/components/log/ExercisesGoalsPanel'
import {
  type TrainingProgramRow,
  type ProgramDay,
  type TrainingProgramJson,
  DEFAULT_TRAINING_GOAL,
  buildWorkoutFromProgramDay,
  buildWorkoutFromTemplate,
  extractWorkoutTemplates,
} from '@/lib/trainingProgram'
import {
  type WorkoutDayTemplateRow,
  type WorkoutDayTemplateJson,
  type TemplateSlotResolution,
  buildWorkoutFromTemplateBlank,
  buildWorkoutFromTemplateLastSession,
} from '@/lib/workoutDayTemplates'
import { formatWorkoutDate, todayISO, toLoggedAtIso } from '@/lib/workoutSessions'
import { SessionDatePicker } from '@/components/log/SessionDatePicker'
import { buildLiftLogRowsFromSets, createEmptySet } from '@/lib/buildLiftLogRows'
import { ensureExercisesInCatalog } from '@/lib/exerciseCatalog'
import {
  upsertBodyWeightForToday,
  updateStrengthSex,
  type BodyWeightTrendPoint,
} from '@/lib/bodyWeight'
import {
  assessStrength,
  buildLiftStrengthOverview,
  type StrengthSex,
} from '@/lib/strengthStandards'
import { BodyWeightPanel } from '@/components/log/BodyWeightPanel'
import { StrengthOverviewPanel } from '@/components/log/StrengthOverviewPanel'
import { WorkoutDraftBar } from '@/components/log/WorkoutDraftBar'
import { ResumeWorkoutBanner } from '@/components/log/ResumeWorkoutBanner'
import { useWorkoutDraftPersistence } from '@/hooks/useWorkoutDraftPersistence'
import { activeWorkoutHasContent } from '@/lib/workoutDraft'
import {
  getLiftLogsForDate,
  liftLogsToWorkoutEntries,
  type LiftLogRecord,
} from '@/lib/workoutDayDetail'

interface LogClientProps {
  liftLogs: any[]
  liftGoals: any[]
  logPosts: any[]
  userId: string
  coachPlans?: CoachPlanRow[]
  initialInsightsMessages?: InsightsChatMessage[]
  initialPrograms?: TrainingProgramRow[]
  initialDayTemplates?: WorkoutDayTemplateRow[]
  initialBodyWeightLogs?: BodyWeightTrendPoint[]
  initialStrengthSex?: StrengthSex | null
}

type QuickLogSubView =
  | 'default'
  | 'active-workout'
  | 'quick-single'
  | 'post-summary'
  | 'edit-past-workout'

function getOverloadStatus(
  chartData: { date: string; e1RM: number }[]
): 'progressing' | 'steady' | 'plateau' | 'regression' | 'insufficient_data' {
  if (chartData.length < 2) return 'insufficient_data'
  const recent = chartData.slice(-6)
  const first = recent[0].e1RM
  const last = recent[recent.length - 1].e1RM
  const delta = last - first
  const pct = first > 0 ? (delta / first) * 100 : 0
  if (pct >= 2) return 'progressing'
  if (pct <= -2) return 'regression'
  if (pct >= -0.5 && pct <= 0.5) return 'steady'
  return 'plateau'
}

export function LogClient({
  liftLogs,
  liftGoals,
  logPosts,
  userId,
  coachPlans = [],
  initialInsightsMessages = [],
  initialPrograms = [],
  initialDayTemplates = [],
  initialBodyWeightLogs = [],
  initialStrengthSex = null,
}: LogClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [bodyWeightLogs, setBodyWeightLogs] = useState<BodyWeightTrendPoint[]>(initialBodyWeightLogs)
  const [strengthSex, setStrengthSex] = useState<StrengthSex | null>(initialStrengthSex)

  const [segment, setSegment] = useState<LogSegment>('workout')
  const [quickLogSubView, setQuickLogSubView] = useState<QuickLogSubView>('default')
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExerciseEntry[]>([])
  const [singleExerciseName, setSingleExerciseName] = useState('')
  const [singleExerciseSets, setSingleExerciseSets] = useState<SetEntry[]>([
    { weight: '', reps: '', rpe: '' },
  ])
  const [postSummarySets, setPostSummarySets] = useState<{ exercise_name: string; weight: number; reps: number; rpe?: number | null }[] | null>(null)
  const [selectedExerciseDetail, setSelectedExerciseDetail] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [programs, setPrograms] = useState<TrainingProgramRow[]>(initialPrograms)
  const [dayTemplates, setDayTemplates] = useState<WorkoutDayTemplateRow[]>(initialDayTemplates)
  const [activeWorkoutSubtitle, setActiveWorkoutSubtitle] = useState<string | null>(null)
  const [sessionDate, setSessionDate] = useState('')
  const [lastSummarySessionDate, setLastSummarySessionDate] = useState<string | null>(null)
  const [editWorkoutOriginalDate, setEditWorkoutOriginalDate] = useState<string | null>(null)

  const liftLogRecords = useMemo<LiftLogRecord[]>(
    () =>
      liftLogs.map((l: any) => ({
        id: String(l.id),
        user_id: String(l.user_id),
        exercise_name: l.exercise_name,
        weight: Number(l.weight),
        reps: Number(l.reps),
        rpe: l.rpe != null ? Number(l.rpe) : null,
        logged_at: l.logged_at,
        notes: l.notes ?? null,
        range_spot: l.range_spot ?? null,
      })),
    [liftLogs]
  )

  const draftPersistence = useWorkoutDraftPersistence(
    userId,
    quickLogSubView,
    sessionDate || todayISO(),
    workoutExercises,
    activeWorkoutSubtitle,
    singleExerciseName,
    singleExerciseSets
  )

  useEffect(() => {
    setSessionDate((prev) => (prev ? prev : todayISO()))
  }, [])

  useEffect(() => {
    const restored = draftPersistence.applyPendingRestore()
    if (!restored) return
    setSegment('workout')
    setPostSummarySets(null)
    if (restored.sessionDate) setSessionDate(restored.sessionDate)
    if (restored.mode === 'active-workout' && restored.workoutExercises?.length) {
      setWorkoutExercises(restored.workoutExercises)
      setActiveWorkoutSubtitle(restored.activeWorkoutSubtitle ?? null)
      setQuickLogSubView('active-workout')
    } else if (restored.mode === 'quick-single') {
      setSingleExerciseName(restored.singleExerciseName ?? '')
      setSingleExerciseSets(
        restored.singleExerciseSets?.length
          ? restored.singleExerciseSets
          : [{ weight: '', reps: '', rpe: '' }]
      )
      setQuickLogSubView('quick-single')
    }
  }, [draftPersistence.pendingRestore])

  const resumeInProgressWorkout = useCallback(() => {
    setSegment('workout')
    setPostSummarySets(null)
    if (activeWorkoutHasContent(workoutExercises)) {
      setQuickLogSubView('active-workout')
      return
    }
    const restored = draftPersistence.applyPendingRestore()
    if (!restored) return
    if (restored.sessionDate) setSessionDate(restored.sessionDate)
    if (restored.mode === 'active-workout' && restored.workoutExercises?.length) {
      setWorkoutExercises(restored.workoutExercises)
      setActiveWorkoutSubtitle(restored.activeWorkoutSubtitle ?? null)
      setQuickLogSubView('active-workout')
    } else if (restored.mode === 'quick-single') {
      setSingleExerciseName(restored.singleExerciseName ?? '')
      setSingleExerciseSets(
        restored.singleExerciseSets?.length
          ? restored.singleExerciseSets
          : [{ weight: '', reps: '', rpe: '' }]
      )
      setQuickLogSubView('quick-single')
    }
  }, [workoutExercises, draftPersistence])

  const discardInProgressWorkout = useCallback(() => {
    if (!confirm('Discard this workout draft? Unlogged sets will be lost.')) return
    draftPersistence.discardDraft()
    setWorkoutExercises([])
    setActiveWorkoutSubtitle(null)
    setSessionDate(todayISO())
    setSingleExerciseName('')
    setSingleExerciseSets([{ weight: '', reps: '', rpe: '' }])
    setQuickLogSubView('default')
  }, [draftPersistence])

  const resumeBanner = useMemo(() => {
    if (quickLogSubView !== 'default') return null
    if (draftPersistence.pendingRestore) {
      const d = draftPersistence.pendingRestore
      const count =
        d.mode === 'active-workout'
          ? d.workoutExercises?.filter((e) => e.exercise_name.trim()).length ?? 0
          : d.singleExerciseName?.trim()
            ? 1
            : 0
      return {
        subtitle: d.activeWorkoutSubtitle ?? null,
        exerciseCount: count || (d.workoutExercises?.length ?? 1),
        updatedAt: d.updatedAt,
      }
    }
    if (activeWorkoutHasContent(workoutExercises)) {
      return {
        subtitle: activeWorkoutSubtitle,
        exerciseCount: workoutExercises.filter((e) => e.exercise_name.trim()).length || workoutExercises.length,
        updatedAt: Date.now(),
      }
    }
    return null
  }, [
    quickLogSubView,
    draftPersistence.pendingRestore,
    workoutExercises,
    activeWorkoutSubtitle,
  ])

  const allLifts = useMemo(() => collectAllLiftsFromSources(liftLogs, logPosts), [liftLogs, logPosts])

  const chartDataByExercise = useMemo(() => buildChartDataByExercise(allLifts), [allLifts])

  const exerciseBaselines = useMemo(
    () => latestE1RMByExercise(chartDataByExercise),
    [chartDataByExercise]
  )

  const latestBodyweightLb = useMemo(() => {
    if (bodyWeightLogs.length === 0) return null
    return bodyWeightLogs[bodyWeightLogs.length - 1].weight
  }, [bodyWeightLogs])

  const exercises = useMemo(
    () => [...new Set(allLifts.map((l) => l.exercise_name))].filter(Boolean).sort() as string[],
    [allLifts]
  )

  const strengthOverview = useMemo(() => {
    if (latestBodyweightLb == null || !strengthSex) return null
    return buildLiftStrengthOverview(exercises, exerciseBaselines, latestBodyweightLb, strengthSex)
  }, [exercises, exerciseBaselines, latestBodyweightLb, strengthSex])

  const percentileByExercise = useMemo(() => {
    const out: Record<string, number> = {}
    if (strengthOverview) {
      strengthOverview.ranked.forEach((r) => {
        out[r.exerciseName] = r.assessment.percentile
      })
    }
    return out
  }, [strengthOverview])

  const detailStrengthAssessment = useMemo(() => {
    if (!selectedExerciseDetail || latestBodyweightLb == null || !strengthSex) return null
    const e1rm = exerciseBaselines[selectedExerciseDetail]
    if (e1rm == null || e1rm <= 0) return null
    return assessStrength({
      exerciseName: selectedExerciseDetail,
      e1rmLb: e1rm,
      bodyweightLb: latestBodyweightLb,
      sex: strengthSex,
    })
  }, [selectedExerciseDetail, latestBodyweightLb, strengthSex, exerciseBaselines])

  const recentExercises = useMemo(() => {
    const seen = new Set<string>()
    return allLifts
      .map((l) => l.exercise_name)
      .filter((name) => name && !seen.has(name) && (seen.add(name), true))
      .slice(0, 16)
  }, [allLifts])

  const workoutTemplates = useMemo(() => extractWorkoutTemplates(logPosts), [logPosts])

  const recentTemplates = useMemo(() => {
    const byDate: Record<string, Set<string>> = {}
    logPosts?.forEach((p: any) => {
      const date = p.created_at?.split('T')[0] || p.created_at
      if (!date) return
      const names = new Set<string>()
      if (p.workout_exercises?.length) {
        p.workout_exercises.forEach((we: any) => we.exercise_name && names.add(we.exercise_name))
      }
      if (p.is_pr_post && p.pr_exercise) names.add(p.pr_exercise)
      if (names.size === 0) return
      if (!byDate[date]) byDate[date] = new Set()
      names.forEach((n) => byDate[date].add(n))
    })
    return Object.entries(byDate)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 5)
      .map(([date, names]) => ({
        name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        exerciseCount: names.size,
      }))
  }, [logPosts])

  const previousBestByExercise = useMemo(() => {
    const out: Record<string, string> = {}
    Object.entries(chartDataByExercise).forEach(([name, data]) => {
      if (data.length > 0) {
        const last = data[data.length - 1]
        out[name] = `${last.weight}×${last.reps} (e1RM ${last.e1RM} lbs)`
      }
    })
    return out
  }, [chartDataByExercise])

  const startWorkout = (
    preset?: WorkoutExerciseEntry[],
    subtitle?: string,
    sessionDateOverride?: string
  ) => {
    setEditWorkoutOriginalDate(null)
    setSessionDate(sessionDateOverride ?? todayISO())
    setWorkoutExercises(
      preset?.length
        ? preset
        : [
            {
              id: crypto.randomUUID(),
              exercise_name: '',
              sets: [createEmptySet('')],
            },
          ]
    )
    setActiveWorkoutSubtitle(subtitle ?? null)
    setSegment('workout')
    setQuickLogSubView('active-workout')
    setPostSummarySets(null)
  }

  const startProgramDay = (day: ProgramDay, programName: string) => {
    const entries = buildWorkoutFromProgramDay(day, allLifts, exerciseBaselines)
    if (!entries.length) {
      alert('Add exercises to this day in your program first.')
      return
    }
    startWorkout(entries, `${programName} · ${day.label}`)
  }

  const startFromTemplate = (template: ReturnType<typeof extractWorkoutTemplates>[0]) => {
    const entries = buildWorkoutFromTemplate(template, allLifts, exerciseBaselines)
    startWorkout(entries, template.label)
  }

  const startDayTemplate = (
    template: WorkoutDayTemplateRow,
    mode: 'blank' | 'last',
    resolved: TemplateSlotResolution
  ) => {
    if (mode === 'blank') {
      const entries = buildWorkoutFromTemplateBlank(template, resolved)
      if (!entries.length) {
        alert('Add exercises to this template first.')
        return
      }
      startWorkout(entries, template.label)
      return
    }
    const result = buildWorkoutFromTemplateLastSession(template, allLifts, resolved)
    if (!result) {
      alert(
        'No logged session found for this template yet. Log a day with these exercises, or start blank.'
      )
      return
    }
    startWorkout(result.entries, `${template.label} · ${formatWorkoutDate(result.sessionDate)}`)
  }

  const saveDayTemplate = async (payload: {
    id?: string
    label: string
    template_json: WorkoutDayTemplateJson
  }) => {
    const row = {
      label: payload.label,
      template_json: payload.template_json,
      updated_at: new Date().toISOString(),
    }
    if (payload.id) {
      const { error } = await (supabase.from('workout_day_templates') as any)
        .update(row)
        .eq('id', payload.id)
        .eq('user_id', userId)
      if (error) throw error
      setDayTemplates((prev) =>
        prev.map((t) => (t.id === payload.id ? { ...t, ...row, template_json: payload.template_json } : t))
      )
    } else {
      const { data, error } = await (supabase.from('workout_day_templates') as any)
        .insert({ ...row, user_id: userId })
        .select('*')
        .single()
      if (error) throw error
      setDayTemplates((prev) => [data as WorkoutDayTemplateRow, ...prev])
    }
    router.refresh()
  }

  const deleteDayTemplate = async (id: string) => {
    if (!confirm('Delete this template day?')) return
    const { error } = await (supabase.from('workout_day_templates') as any)
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) {
      alert(error.message || 'Could not delete')
      return
    }
    setDayTemplates((prev) => prev.filter((t) => t.id !== id))
    router.refresh()
  }

  const saveProgram = async (payload: {
    id?: string
    name: string
    program_json: TrainingProgramJson
  }) => {
    const row = {
      name: payload.name,
      goal: DEFAULT_TRAINING_GOAL,
      program_json: payload.program_json,
      updated_at: new Date().toISOString(),
    }
    if (payload.id) {
      const { error } = await (supabase.from('training_programs') as any)
        .update(row)
        .eq('id', payload.id)
        .eq('user_id', userId)
      if (error) throw error
      setPrograms((prev) =>
        prev.map((p) => (p.id === payload.id ? { ...p, ...row, program_json: payload.program_json } : p))
      )
    } else {
      const { data, error } = await (supabase.from('training_programs') as any)
        .insert({ ...row, user_id: userId })
        .select('*')
        .single()
      if (error) throw error
      setPrograms((prev) => [data as TrainingProgramRow, ...prev])
    }
    router.refresh()
  }

  const deleteProgram = async (id: string) => {
    if (!confirm('Delete this program?')) return
    const { error } = await (supabase.from('training_programs') as any).delete().eq('id', id).eq('user_id', userId)
    if (error) {
      alert(error.message || 'Could not delete')
      return
    }
    setPrograms((prev) => prev.filter((p) => p.id !== id))
    router.refresh()
  }

  const addWorkoutExercise = () => {
    setWorkoutExercises((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        exercise_name: '',
        sets: [createEmptySet('')],
      },
    ])
  }

  const saveWorkoutToLogs = async () => {
    const loggedAt = toLoggedAtIso(sessionDate || todayISO())
    const rows = workoutExercises.flatMap((ex) =>
      buildLiftLogRowsFromSets(userId, ex.exercise_name, ex.sets, loggedAt)
    )
    if (rows.length === 0) return
    const exerciseNames = workoutExercises.map((ex) => ex.exercise_name).filter(Boolean)
    setLoading(true)
    try {
      const { error } = await (supabase.from('lift_logs') as any).insert(rows)
      if (error) throw error
      void ensureExercisesInCatalog(supabase, userId, exerciseNames)
      setLastSummarySessionDate(sessionDate || todayISO())
      setPostSummarySets(
        rows.map((r) => ({
          exercise_name: r.exercise_name,
          weight: r.weight,
          reps: r.reps,
          rpe: r.rpe,
        }))
      )
      setQuickLogSubView('post-summary')
      setWorkoutExercises([])
      draftPersistence.clearDraft()
      router.refresh()
    } catch (err: any) {
      alert(err.message || 'Failed to save workout')
    } finally {
      setLoading(false)
    }
  }

  const openQuickSingle = (presetName?: string) => {
    const name = presetName || ''
    setSessionDate(todayISO())
    setSingleExerciseName(name)
    setSingleExerciseSets([createEmptySet(name)])
    setQuickLogSubView('quick-single')
    setPostSummarySets(null)
  }

  const saveQuickSingle = async () => {
    const name = singleExerciseName.trim()
    if (!name) return
    const loggedAt = toLoggedAtIso(sessionDate || todayISO())
    const rows = buildLiftLogRowsFromSets(userId, name, singleExerciseSets, loggedAt)
    if (rows.length === 0) return
    setLoading(true)
    try {
      const { error } = await (supabase.from('lift_logs') as any).insert(rows)
      if (error) throw error
      void ensureExercisesInCatalog(supabase, userId, [name])
      setLastSummarySessionDate(sessionDate)
      setPostSummarySets(
        rows.map((r) => ({
          exercise_name: r.exercise_name,
          weight: r.weight,
          reps: r.reps,
          rpe: r.rpe,
        }))
      )
      setQuickLogSubView('post-summary')
      setSingleExerciseName('')
      setSingleExerciseSets([createEmptySet('')])
      draftPersistence.clearDraft()
      router.refresh()
    } catch (err: any) {
      alert(err.message || 'Failed to log')
    } finally {
      setLoading(false)
    }
  }

  const backToQuickLogDefault = () => {
    setQuickLogSubView('default')
    setPostSummarySets(null)
    setActiveWorkoutSubtitle(null)
    setEditWorkoutOriginalDate(null)
    setSessionDate(todayISO())
    setLastSummarySessionDate(null)
    setWorkoutExercises([])
  }

  const openEditPastWorkout = (date: string) => {
    const logs = getLiftLogsForDate(liftLogRecords, date)
    if (logs.length === 0) {
      alert('This day has no editable log entries. Feed-only workouts cannot be edited here.')
      return
    }
    draftPersistence.clearDraft()
    setEditWorkoutOriginalDate(date)
    setSessionDate(date)
    setWorkoutExercises(liftLogsToWorkoutEntries(logs))
    setActiveWorkoutSubtitle(null)
    setPostSummarySets(null)
    setSegment('workout')
    setQuickLogSubView('edit-past-workout')
  }

  const deleteLiftLogsForDate = async (date: string) => {
    const ids = getLiftLogsForDate(liftLogRecords, date).map((l) => l.id)
    if (ids.length === 0) return
    const { error } = await (supabase.from('lift_logs') as any).delete().in('id', ids)
    if (error) throw error
  }

  const savePastWorkout = async () => {
    if (!editWorkoutOriginalDate) return
    const rows = workoutExercises.flatMap((ex) =>
      buildLiftLogRowsFromSets(userId, ex.exercise_name, ex.sets, toLoggedAtIso(sessionDate || todayISO()))
    )
    if (rows.length === 0) {
      alert('Add at least one set with weight and reps.')
      return
    }
    const exerciseNames = workoutExercises.map((ex) => ex.exercise_name).filter(Boolean)
    setLoading(true)
    try {
      await deleteLiftLogsForDate(editWorkoutOriginalDate)
      const { error } = await (supabase.from('lift_logs') as any).insert(rows)
      if (error) throw error
      void ensureExercisesInCatalog(supabase, userId, exerciseNames)
      setEditWorkoutOriginalDate(null)
      setWorkoutExercises([])
      setQuickLogSubView('default')
      router.refresh()
    } catch (err: any) {
      alert(err.message || 'Failed to save workout')
    } finally {
      setLoading(false)
    }
  }

  const deletePastWorkout = async () => {
    if (!editWorkoutOriginalDate) return
    setLoading(true)
    try {
      await deleteLiftLogsForDate(editWorkoutOriginalDate)
      setEditWorkoutOriginalDate(null)
      setWorkoutExercises([])
      setQuickLogSubView('default')
      router.refresh()
    } catch (err: any) {
      alert(err.message || 'Failed to delete workout')
    } finally {
      setLoading(false)
    }
  }

  const exerciseDetailData = selectedExerciseDetail
    ? (() => {
        const data = chartDataByExercise[selectedExerciseDetail] || []
        const lifts = allLifts.filter((l) => l.exercise_name === selectedExerciseDetail && l.weight > 0 && l.reps > 0)
        const byDate: Record<string, { weight: number; reps: number; rpe: number | null; e1RM: number }> = {}
        lifts.forEach((l) => {
          const e1RM = calculateOneRepMaxWithRPE(l.weight, l.reps, l.rpe ?? 10)
          const key = l.date
          if (!byDate[key] || e1RM > byDate[key].e1RM) {
            byDate[key] = { weight: l.weight, reps: l.reps, rpe: l.rpe, e1RM }
          }
        })
        const recentTopSets = Object.entries(byDate)
          .sort((a, b) => b[0].localeCompare(a[0]))
          .slice(0, 10)
          .map(([date, s]) => ({ date, ...s }))
        const status = getOverloadStatus(data)
        const lastTwo = data.slice(-2)
        const progressionSummary =
          data.length >= 2 && lastTwo[1].e1RM > lastTwo[0].e1RM
            ? `e1RM up from ${lastTwo[0].e1RM} to ${lastTwo[1].e1RM} lbs.`
            : data.length >= 2
              ? `Latest e1RM: ${data[data.length - 1].e1RM} lbs.`
              : ''
        return {
          chartData: data,
          recentTopSets,
          overloadStatus: status,
          progressionSummary,
        }
      })()
    : null

  const exerciseGoalForDetail = useMemo(() => {
    if (!selectedExerciseDetail || coachPlans.length === 0) return null
    const needle = selectedExerciseDetail.trim().toLowerCase()
    const plan = coachPlans.find((p) => p.exercise_name.trim().toLowerCase() === needle)
    if (!plan) return null
    const key = plan.exercise_name.trim()
    const current = exerciseBaselines[key] ?? null
    const target = Number(plan.target_weight)
    const pct =
      current != null && target > 0 ? Math.min(100, Math.round((current / target) * 100)) : null
    const raw = getCoachProgramSummary(plan.program_json)
    const recommendation = raw.length > 300 ? `${raw.slice(0, 300)}…` : raw
    const hasDate = plan.target_date != null && String(plan.target_date).trim() !== ''
    return {
      targetWeight: target,
      targetReps: Number(plan.target_reps),
      targetDateLabel: hasDate
        ? new Date(plan.target_date as string).toLocaleDateString('en-US', { dateStyle: 'medium' })
        : null,
      currentE1RM: current,
      progressPct: pct,
      recommendation,
    }
  }, [selectedExerciseDetail, coachPlans, exerciseBaselines])

  const insightStrings = useMemo(() => {
    const exerciseCount = exercises.length
    const progressing = exerciseCount
      ? Object.keys(chartDataByExercise).filter((ex) => getOverloadStatus(chartDataByExercise[ex]) === 'progressing').length
      : 0
    const progressStatus =
      exerciseCount === 0
        ? 'Log lifts to get progress and volume insights.'
        : progressing > 0
          ? `Strength trending up on ${progressing} of ${exerciseCount} tracked exercises.`
          : 'Log more sessions to see progress trends.'
    const volumeQuality =
      allLifts.length < 5
        ? 'Volume insight will appear once you have more logged sets.'
        : 'Weekly set counts look in range for most muscle groups. Add variety if you plateau.'
    const goalCount = liftGoals?.length || 0
    const goalAlignment =
      goalCount === 0
        ? 'Set lift goals in settings to see goal-aligned feedback.'
        : `Tracking ${goalCount} goal${goalCount !== 1 ? 's' : ''}. Training appears aligned with your targets.`
    const suggestedAdjustment =
      exerciseCount >= 2
        ? 'Consider adding 1–2 sets on your main compounds if recovery allows.'
        : null
    const maintainOnCutCheck =
      allLifts.length >= 10
        ? 'Strength maintained vs. last 4 weeks. Volume is adequate for maintaining on a cut.'
        : null
    return {
      progressStatus,
      volumeQuality,
      goalAlignment,
      suggestedAdjustment,
      maintainOnCutCheck,
    }
  }, [exercises.length, chartDataByExercise, allLifts.length, liftGoals?.length])

  return (
    <div className="log-screen w-full max-w-[640px] mx-auto px-4 md:px-5 pt-4 pb-5 sm:pb-6 md:py-8 min-w-0">
      <div className="text-left mb-6">
        <BrandHeading variant="page">Log</BrandHeading>
        <p className="log-screen-support mt-2 max-w-md">
          Log today&apos;s session, then use Tracking for history, programs, and templates.
        </p>
        <Link
          href="/log/goals"
          className="mt-4 btn btn-secondary gap-2 label-caps !text-white/55"
        >
          <Target className="h-4 w-4 text-white/55 shrink-0" />
          Lift goals
          <ChevronRight className="h-4 w-4 text-white/35" aria-hidden />
        </Link>
      </div>

      <LogSegmentedTabs active={segment} onChange={setSegment} />

      {segment === 'workout' && (
        <>
          {quickLogSubView === 'default' && (
            <TodaysWorkoutView
              resumeBanner={resumeBanner}
              onResumeWorkout={resumeInProgressWorkout}
              onDiscardWorkout={discardInProgressWorkout}
              onStartWorkout={(date) => startWorkout(undefined, undefined, date)}
              onQuickAddExercise={() => openQuickSingle()}
            />
          )}
          {quickLogSubView === 'edit-past-workout' && editWorkoutOriginalDate && (
            <EditPastWorkoutView
              originalDate={editWorkoutOriginalDate}
              sessionDate={sessionDate || todayISO()}
              onSessionDateChange={setSessionDate}
              exercises={workoutExercises}
              onExercisesChange={setWorkoutExercises}
              onSave={savePastWorkout}
              onCancel={backToQuickLogDefault}
              onDeleteWorkout={deletePastWorkout}
              previousBestByExercise={previousBestByExercise}
              allLifts={allLifts}
              userId={userId}
              recentExerciseNames={exercises}
              loading={loading}
            />
          )}
          {quickLogSubView === 'active-workout' && (
            <>
              <WorkoutDraftBar
                savedLabel={draftPersistence.draftSavedLabel}
                onSaveNow={draftPersistence.persistNow}
                onDiscard={discardInProgressWorkout}
              />
              <ActiveWorkoutView
              exercises={workoutExercises}
              onExercisesChange={setWorkoutExercises}
              onFinishWorkout={saveWorkoutToLogs}
              onAddExercise={addWorkoutExercise}
              previousBestByExercise={previousBestByExercise}
              workoutSubtitle={activeWorkoutSubtitle ?? undefined}
              sessionDate={sessionDate || todayISO()}
              onSessionDateChange={setSessionDate}
              allLifts={allLifts}
              userId={userId}
              recentExerciseNames={exercises}
            />
            </>
          )}
          {quickLogSubView === 'quick-single' && (
            <>
              <WorkoutDraftBar
                savedLabel={draftPersistence.draftSavedLabel}
                onSaveNow={draftPersistence.persistNow}
                onDiscard={() => {
                  if (!confirm('Discard this draft?')) return
                  draftPersistence.discardDraft()
                  setSingleExerciseName('')
                  setSingleExerciseSets([{ weight: '', reps: '', rpe: '' }])
                  setQuickLogSubView('default')
                }}
              />
            <QuickSingleExerciseView
              exerciseName={singleExerciseName}
              onExerciseNameChange={setSingleExerciseName}
              sets={singleExerciseSets}
              onSetsChange={setSingleExerciseSets}
              onLog={saveQuickSingle}
              onBack={backToQuickLogDefault}
              previousBest={singleExerciseName ? previousBestByExercise[singleExerciseName] ?? null : null}
              loading={loading}
              sessionDate={sessionDate || todayISO()}
              onSessionDateChange={setSessionDate}
              userId={userId}
              recentExerciseNames={exercises}
            />
            </>
          )}
          {quickLogSubView === 'post-summary' && postSummarySets && postSummarySets.length > 0 && (
            <PostWorkoutSummaryView
              summarySets={postSummarySets}
              loggedDateLabel={
                lastSummarySessionDate ? formatWorkoutDate(lastSummarySessionDate) : undefined
              }
              sessionDate={lastSummarySessionDate}
              onViewInsights={() => {
                setSegment('tracking')
                setQuickLogSubView('default')
                setPostSummarySets(null)
              }}
              onLogAgain={backToQuickLogDefault}
            />
          )}
        </>
      )}

      {/* Exercises segment */}
      {segment === 'exercises' && (
        <>
          {selectedExerciseDetail == null ? (
            <div className="space-y-6">
              <BodyWeightPanel
                logs={bodyWeightLogs}
                strengthSex={strengthSex}
                onLogsChange={setBodyWeightLogs}
                onSexChange={async (sex) => {
                  setStrengthSex(sex)
                  const { error } = await updateStrengthSex(supabase, userId, sex)
                  if (error) alert(error)
                }}
                onSaveWeight={async (weightLb) => upsertBodyWeightForToday(supabase, userId, weightLb)}
              />
              {strengthOverview && latestBodyweightLb != null && (
                <StrengthOverviewPanel
                  ranked={strengthOverview.ranked}
                  behind={strengthOverview.behind}
                  unmappedCount={strengthOverview.unmapped.length}
                  medianPercentile={strengthOverview.medianPercentile}
                  bodyweightLb={latestBodyweightLb}
                  onSelectExercise={setSelectedExerciseDetail}
                />
              )}
              <ExercisesGoalsPanel
                plans={coachPlans}
                exerciseBaselines={exerciseBaselines}
                onOpenExercise={(name) => setSelectedExerciseDetail(name)}
              />
              <ExercisesListView
                exercises={exercises}
                chartDataByExercise={chartDataByExercise}
                percentileByExercise={percentileByExercise}
                onSelectExercise={setSelectedExerciseDetail}
              />
            </div>
          ) : exerciseDetailData ? (
            <ExerciseDetailView
              exerciseName={selectedExerciseDetail}
              chartData={exerciseDetailData.chartData}
              recentTopSets={exerciseDetailData.recentTopSets}
              overloadStatus={exerciseDetailData.overloadStatus}
              progressionSummary={exerciseDetailData.progressionSummary}
              exerciseGoal={exerciseGoalForDetail}
              strengthAssessment={detailStrengthAssessment}
              onQuickLog={() => {
                setSegment('workout')
                setQuickLogSubView('quick-single')
                setSingleExerciseName(selectedExerciseDetail)
                setSingleExerciseSets([createEmptySet(selectedExerciseDetail)])
                setSelectedExerciseDetail(null)
              }}
              onBack={() => setSelectedExerciseDetail(null)}
            />
          ) : null}
        </>
      )}

      {/* Tracking segment */}
      {segment === 'tracking' && (
        <TrackingView
          programs={programs}
          templates={workoutTemplates}
          dayTemplates={dayTemplates}
          allLifts={allLifts}
          logPosts={logPosts}
          liftLogs={liftLogRecords}
          onEditPastWorkout={openEditPastWorkout}
          onStartProgramDay={startProgramDay}
          onStartTemplate={startFromTemplate}
          onStartDayTemplate={startDayTemplate}
          onSaveProgram={async (payload) => {
            try {
              await saveProgram(payload)
            } catch (err: unknown) {
              const msg =
                err && typeof err === 'object' && 'message' in err
                  ? String((err as { message: unknown }).message)
                  : 'Could not save program'
              alert(`${msg}\n\nRun ADD_TRAINING_PROGRAMS.sql in Supabase if needed.`)
            }
          }}
          onDeleteProgram={deleteProgram}
          onSaveDayTemplate={async (payload) => {
            try {
              await saveDayTemplate(payload)
            } catch (err: unknown) {
              const msg =
                err && typeof err === 'object' && 'message' in err
                  ? String((err as { message: unknown }).message)
                  : 'Could not save template'
              alert(`${msg}\n\nRun ADD_WORKOUT_DAY_TEMPLATES.sql in Supabase if needed.`)
            }
          }}
          onDeleteDayTemplate={deleteDayTemplate}
        />
      )}
    </div>
  )
}

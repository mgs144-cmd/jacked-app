'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { calculateOneRepMaxWithRPE } from '@/utils/oneRepMax'
import type { LogSegment, WorkoutExerciseEntry, SetEntry } from '@/components/log/types'
import { LogSegmentedTabs } from '@/components/log/LogSegmentedTabs'
import { QuickLogView } from '@/components/log/QuickLogView'
import { ActiveWorkoutView } from '@/components/log/ActiveWorkoutView'
import { QuickSingleExerciseView } from '@/components/log/QuickSingleExerciseView'
import { PostWorkoutSummaryView } from '@/components/log/PostWorkoutSummaryView'
import { ExercisesListView } from '@/components/log/ExercisesListView'
import { ExerciseDetailView } from '@/components/log/ExerciseDetailView'
import { InsightsView } from '@/components/log/InsightsView'

interface LogClientProps {
  liftLogs: any[]
  liftGoals: any[]
  logPosts: any[]
  userId: string
}

type QuickLogSubView = 'default' | 'active-workout' | 'quick-single' | 'post-summary'

function buildChartDataByExercise(allLifts: Array<{ exercise_name: string; weight: number; reps: number; rpe: number | null; date: string }>) {
  const chartDataByExercise: Record<string, { date: string; e1RM: number; weight: number; reps: number }[]> = {}
  allLifts.forEach((log) => {
    const ex = log.exercise_name
    if (!ex || log.weight <= 0 || log.reps <= 0) return
    const e1RM = calculateOneRepMaxWithRPE(log.weight, log.reps, log.rpe ?? 10)
    if (!chartDataByExercise[ex]) chartDataByExercise[ex] = []
    chartDataByExercise[ex].push({ date: log.date, e1RM, weight: log.weight, reps: log.reps })
  })
  Object.keys(chartDataByExercise).forEach((ex) => {
    const arr = chartDataByExercise[ex]
    arr.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const byDate: Record<string, typeof arr[0]> = {}
    arr.forEach((d) => {
      if (!byDate[d.date] || d.e1RM > byDate[d.date].e1RM) byDate[d.date] = d
    })
    chartDataByExercise[ex] = Object.values(byDate).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  })
  return chartDataByExercise
}

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
}: LogClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [segment, setSegment] = useState<LogSegment>('quick-log')
  const [quickLogSubView, setQuickLogSubView] = useState<QuickLogSubView>('default')
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExerciseEntry[]>([])
  const [singleExerciseName, setSingleExerciseName] = useState('')
  const [singleExerciseSets, setSingleExerciseSets] = useState<SetEntry[]>([
    { weight: '', reps: '', rpe: '' },
  ])
  const [postSummarySets, setPostSummarySets] = useState<{ exercise_name: string; weight: number; reps: number; rpe?: number | null }[] | null>(null)
  const [selectedExerciseDetail, setSelectedExerciseDetail] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const allLifts = useMemo(
    () => [
      ...liftLogs.map((l: any) => ({
        exercise_name: l.exercise_name,
        weight: Number(l.weight),
        reps: Number(l.reps),
        rpe: l.rpe ? Number(l.rpe) : null,
        date: l.logged_at?.split('T')[0] || l.logged_at,
        source: 'log' as const,
        _log: l,
      })),
      ...(logPosts || [])
        .filter((p: any) => p.is_pr_post && p.pr_exercise && p.pr_weight != null && p.pr_reps != null)
        .map((p: any) => ({
          exercise_name: p.pr_exercise,
          weight: Number(p.pr_weight || 0),
          reps: Number(p.pr_reps || 1),
          rpe: p.pr_rpe ? Number(p.pr_rpe) : null,
          date: p.created_at?.split('T')[0] || p.created_at,
          source: 'post' as const,
        })),
      ...(logPosts || []).flatMap((p: any) =>
        (p.workout_exercises || [])
          .filter((we: any) => we.exercise_name && we.weight != null && we.reps != null && we.weight > 0 && we.reps > 0)
          .map((we: any) => ({
            exercise_name: we.exercise_name,
            weight: Number(we.weight || 0),
            reps: Number(we.reps || 1),
            rpe: null,
            date: p.created_at?.split('T')[0] || p.created_at,
            source: 'post' as const,
          }))
      ),
    ],
    [liftLogs, logPosts]
  )

  const chartDataByExercise = useMemo(
    () => buildChartDataByExercise(allLifts),
    [allLifts]
  )
  const exercises = useMemo(
    () => [...new Set(allLifts.map((l) => l.exercise_name))].filter(Boolean).sort() as string[],
    [allLifts]
  )

  const recentExercises = useMemo(() => {
    const seen = new Set<string>()
    return allLifts
      .map((l) => l.exercise_name)
      .filter((name) => name && !seen.has(name) && (seen.add(name), true))
      .slice(0, 16)
  }, [allLifts])

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

  const startWorkout = () => {
    setWorkoutExercises([
      {
        id: crypto.randomUUID(),
        exercise_name: '',
        sets: [{ weight: '', reps: '', rpe: '' }],
      },
    ])
    setQuickLogSubView('active-workout')
    setPostSummarySets(null)
  }

  const addWorkoutExercise = () => {
    setWorkoutExercises((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        exercise_name: '',
        sets: [{ weight: '', reps: '', rpe: '' }],
      },
    ])
  }

  const saveWorkoutToLogs = async () => {
    const rows: { user_id: string; exercise_name: string; weight: number; reps: number; rpe: number | null; logged_at: string }[] = []
    const loggedAt = new Date().toISOString()
    workoutExercises.forEach((ex) => {
      const name = ex.exercise_name?.trim()
      if (!name) return
      ex.sets.forEach((s) => {
        const w = parseFloat(s.weight)
        const r = parseInt(s.reps, 10)
        if (Number.isFinite(w) && w > 0 && Number.isFinite(r) && r > 0) {
          rows.push({
            user_id: userId,
            exercise_name: name,
            weight: w,
            reps: r,
            rpe: s.rpe ? parseFloat(s.rpe) : null,
            logged_at: loggedAt,
          })
        }
      })
    })
    if (rows.length === 0) return
    setLoading(true)
    try {
      const { error } = await (supabase.from('lift_logs') as any).insert(rows)
      if (error) throw error
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
      router.refresh()
    } catch (err: any) {
      alert(err.message || 'Failed to save workout')
    } finally {
      setLoading(false)
    }
  }

  const openQuickSingle = (presetName?: string) => {
    setSingleExerciseName(presetName || '')
    setSingleExerciseSets([{ weight: '', reps: '', rpe: '' }])
    setQuickLogSubView('quick-single')
    setPostSummarySets(null)
  }

  const saveQuickSingle = async () => {
    const name = singleExerciseName.trim()
    const validSets = singleExerciseSets.filter((s) => s.weight && s.reps)
    if (!name || validSets.length === 0) return
    setLoading(true)
    try {
      const loggedAt = new Date().toISOString()
      const rows = validSets.map((s) => ({
        user_id: userId,
        exercise_name: name,
        weight: parseFloat(s.weight),
        reps: parseInt(s.reps, 10),
        rpe: s.rpe ? parseFloat(s.rpe) : null,
        logged_at: loggedAt,
      }))
      const { error } = await (supabase.from('lift_logs') as any).insert(rows)
      if (error) throw error
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
      setSingleExerciseSets([{ weight: '', reps: '', rpe: '' }])
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
    <div className="w-full max-w-[640px] mx-auto px-4 md:px-5 pt-4 pb-5 sm:pb-6 md:py-8 min-w-0">
      <div className="text-left mb-5">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Log</h1>
        <p className="text-white/70 text-sm mt-1">
          Log fast. See progress. Get insights.
        </p>
      </div>

      <LogSegmentedTabs active={segment} onChange={setSegment} />

      {/* Quick Log segment */}
      {segment === 'quick-log' && (
        <>
          {quickLogSubView === 'default' && (
            <QuickLogView
              onStartWorkout={startWorkout}
              onQuickAddExercise={() => openQuickSingle()}
              recentExercises={recentExercises}
              recentTemplates={recentTemplates}
              onSelectRecentExercise={(name) => openQuickSingle(name)}
              onSelectTemplate={(name) => {
                startWorkout()
              }}
            />
          )}
          {quickLogSubView === 'active-workout' && (
            <ActiveWorkoutView
              exercises={workoutExercises}
              onExercisesChange={setWorkoutExercises}
              onFinishWorkout={saveWorkoutToLogs}
              onAddExercise={addWorkoutExercise}
              previousBestByExercise={previousBestByExercise}
            />
          )}
          {quickLogSubView === 'quick-single' && (
            <QuickSingleExerciseView
              exerciseName={singleExerciseName}
              onExerciseNameChange={setSingleExerciseName}
              sets={singleExerciseSets}
              onSetsChange={setSingleExerciseSets}
              onLog={saveQuickSingle}
              onBack={backToQuickLogDefault}
              previousBest={singleExerciseName ? previousBestByExercise[singleExerciseName] ?? null : null}
              loading={loading}
            />
          )}
          {quickLogSubView === 'post-summary' && postSummarySets && postSummarySets.length > 0 && (
            <PostWorkoutSummaryView
              summarySets={postSummarySets}
              onViewInsights={() => {
                setSegment('insights')
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
            <ExercisesListView
              exercises={exercises}
              chartDataByExercise={chartDataByExercise}
              onSelectExercise={setSelectedExerciseDetail}
            />
          ) : exerciseDetailData ? (
            <ExerciseDetailView
              exerciseName={selectedExerciseDetail}
              chartData={exerciseDetailData.chartData}
              recentTopSets={exerciseDetailData.recentTopSets}
              overloadStatus={exerciseDetailData.overloadStatus}
              progressionSummary={exerciseDetailData.progressionSummary}
              onQuickLog={() => {
                setSegment('quick-log')
                setQuickLogSubView('quick-single')
                setSingleExerciseName(selectedExerciseDetail)
                setSingleExerciseSets([{ weight: '', reps: '', rpe: '' }])
                setSelectedExerciseDetail(null)
              }}
              onBack={() => setSelectedExerciseDetail(null)}
            />
          ) : null}
        </>
      )}

      {/* Insights segment */}
      {segment === 'insights' && (
        <InsightsView
          progressStatus={insightStrings.progressStatus}
          volumeQuality={insightStrings.volumeQuality}
          goalAlignment={insightStrings.goalAlignment}
          suggestedAdjustment={insightStrings.suggestedAdjustment}
          maintainOnCutCheck={insightStrings.maintainOnCutCheck}
          onAskQuestion={(q) => {
            console.log('Ask question (placeholder):', q)
          }}
        />
      )}
    </div>
  )
}

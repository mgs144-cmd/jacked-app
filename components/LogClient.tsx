'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import { format } from 'date-fns'
import {
  ClipboardList,
  Plus,
  Target,
  TrendingUp,
  Share2,
  Trash2,
} from 'lucide-react'
import { ExerciseAutocomplete } from './ExerciseAutocomplete'
import { LogPostCard } from './LogPostCard'
import { calculateOneRepMaxWithRPE } from '@/utils/oneRepMax'

interface LogClientProps {
  liftLogs: any[]
  liftGoals: any[]
  logPosts: any[]
  userId: string
}

export function LogClient({
  liftLogs,
  liftGoals,
  logPosts,
  userId,
}: LogClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<'log' | 'progress' | 'goals' | 'history'>('log')
  const [exercise, setExercise] = useState('')
  const [sets, setSets] = useState<{ weight: string; reps: string; rpe: string }[]>([
    { weight: '', reps: '', rpe: '' },
  ])
  const [loading, setLoading] = useState(false)
  const [selectedChartExercise, setSelectedChartExercise] = useState<string | null>(null)
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [goalExercise, setGoalExercise] = useState('')
  const [goalWeight, setGoalWeight] = useState('')
  const [goalReps, setGoalReps] = useState('1')

  // Get unique exercises for chart selector
  const exercises = [...new Set(liftLogs.map((l) => l.exercise_name))].filter(Boolean).sort()

  // Build chart data: e1RM over time per exercise
  const chartDataByExercise: Record<string, { date: string; e1RM: number; weight: number; reps: number }[]> = {}
  liftLogs.forEach((log) => {
    const ex = log.exercise_name
    if (!ex) return
    const e1RM = calculateOneRepMaxWithRPE(
      Number(log.weight),
      Number(log.reps),
      log.rpe ? Number(log.rpe) : 10
    )
    const date = log.logged_at?.split('T')[0] || log.logged_at
    if (!chartDataByExercise[ex]) chartDataByExercise[ex] = []
    chartDataByExercise[ex].push({
      date,
      e1RM,
      weight: Number(log.weight),
      reps: Number(log.reps),
    })
  })
  // Sort and dedupe by date (keep best e1RM per day for progress)
  Object.keys(chartDataByExercise).forEach((ex) => {
    const arr = chartDataByExercise[ex]
    arr.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const byDate: Record<string, typeof arr[0]> = {}
    arr.forEach((d) => {
      if (!byDate[d.date] || d.e1RM > byDate[d.date].e1RM) {
        byDate[d.date] = d
      }
    })
    chartDataByExercise[ex] = Object.values(byDate).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  })

  const handleLogLift = async (e: React.FormEvent) => {
    e.preventDefault()
    const validSets = sets.filter((s) => s.weight && s.reps)
    if (!exercise.trim() || validSets.length === 0) return
    setLoading(true)
    try {
      const loggedAt = new Date().toISOString()
      const rows = validSets.map((s) => ({
        user_id: userId,
        exercise_name: exercise.trim(),
        weight: parseFloat(s.weight),
        reps: parseInt(s.reps),
        rpe: s.rpe ? parseFloat(s.rpe) : null,
        logged_at: loggedAt,
      }))
      const { error } = await (supabase.from('lift_logs') as any).insert(rows)
      if (error) throw error
      setExercise('')
      setSets([{ weight: '', reps: '', rpe: '' }])
      router.refresh()
    } catch (err: any) {
      alert(err.message || 'Failed to log lift')
    } finally {
      setLoading(false)
    }
  }

  const addSet = () => setSets((prev) => [...prev, { weight: '', reps: '', rpe: '' }])
  const removeSet = (i: number) => setSets((prev) => prev.filter((_, idx) => idx !== i))
  const updateSet = (i: number, field: 'weight' | 'reps' | 'rpe', value: string) =>
    setSets((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)))

  const handleSetGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!goalExercise.trim() || !goalWeight) return
    setLoading(true)
    try {
      const { error } = await (supabase.from('lift_goals') as any).upsert(
        {
          user_id: userId,
          exercise_name: goalExercise.trim(),
          target_weight: parseFloat(goalWeight),
          target_reps: parseInt(goalReps) || 1,
        },
        { onConflict: 'user_id,exercise_name' }
      )
      if (error) throw error
      setGoalExercise('')
      setGoalWeight('')
      setGoalReps('1')
      setShowGoalForm(false)
      router.refresh()
    } catch (err: any) {
      alert(err.message || 'Failed to set goal')
    } finally {
      setLoading(false)
    }
  }

  const handleShareToFeed = async (log: any) => {
    try {
      const { data: post, error } = await (supabase.from('posts') as any)
        .insert({
          user_id: userId,
          content: null,
          is_private: false,
          is_log_only: false,
          is_pr_post: true,
          pr_exercise: log.exercise_name,
          pr_weight: parseFloat(log.weight),
          pr_reps: parseInt(log.reps),
          pr_rpe: log.rpe ? parseFloat(log.rpe) : null,
        })
        .select()
        .single()

      if (error) throw error

      // Create personal record for PR display
      try {
        await (supabase.from('personal_records') as any).insert({
          user_id: userId,
          exercise_name: log.exercise_name,
          weight: parseFloat(log.weight),
          reps: parseInt(log.reps),
          post_id: post.id,
          date: new Date().toISOString().split('T')[0],
        })
      } catch (_) {
        /* personal_records may fail if duplicate */
      }

      // Link lift_log to post
      await (supabase.from('lift_logs') as any).update({ post_id: post.id }).eq('id', log.id)

      router.push('/feed')
      router.refresh()
    } catch (err: any) {
      alert(err.message || 'Failed to share')
    }
  }

  const getGoalProgress = (exerciseName: string) => {
    const goal = liftGoals.find((g) => g.exercise_name === exerciseName)
    if (!goal) return null
    const target = calculateOneRepMaxWithRPE(
      Number(goal.target_weight),
      Number(goal.target_reps),
      10
    )
    const logs = liftLogs.filter((l) => l.exercise_name === exerciseName)
    if (logs.length === 0) return { goal, current: 0, target, percent: 0 }
    // Progress = best e1RM across all logs (not just latest)
    const bestE1RM = Math.max(
      ...logs.map((log) =>
        calculateOneRepMaxWithRPE(
          Number(log.weight),
          Number(log.reps),
          log.rpe ? Number(log.rpe) : 10
        )
      )
    )
    const percent = target > 0 ? Math.min(100, Math.round((bestE1RM / target) * 100)) : 0
    return { goal, current: bestE1RM, target, percent }
  }

  const tabs = [
    { id: 'log' as const, label: 'Log Lift', icon: Plus },
    { id: 'progress' as const, label: 'Progress', icon: TrendingUp },
    { id: 'goals' as const, label: 'Goals', icon: Target },
    { id: 'history' as const, label: 'History', icon: ClipboardList },
  ]

  return (
    <div className="w-full max-w-[640px] mx-auto px-4 md:px-5 pt-4 pb-5 sm:pb-6 md:py-8 min-w-0">
      <div className="text-left mb-5">
        <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
          <ClipboardList className="w-7 h-7 text-[#ff5555]" />
          Log
        </h1>
        <p className="text-[#a1a1a1] text-sm mt-1">
          Track lifts, view progress, set goals. Share to feed when you want.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-6 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-[#ff5555] text-white'
                  : 'text-[#a1a1a1] hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Log Lift Form */}
      {activeTab === 'log' && (
        <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Log</h2>
          <form onSubmit={handleLogLift} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#a1a1a1] mb-2">Exercise</label>
              <ExerciseAutocomplete
                value={exercise}
                onChange={setExercise}
                placeholder="e.g., Bench Press"
                className="input-field w-full"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-[#a1a1a1]">Sets</label>
                <button
                  type="button"
                  onClick={addSet}
                  className="text-sm text-[#ff5555] hover:text-[#ff4444] font-medium flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add set
                </button>
              </div>
              <div className="space-y-3">
                {sets.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/5"
                  >
                    <span className="text-[#a1a1a1] text-sm w-6">{i + 1}.</span>
                    <input
                      type="number"
                      value={s.weight}
                      onChange={(e) => updateSet(i, 'weight', e.target.value)}
                      placeholder="Weight"
                      min="0"
                      step="2.5"
                      className="input-field flex-1 min-w-0"
                    />
                    <span className="text-[#6b6b6b] text-sm">×</span>
                    <input
                      type="number"
                      value={s.reps}
                      onChange={(e) => updateSet(i, 'reps', e.target.value)}
                      placeholder="Reps"
                      min="1"
                      className="input-field w-16"
                    />
                    <select
                      value={s.rpe}
                      onChange={(e) => updateSet(i, 'rpe', e.target.value)}
                      className="input-field w-24 flex-shrink-0"
                      title="RPE"
                    >
                      <option value="">RPE</option>
                      {[10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6].map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                    {sets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSet(i)}
                        className="p-1.5 text-[#a1a1a1] hover:text-[#ff5555] hover:bg-white/5 rounded-lg transition-colors"
                        aria-label="Remove set"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#6b6b6b] mt-2">
                RPE 10 = max effort. Lower RPE adjusts e1RM estimate.
              </p>
            </div>
            <button
              type="submit"
              disabled={loading || sets.every((s) => !s.weight || !s.reps)}
              className="w-full btn-primary py-3 font-bold flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="animate-pulse">Logging...</span>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Log {sets.filter((s) => s.weight && s.reps).length || 1} set
                  {sets.filter((s) => s.weight && s.reps).length !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Progress Charts */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          {exercises.length === 0 ? (
            <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-8 text-center">
              <p className="text-[#a1a1a1]">Log some lifts to see progress charts.</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-[#a1a1a1] mb-2">Select exercise</label>
                <div className="flex flex-wrap gap-2">
                  {exercises.map((ex) => (
                    <button
                      key={ex}
                      onClick={() => setSelectedChartExercise(selectedChartExercise === ex ? null : ex)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedChartExercise === ex
                          ? 'bg-[#ff5555] text-white'
                          : 'bg-white/5 text-[#a1a1a1] hover:bg-white/10'
                      }`}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
              {selectedChartExercise && chartDataByExercise[selectedChartExercise]?.length > 0 && (
                <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-4">
                  <h3 className="text-white font-semibold mb-4">{selectedChartExercise} — e1RM over time</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartDataByExercise[selectedChartExercise]}
                        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient id="colorE1RM" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ff5555" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#ff5555" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis
                          dataKey="date"
                          stroke="#666"
                          tick={{ fill: '#a1a1a1', fontSize: 11 }}
                          tickFormatter={(v) => format(new Date(v), 'M/d')}
                        />
                        <YAxis
                          stroke="#666"
                          tick={{ fill: '#a1a1a1', fontSize: 11 }}
                          domain={['dataMin - 10', 'dataMax + 10']}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1a1a1a',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 8,
                          }}
                          labelStyle={{ color: '#fff' }}
                          formatter={(value: number | undefined) => [`${value ?? 0} lbs`, 'e1RM']}
                          labelFormatter={(label) => format(new Date(label), 'MMM d, yyyy')}
                        />
                        <Area
                          type="monotone"
                          dataKey="e1RM"
                          stroke="#ff5555"
                          strokeWidth={2}
                          fill="url(#colorE1RM)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Link
                      href="/create"
                      className="text-sm text-[#ff5555] hover:text-[#ff4444] font-medium flex items-center gap-1"
                    >
                      <Share2 className="w-4 h-4" />
                      Share to feed
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Goals */}
      {activeTab === 'goals' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Lift Goals</h2>
            <button
              onClick={() => setShowGoalForm(!showGoalForm)}
              className="text-sm text-[#ff5555] hover:text-[#ff4444] font-medium flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              {showGoalForm ? 'Cancel' : 'Add goal'}
            </button>
          </div>

          {showGoalForm && (
            <form onSubmit={handleSetGoal} className="rounded-xl border border-white/5 bg-[#1a1a1a] p-6 space-y-4">
              <ExerciseAutocomplete
                value={goalExercise}
                onChange={setGoalExercise}
                placeholder="Exercise"
                className="input-field w-full"
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#a1a1a1] mb-1">Target weight (lbs)</label>
                  <input
                    type="number"
                    value={goalWeight}
                    onChange={(e) => setGoalWeight(e.target.value)}
                    className="input-field w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#a1a1a1] mb-1">Target reps</label>
                  <input
                    type="number"
                    value={goalReps}
                    onChange={(e) => setGoalReps(e.target.value)}
                    className="input-field w-full"
                    min="1"
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary py-2 px-4 font-semibold">
                Set goal
              </button>
            </form>
          )}

          <div className="space-y-3">
            {liftGoals.length === 0 && !showGoalForm ? (
              <p className="text-[#a1a1a1] text-sm">No goals set. Add one above.</p>
            ) : (
              liftGoals.map((goal) => {
                const progress = getGoalProgress(goal.exercise_name)
                if (!progress) return null
                const { goal: g, current, target, percent } = progress as {
                  goal: any
                  current: number
                  target: number
                  percent: number
                }
                return (
                  <div
                    key={goal.id}
                    className="rounded-xl border border-white/5 bg-[#1a1a1a] p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-white">{g.exercise_name}</span>
                      <span className="text-[#ff5555] font-bold">{percent}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-[#ff5555] rounded-full transition-all"
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>
                    <p className="text-xs text-[#a1a1a1]">
                      {current} / {target} lbs e1RM
                    </p>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* History: recent logs + log posts */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {liftLogs.length > 0 && (
            <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-4">
              <h3 className="text-white font-semibold mb-3">Recent lifts</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {(() => {
                  const grouped = liftLogs.slice(0, 60).reduce(
                    (acc: { key: string; logs: any[] }[], log) => {
                      const date = log.logged_at?.split('T')[0] || ''
                      const key = `${log.exercise_name}|${date}`
                      const existing = acc.find((g) => g.key === key)
                      if (existing) existing.logs.push(log)
                      else acc.push({ key, logs: [log] })
                      return acc
                    },
                    [] as { key: string; logs: any[] }[]
                  )
                  return grouped.slice(0, 20).map(({ key, logs }) => {
                    const log = logs[0]
                    const bestLog = logs.reduce((best, l) => {
                      const e = calculateOneRepMaxWithRPE(
                        Number(l.weight),
                        Number(l.reps),
                        l.rpe ? Number(l.rpe) : 10
                      )
                      const bestE = calculateOneRepMaxWithRPE(
                        Number(best.weight),
                        Number(best.reps),
                        best.rpe ? Number(best.rpe) : 10
                      )
                      return e > bestE ? l : best
                    })
                    const setsDisplay = logs
                      .map((l) => `${l.weight}×${l.reps}${l.rpe ? `@${l.rpe}` : ''}`)
                      .join(' · ')
                    return (
                      <div
                        key={key}
                        className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 group"
                      >
                        <div>
                          <span className="text-white font-medium">{log.exercise_name}</span>
                          <span className="text-[#a1a1a1] text-sm ml-2">{setsDisplay}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#ff5555] font-semibold tabular-nums">
                            {calculateOneRepMaxWithRPE(
                              Number(bestLog.weight),
                              Number(bestLog.reps),
                              bestLog.rpe ? Number(bestLog.rpe) : 10
                            )}{' '}
                            lbs
                          </span>
                          <button
                            onClick={() => handleShareToFeed(bestLog)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white/10 text-[#a1a1a1] hover:text-white transition-all"
                            title="Share to feed"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
          )}

          {logPosts.length > 0 && (
            <div>
              <h3 className="text-white font-semibold mb-3">Log-only posts</h3>
              <div className="flex flex-col gap-3">
                {logPosts.map((post) => (
                  <LogPostCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          )}

          {liftLogs.length === 0 && logPosts.length === 0 && (
            <div className="rounded-xl border border-white/5 bg-[#1a1a1a] p-8 text-center">
              <p className="text-[#a1a1a1]">No history yet. Log a lift above.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

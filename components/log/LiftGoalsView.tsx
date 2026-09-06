'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Bot,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import { buildCoachProgram, type CoachProgramJson } from '@/lib/coachProgram'

export type CoachPlanRow = {
  id: string
  user_id: string
  exercise_name: string
  target_weight: number
  target_reps: number
  /** ISO date or null if not set — Coach can help pick one */
  target_date: string | null
  program_json: CoachProgramJson | Record<string, unknown>
  created_at?: string
}

export type CoachChatRow = {
  id: string
  plan_id: string
  user_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

function parseProgram(json: CoachProgramJson | Record<string, unknown>): CoachProgramJson {
  const w = json && typeof json === 'object' && 'weeks' in json && Array.isArray((json as CoachProgramJson).weeks)
  if (w) return json as CoachProgramJson
  return { weeks: [], summary: 'No program yet — add a goal below.' }
}

interface LiftGoalsViewProps {
  userId: string
  initialPlans: CoachPlanRow[]
  exerciseBaselines: Record<string, number>
}

export function LiftGoalsView({ userId, initialPlans, exerciseBaselines }: LiftGoalsViewProps) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [plans, setPlans] = useState<CoachPlanRow[]>(initialPlans)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(initialPlans[0]?.id ?? null)
  const [weekScroll, setWeekScroll] = useState(0)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [formEx, setFormEx] = useState('Bench press')
  const [formWeight, setFormWeight] = useState('245')
  const [formReps, setFormReps] = useState('1')
  const [formDate, setFormDate] = useState('')

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? null
  const program = useMemo(() => (selectedPlan ? parseProgram(selectedPlan.program_json) : null), [selectedPlan])

  const progressCards = useMemo(() => {
    return plans.map((p) => {
      const key = p.exercise_name.trim()
      const current = exerciseBaselines[key] ?? null
      const target = Number(p.target_weight)
      const pct = current != null && target > 0 ? Math.min(100, Math.round((current / target) * 100)) : null
      const gap =
        current != null && target > 0 ? Math.max(0, Math.round(target - current)) : null
      const hasTargetDate = p.target_date != null && String(p.target_date).trim() !== ''
      const targetDate = hasTargetDate ? new Date(p.target_date as string) : null
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const daysLeft =
        targetDate != null && !Number.isNaN(targetDate.getTime())
          ? Math.ceil((targetDate.getTime() - today.getTime()) / 86400000)
          : null
      return {
        plan: p,
        current,
        target,
        pct,
        gap,
        daysLeft,
      }
    })
  }, [plans, exerciseBaselines])

  const createGoal = async () => {
    const tw = parseFloat(formWeight)
    const tr = parseInt(formReps, 10)
    const name = formEx.trim()
    if (!name || !Number.isFinite(tw) || tw <= 0 || !Number.isFinite(tr) || tr <= 0) return

    const dateTrim = formDate.trim()
    const prog = buildCoachProgram({
      exerciseName: name,
      targetWeight: tw,
      targetReps: tr,
      targetDateISO: dateTrim || null,
      currentEstimateLbs: exerciseBaselines[name] ?? null,
    })

    setCreating(true)
    try {
      const row = {
        user_id: userId,
        exercise_name: name,
        target_weight: tw,
        target_reps: tr,
        target_date: dateTrim || null,
        program_json: prog as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      }
      const { data, error } = await (supabase as any).from('coach_plans').insert(row).select('*').single()
      if (error) throw error
      const inserted = data as CoachPlanRow
      setPlans((prev) => [inserted, ...prev])
      setSelectedPlanId(inserted.id)
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('jacked:coach-refresh'))
      router.refresh()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not save goal.'
      alert(
        msg.includes('coach_plans') || msg.includes('relation')
          ? 'Run ADD_COACH_COMMUNITY.sql in Supabase to enable lift goals.'
          : msg
      )
    } finally {
      setCreating(false)
    }
  }

  const deleteGoal = async (planId: string) => {
    if (
      !confirm(
        'Delete this lift goal? The program timeline and Coach chat history for this goal will be removed.'
      )
    ) {
      return
    }
    setDeletingId(planId)
    try {
      const { error } = await (supabase as any)
        .from('coach_plans')
        .delete()
        .eq('id', planId)
        .eq('user_id', userId)
      if (error) throw error
      const nextPlans = plans.filter((p) => p.id !== planId)
      setPlans(nextPlans)
      if (selectedPlanId === planId) {
        setSelectedPlanId(nextPlans[0]?.id ?? null)
        setWeekScroll(0)
      }
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('jacked:coach-refresh'))
      router.refresh()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Could not delete goal.')
    } finally {
      setDeletingId(null)
    }
  }

  const regenerateProgram = async () => {
    if (!selectedPlan) return
    const prog = buildCoachProgram({
      exerciseName: selectedPlan.exercise_name,
      targetWeight: Number(selectedPlan.target_weight),
      targetReps: Number(selectedPlan.target_reps),
      targetDateISO: selectedPlan.target_date?.trim() || null,
      currentEstimateLbs: exerciseBaselines[selectedPlan.exercise_name.trim()] ?? null,
    })

    try {
      const { error } = await (supabase as any)
        .from('coach_plans')
        .update({ program_json: prog as unknown as Record<string, unknown>, updated_at: new Date().toISOString() })
        .eq('id', selectedPlan.id)
      if (error) throw error
      setPlans((prev) =>
        prev.map((p) => (p.id === selectedPlan.id ? { ...p, program_json: prog as CoachProgramJson } : p))
      )
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('jacked:coach-refresh'))
      router.refresh()
    } catch {
      alert('Could not regenerate program.')
    }
  }

  const visibleWeekStart = Math.max(0, Math.min(weekScroll, Math.max(0, (program?.weeks?.length ?? 1) - 1)))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0">
            <Target className="w-6 h-6 text-white/70" />
          </div>
          <div>
            <h2 className="ui-section-title">Lift goals</h2>
            <p className="text-white/60 text-sm mt-1 leading-relaxed">
              Set a target like <span className="text-white/90">245 lb × 1 rep</span>. Target date is optional — leave it
              blank and ask the Coach chat to suggest a realistic meet or max-out week.
            </p>
            <p className="text-xs text-white/45 mt-2 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-white/40" />
              Open the <strong className="font-medium text-white/70">Coach</strong> button (bottom-right) to chat anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Big progress cards */}
      {progressCards.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white/50 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Active goals
          </h3>
          <div className="grid gap-3">
            {progressCards.map(({ plan, current, target, pct, gap, daysLeft }) => {
              const isSelected = plan.id === selectedPlanId
              const isDeleting = deletingId === plan.id
              return (
                <div
                  key={plan.id}
                  className={`flex gap-1 rounded-2xl border transition-all sm:gap-2 ${
                    isSelected
                      ? 'border-white/20 bg-white/[0.06]'
                      : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlanId(plan.id)
                      setWeekScroll(0)
                    }}
                    className="min-w-0 flex-1 text-left p-4 sm:p-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <p className="ui-heading text-lg sm:text-xl text-white">{plan.exercise_name}</p>
                        <p className="text-white/55 text-sm mt-1">
                          Target{' '}
                          <span className="text-white font-medium">
                            {target} lb × {plan.target_reps}
                          </span>
                          {plan.target_date != null && String(plan.target_date).trim() !== '' ? (
                            <>
                              {' '}
                              · by{' '}
                              {new Date(plan.target_date as string).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </>
                          ) : (
                            <span className="text-white/40"> · no target date yet</span>
                          )}
                        </p>
                      </div>
                      <div className="sm:text-right shrink-0">
                        {current != null ? (
                          <>
                            <p className="ui-meta">Current est. strength</p>
                            <p className="ui-stat-value tabular-nums">{Math.round(current)} lb</p>
                            <p className="text-xs text-white/40 mt-0.5">e1RM from your log</p>
                          </>
                        ) : (
                          <p className="text-sm text-white/45">Log this lift to see progress</p>
                        )}
                      </div>
                    </div>
                    {pct != null && (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-white/45 mb-1.5">
                          <span>Progress to target</span>
                          <span className="tabular-nums">
                            {pct}%
                            {gap != null && gap > 0 && <span className="text-white/35"> · {gap} lb to go</span>}
                          </span>
                        </div>
                        <div className="h-2.5 rounded-full bg-black/60 overflow-hidden border border-white/10">
                          <div
                            className="h-full rounded-full bg-white/85 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <p className="text-[11px] text-white/35 mt-3">
                      {daysLeft != null
                        ? daysLeft >= 0
                          ? `${daysLeft} days until target date`
                          : 'Target date passed — adjust or celebrate'
                        : 'No target date — ask Coach for a good week to peak or test'}
                    </p>
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => void deleteGoal(plan.id)}
                    className="shrink-0 self-stretch px-3 text-white/35 hover:bg-red-500/15 hover:text-red-300 disabled:opacity-40 sm:self-start sm:rounded-tr-2xl sm:rounded-br-2xl sm:px-3.5 sm:py-4"
                    aria-label={`Delete goal: ${plan.exercise_name}`}
                  >
                    {isDeleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* New goal — always visible */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 text-white font-medium">
          <Plus className="w-5 h-5 text-white/50" />
          Add a lift goal
        </div>
        <p className="text-xs text-white/45 -mt-2">
          Example: Bench press · 245 lb · 1 rep — add a date if you have one, or skip it and plan with Coach.
        </p>
        <input
          className="input-field w-full text-sm"
          value={formEx}
          onChange={(e) => setFormEx(e.target.value)}
          placeholder="Exercise (e.g. Bench press)"
        />
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] text-white/40 block mb-1">Target weight (lb)</label>
            <input
              type="number"
              className="input-field w-full text-sm font-medium"
              value={formWeight}
              onChange={(e) => setFormWeight(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[11px] text-white/40 block mb-1">Reps</label>
            <input
              type="number"
              min={1}
              className="input-field w-full text-sm"
              value={formReps}
              onChange={(e) => setFormReps(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[11px] text-white/40 block mb-1">Target date (optional)</label>
            <input
              type="date"
              className="input-field w-full text-sm"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
            />
          </div>
        </div>
        <button
          type="button"
          disabled={creating}
          onClick={createGoal}
          className="btn btn-primary btn-block gap-2 disabled:opacity-60"
        >
          {creating ? 'Saving…' : 'Save goal & build program'}
        </button>
      </div>

      {plans.length > 0 && selectedPlan && program && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-white/50" />
                Program & timeline
              </h3>
              <p className="text-xs text-white/60 mt-2 max-w-xl">{program.summary}</p>
            </div>
            <button
              type="button"
              onClick={regenerateProgram}
              className="text-xs px-3 py-2 rounded-lg border border-white/15 text-white/70 hover:bg-white/5"
            >
              Regenerate scaffold
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {plans.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedPlanId(p.id)
                  setWeekScroll(0)
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  p.id === selectedPlanId
                    ? 'border-white/25 bg-white/[0.08] text-white'
                    : 'border-white/10 text-white/60 hover:border-white/20'
                }`}
              >
                {p.exercise_name}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-white/50">Weeks</span>
            <div className="flex gap-1">
              <button
                type="button"
                className="p-1 rounded-lg border border-white/10 text-white/50 hover:text-white"
                disabled={weekScroll <= 0}
                onClick={() => setWeekScroll((w) => Math.max(0, w - 1))}
                aria-label="Previous week"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-1 rounded-lg border border-white/10 text-white/50 hover:text-white"
                disabled={!program.weeks || weekScroll >= program.weeks.length - 1}
                onClick={() => setWeekScroll((w) => Math.min(program.weeks.length - 1, w + 1))}
                aria-label="Next week"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {program.weeks.map((wk, idx) => (
              <button
                key={wk.weekIndex}
                type="button"
                onClick={() => setWeekScroll(idx)}
                className={`shrink-0 w-[104px] sm:w-[120px] rounded-xl border px-3 py-2 text-left transition-colors ${
                  idx === visibleWeekStart
                    ? 'border-white/25 bg-white/[0.06]'
                    : 'border-white/10 bg-black/40'
                }`}
              >
                <div className="text-[10px] text-white/40 uppercase tracking-wide">Week {wk.weekIndex}</div>
                <div className="text-xs text-white/85 font-medium mt-1 line-clamp-2">{wk.theme}</div>
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-white/08 bg-black/50 p-4">
            {program.weeks[visibleWeekStart] ? (
              <div className="space-y-2">
                <div className="text-sm text-white font-medium">
                  Week {program.weeks[visibleWeekStart].weekIndex}: {program.weeks[visibleWeekStart].theme}
                </div>
                <ul className="space-y-2">
                  {program.weeks[visibleWeekStart].sessions.map((s) => (
                    <li key={s.label} className="text-sm text-white/70">
                      <span className="text-white/90">{s.label}</span> — {s.detail}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-white/50">No week data.</p>
            )}
          </div>

          <p className="text-xs text-white/40 mt-4 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Questions? Tap the <span className="text-white/75">Coach</span> button (bottom-right) to chat.
          </p>
        </div>
      )}
    </div>
  )
}


'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Bot,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react'
import { buildCoachProgram, type CoachProgramJson } from '@/lib/coachProgram'

export type CoachPlanRow = {
  id: string
  user_id: string
  exercise_name: string
  target_weight: number
  target_reps: number
  target_date: string
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

  const [formEx, setFormEx] = useState('Bench press')
  const [formWeight, setFormWeight] = useState('245')
  const [formReps, setFormReps] = useState('1')
  const [formDate, setFormDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 3)
    return d.toISOString().slice(0, 10)
  })

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
      const targetDate = new Date(p.target_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const daysLeft = Math.ceil((targetDate.getTime() - today.getTime()) / 86400000)
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
    if (!name || !Number.isFinite(tw) || tw <= 0 || !Number.isFinite(tr) || tr <= 0 || !formDate) return

    const prog = buildCoachProgram({
      exerciseName: name,
      targetWeight: tw,
      targetReps: tr,
      targetDateISO: formDate,
      currentEstimateLbs: exerciseBaselines[name] ?? null,
    })

    setCreating(true)
    try {
      const row = {
        user_id: userId,
        exercise_name: name,
        target_weight: tw,
        target_reps: tr,
        target_date: formDate,
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

  const regenerateProgram = async () => {
    if (!selectedPlan) return
    const prog = buildCoachProgram({
      exerciseName: selectedPlan.exercise_name,
      targetWeight: Number(selectedPlan.target_weight),
      targetReps: Number(selectedPlan.target_reps),
      targetDateISO: selectedPlan.target_date,
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
      <div className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 to-black p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center shrink-0">
            <Target className="w-6 h-6 text-violet-200" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Lift goals</h2>
            <p className="text-white/60 text-sm mt-1 leading-relaxed">
              Set a target like <span className="text-white/90">245 lb × 1 rep</span> with a target date. We show
              progress from your logs, a week-by-week scaffold, and the AI coach in the corner for questions.
            </p>
            <p className="text-xs text-violet-300/90 mt-2 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5" />
              Open the <strong className="font-medium">Coach</strong> button (bottom-right) to chat anytime.
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
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => {
                    setSelectedPlanId(plan.id)
                    setWeekScroll(0)
                  }}
                  className={`w-full text-left rounded-2xl border p-4 sm:p-5 transition-all ${
                    isSelected
                      ? 'border-amber-400/40 bg-amber-500/[0.08] ring-1 ring-amber-400/20'
                      : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <p className="text-xl sm:text-2xl font-semibold text-white tracking-tight">{plan.exercise_name}</p>
                      <p className="text-white/55 text-sm mt-1">
                        Target{' '}
                        <span className="text-amber-200 font-medium">
                          {target} lb × {plan.target_reps}
                        </span>{' '}
                        · by{' '}
                        {new Date(plan.target_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="sm:text-right shrink-0">
                      {current != null ? (
                        <>
                          <p className="text-sm text-white/45">Current est. strength</p>
                          <p className="text-2xl font-semibold text-white tabular-nums">{Math.round(current)} lb</p>
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
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-amber-400 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <p className="text-[11px] text-white/35 mt-3">
                    {daysLeft >= 0 ? `${daysLeft} days until target date` : 'Target date passed — adjust or celebrate'}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* New goal — always visible */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 text-white font-medium">
          <Plus className="w-5 h-5 text-emerald-400" />
          Add a lift goal
        </div>
        <p className="text-xs text-white/45 -mt-2">Example: Bench press · 245 lb · 1 rep · pick your meet or test day.</p>
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
            <label className="text-[11px] text-white/40 block mb-1">Target date</label>
            <input type="date" className="input-field w-full text-sm" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
          </div>
        </div>
        <button
          type="button"
          disabled={creating}
          onClick={createGoal}
          className="w-full py-3 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 disabled:opacity-60 flex items-center justify-center gap-2"
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
              <p className="text-xs text-emerald-300/90 mt-2 max-w-xl">{program.summary}</p>
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
                    ? 'border-violet-400/60 bg-violet-500/15 text-white'
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
                    ? 'border-violet-400/50 bg-violet-500/10'
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
            Questions? Tap the <span className="text-violet-300/90">Coach</span> button (bottom-right) to chat.
          </p>
        </div>
      )}
    </div>
  )
}


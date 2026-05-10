'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Bot, ChevronUp, Minus, Send, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'
import type { CoachChatRow, CoachPlanRow } from '@/components/log/LiftGoalsView'
import type { CoachProgramJson } from '@/lib/coachProgram'

type DockMode = 'fab' | 'sheet' | 'collapsed'

function parseProgram(json: CoachProgramJson | Record<string, unknown>): CoachProgramJson {
  const w = json && typeof json === 'object' && 'weeks' in json && Array.isArray((json as CoachProgramJson).weeks)
  if (w) return json as CoachProgramJson
  return { weeks: [], summary: '' }
}

export function CoachChatDock() {
  const { user, loading } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  const [mode, setMode] = useState<DockMode>('fab')

  const [plans, setPlans] = useState<CoachPlanRow[]>([])
  const [messages, setMessages] = useState<CoachChatRow[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [bootLoading, setBootLoading] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)

  const loadCoachData = useCallback(async () => {
    if (!user) return
    setBootLoading(true)
    try {
      const { data: planRows } = await (supabase as any)
        .from('coach_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      const list = (planRows || []) as CoachPlanRow[]
      setPlans(list)

      const ids = list.map((p) => p.id)
      if (ids.length) {
        const { data: msgs } = await (supabase as any)
          .from('coach_chat_messages')
          .select('*')
          .in('plan_id', ids)
          .order('created_at', { ascending: true })
          .limit(400)
        setMessages((msgs || []) as CoachChatRow[])
      } else {
        setMessages([])
      }

      setSelectedPlanId((prev) => {
        if (prev && list.some((p) => p.id === prev)) return prev
        return list[0]?.id ?? null
      })
    } catch {
      setPlans([])
      setMessages([])
    } finally {
      setBootLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    if (!loading && user) void loadCoachData()
  }, [loading, user, loadCoachData])

  useEffect(() => {
    const onRefresh = () => void loadCoachData()
    window.addEventListener('jacked:coach-refresh', onRefresh)
    return () => window.removeEventListener('jacked:coach-refresh', onRefresh)
  }, [loadCoachData])

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? null
  const program = useMemo(
    () => (selectedPlan ? parseProgram(selectedPlan.program_json) : null),
    [selectedPlan]
  )

  const chatForPlan = useMemo(
    () =>
      messages
        .filter((m) => m.plan_id === selectedPlanId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [messages, selectedPlanId]
  )

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatForPlan.length, mode])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || !selectedPlanId || !selectedPlan || sending) return
    setInput('')
    setSending(true)

    try {
      const { data: storedUser, error: insertErr } = await (supabase as any)
        .from('coach_chat_messages')
        .insert({
          plan_id: selectedPlanId,
          user_id: user!.id,
          role: 'user',
          content: text,
        })
        .select('*')
        .single()

      if (insertErr || !storedUser) throw insertErr ?? new Error('Insert failed')

      const um = storedUser as CoachChatRow
      const thread = [...messages.filter((m) => m.plan_id === selectedPlanId), um].sort((a, b) =>
        a.created_at.localeCompare(b.created_at)
      )
      const historyPayload = thread.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }))

      const res = await fetch('/api/coach-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyPayload.slice(-16),
          planContext: {
            exercise_name: selectedPlan.exercise_name,
            target_weight: Number(selectedPlan.target_weight),
            target_reps: Number(selectedPlan.target_reps),
            target_date: selectedPlan.target_date,
            summary: typeof program?.summary === 'string' ? program.summary : '',
            week_count: program?.weeks?.length ?? 0,
          },
        }),
      })
      const data = await res.json()
      const reply = typeof data.reply === 'string' ? data.reply : 'Got it — stay consistent this week.'

      const { data: assistantRow, error: asstErr } = await (supabase as any)
        .from('coach_chat_messages')
        .insert({
          plan_id: selectedPlanId,
          user_id: user!.id,
          role: 'assistant',
          content: reply,
        })
        .select('*')
        .single()

      if (asstErr || !assistantRow) throw asstErr ?? new Error('Assistant insert failed')

      setMessages((prev) =>
        [...prev, um, assistantRow as CoachChatRow].sort((a, b) => a.created_at.localeCompare(b.created_at))
      )
    } catch {
      alert('Message failed — try again or check Supabase coach tables.')
    } finally {
      setSending(false)
    }
  }

  if (!user || loading) return null

  const openSheet = () => setMode('sheet')
  const minimize = () => setMode('collapsed')
  const closeToFab = () => setMode('fab')

  return (
    <div className="fixed z-[100] pointer-events-none right-0 bottom-0 left-0 flex justify-end items-end p-3 md:p-4 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
      {/* FAB */}
      {mode === 'fab' && (
        <button
          type="button"
          onClick={openSheet}
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-700 text-white shadow-[0_8px_32px_rgba(99,102,241,0.45)] ring-2 ring-white/15 transition-transform hover:scale-105 active:scale-95"
          aria-label="Open AI coach"
        >
          <Bot className="h-7 w-7" strokeWidth={1.75} />
        </button>
      )}

      {/* Collapsed bar */}
      {mode === 'collapsed' && (
        <div className="pointer-events-auto flex w-full max-w-md items-center gap-2 rounded-2xl border border-white/12 bg-[#0c1222]/95 px-3 py-2.5 shadow-2xl backdrop-blur-xl">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/25">
            <Bot className="h-5 w-5 text-violet-200" />
          </div>
          <span className="flex-1 truncate text-sm font-medium text-white/85">JACKED Coach</span>
          <button
            type="button"
            onClick={openSheet}
            className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Expand coach"
          >
            <ChevronUp className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={closeToFab}
            className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Close coach"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Expanded sheet */}
      {mode === 'sheet' && (
        <div
          className="pointer-events-auto flex h-[min(72vh,560px)] w-[min(100vw-1.5rem,400px)] flex-col overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-b from-[#111827] via-[#0a0f1a] to-black shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
          role="dialog"
          aria-label="AI Coach chat"
        >
          <header className="flex shrink-0 items-center gap-2 border-b border-white/10 px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
              <Bot className="h-5 w-5 text-violet-200" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">Coach</p>
              {plans.length > 0 ? (
                <select
                  value={selectedPlanId ?? ''}
                  onChange={(e) => setSelectedPlanId(e.target.value || null)}
                  className="mt-0.5 max-w-full truncate rounded-lg border border-white/10 bg-black/40 py-1 pl-2 pr-6 text-[11px] text-white/70"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.exercise_name} → {Number(p.target_weight)}×{p.target_reps}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-[11px] text-amber-200/80">No goal yet</p>
              )}
            </div>
            <button
              type="button"
              onClick={minimize}
              className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white"
              aria-label="Minimize"
            >
              <Minus className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={closeToFab}
              className="rounded-lg p-2 text-white/50 hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            {bootLoading && <p className="text-center text-xs text-white/40">Loading…</p>}
            {!bootLoading && plans.length === 0 && (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
                <p className="text-sm text-white/70">
                  Add a lift goal (weight × reps + date) to unlock coaching tied to your plan.
                </p>
                <Link
                  href="/log/goals"
                  className="mt-3 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
                >
                  Open lift goals
                </Link>
              </div>
            )}
            {!bootLoading && plans.length > 0 && chatForPlan.length === 0 && (
              <p className="text-center text-xs text-white/45">
                Ask about volume, deloads, peaking, or how this week should feel.
              </p>
            )}
            <div className="space-y-3">
              {chatForPlan.map((m) => (
                <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role !== 'user' && (
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/30 ring-1 ring-violet-400/25">
                      <Bot className="h-4 w-4 text-violet-100" />
                    </div>
                  )}
                  <div
                    className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-white text-black'
                        : 'border border-white/10 bg-white/[0.06] text-white/90'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <div ref={chatEndRef} />
          </div>

          <footer className="shrink-0 border-t border-white/10 p-2">
            <div className="flex gap-2">
              <input
                className="input-field min-h-[44px] flex-1 text-sm"
                placeholder={plans.length ? 'Message coach…' : 'Add a goal first'}
                value={input}
                disabled={!plans.length || sending}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={sending || !input.trim() || !plans.length}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-violet-500 text-white disabled:opacity-40"
                aria-label="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <Link href="/log/goals" className="mt-2 block text-center text-[11px] text-white/35 hover:text-white/55">
              Manage lift goals
            </Link>
          </footer>
        </div>
      )}
    </div>
  )
}

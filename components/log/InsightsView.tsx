'use client'

import { useEffect, useRef, useState } from 'react'
import {
  TrendingUp,
  Target,
  BarChart3,
  Lightbulb,
  Scale,
  MessageCircle,
  Send,
  Bot,
  Loader2,
} from 'lucide-react'

export type InsightsChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface InsightCardProps {
  title: string
  icon: typeof TrendingUp
  children: React.ReactNode
  status?: 'positive' | 'neutral' | 'attention' | 'muted'
}

function InsightCard({ title, icon: Icon, children, status = 'neutral' }: InsightCardProps) {
  const statusBg =
    status === 'attention'
      ? 'border-white/15 bg-white/[0.05]'
      : status === 'muted'
        ? 'border-white/08 bg-white/[0.02]'
        : status === 'positive'
          ? 'border-white/12 bg-white/[0.04]'
          : 'border-white/10 bg-white/[0.02]'
  return (
    <div className={`rounded-2xl border p-4 ${statusBg}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-white/50" />
        <p className="log-screen-eyebrow">{title}</p>
      </div>
      <div className="log-screen-support text-sm text-white/55">{children}</div>
    </div>
  )
}

export interface InsightsContextPayload {
  progressStatus: string
  volumeQuality: string
  goalAlignment: string
  suggestedAdjustment: string | null
  maintainOnCutCheck: string | null
}

interface InsightsViewProps {
  progressStatus: string
  volumeQuality: string
  goalAlignment: string
  suggestedAdjustment: string | null
  maintainOnCutCheck: string | null
  initialInsightsMessages?: InsightsChatMessage[]
  insightsContext: InsightsContextPayload
}

export function InsightsView({
  progressStatus,
  volumeQuality,
  goalAlignment,
  suggestedAdjustment,
  maintainOnCutCheck,
  initialInsightsMessages = [],
  insightsContext,
}: InsightsViewProps) {
  const [messages, setMessages] = useState<InsightsChatMessage[]>(initialInsightsMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages(initialInsightsMessages)
  }, [initialInsightsMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, sending])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setError(null)
    setSending(true)

    try {
      const res = await fetch('/api/coach-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'insights',
          message: text,
          insightsContext,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Request failed')
      }

      const reply = typeof data.reply === 'string' ? data.reply : 'No reply.'
      setMessages((prev) => [
        ...prev,
        { id: `u-${Date.now()}`, role: 'user', content: text },
        { id: `a-${Date.now()}`, role: 'assistant', content: reply },
      ])
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : 'Could not reach coach. Run ADD_COACH_INSIGHTS_MEMORY.sql if tables are missing.'
      setError(msg)
      setInput(text)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <InsightCard title="Progress status" icon={TrendingUp} status="positive">
        {progressStatus}
      </InsightCard>

      <InsightCard title="Volume quality" icon={BarChart3}>
        {volumeQuality}
      </InsightCard>

      <InsightCard title="Goal alignment" icon={Target}>
        {goalAlignment}
      </InsightCard>

      {suggestedAdjustment && (
        <InsightCard title="Suggested next adjustment" icon={Lightbulb} status="attention">
          {suggestedAdjustment}
        </InsightCard>
      )}

      {maintainOnCutCheck && (
        <InsightCard title="Maintain-on-cut check" icon={Scale}>
          {maintainOnCutCheck}
        </InsightCard>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden flex flex-col max-h-[min(420px,55vh)]">
        <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2 shrink-0">
          <MessageCircle className="w-4 h-4 text-white/40" />
          <span className="label-caps text-white/50">Coach chat</span>
          <span className="ui-body text-[10px] text-white/35 ml-auto">Remembers what you share</span>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-[160px]">
          {messages.length === 0 && !sending && (
            <p className="log-screen-support text-xs text-center py-6 px-2">
              Ask anything — programming, recovery, or tell the coach about your schedule and preferences. Replies are
              saved and used in future chats (floating coach + here).
            </p>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 border border-white/10">
                  <Bot className="h-4 w-4 text-white/70" />
                </div>
              )}
              <div
                className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-white text-black'
                    : 'border border-white/10 bg-white/[0.06] text-white/90'
                }`}
              >
                <span className="whitespace-pre-wrap">{m.content}</span>
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex gap-2 justify-start items-center text-white/45 text-xs py-1">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              Thinking…
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && <p className="px-3 text-xs text-red-400/90 border-t border-white/5 pt-2">{error}</p>}

        <div className="p-2 border-t border-white/5 flex gap-2 shrink-0">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Message coach…"
            disabled={sending}
            className="input-field flex-1 text-sm py-2 min-h-[44px]"
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            className="shrink-0 min-h-[44px] min-w-[44px] rounded-xl bg-white text-black flex items-center justify-center disabled:opacity-40"
            aria-label="Send"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}

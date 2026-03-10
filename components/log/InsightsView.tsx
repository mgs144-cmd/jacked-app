'use client'

import { useState } from 'react'
import {
  TrendingUp,
  Target,
  BarChart3,
  Lightbulb,
  Scale,
  MessageCircle,
  Send,
} from 'lucide-react'

interface InsightCardProps {
  title: string
  icon: typeof TrendingUp
  children: React.ReactNode
  status?: 'positive' | 'neutral' | 'attention' | 'muted'
}

function InsightCard({ title, icon: Icon, children, status = 'neutral' }: InsightCardProps) {
  const statusBg =
    status === 'positive'
      ? 'border-emerald-500/20 bg-emerald-500/5'
      : status === 'attention'
        ? 'border-amber-500/20 bg-amber-500/5'
        : status === 'muted'
          ? 'border-white/5 bg-white/[0.02]'
          : 'border-white/10 bg-white/[0.02]'
  return (
    <div className={`rounded-2xl border p-4 ${statusBg}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-white/50" />
        <h3 className="text-sm font-medium text-white/80">{title}</h3>
      </div>
      <div className="text-sm text-white/70 leading-relaxed">{children}</div>
    </div>
  )
}

interface InsightsViewProps {
  progressStatus: string
  volumeQuality: string
  goalAlignment: string
  suggestedAdjustment: string | null
  maintainOnCutCheck: string | null
  onAskQuestion?: (question: string) => void
}

export function InsightsView({
  progressStatus,
  volumeQuality,
  goalAlignment,
  suggestedAdjustment,
  maintainOnCutCheck,
  onAskQuestion,
}: InsightsViewProps) {
  const [question, setQuestion] = useState('')
  const [asked, setAsked] = useState<string | null>(null)

  const handleAsk = () => {
    const q = question.trim()
    if (!q || !onAskQuestion) return
    onAskQuestion(q)
    setAsked(q)
    setQuestion('')
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <InsightCard title="Progress Status" icon={TrendingUp} status="positive">
        {progressStatus}
      </InsightCard>

      <InsightCard title="Volume Quality" icon={BarChart3}>
        {volumeQuality}
      </InsightCard>

      <InsightCard title="Goal Alignment" icon={Target}>
        {goalAlignment}
      </InsightCard>

      {suggestedAdjustment && (
        <InsightCard title="Suggested Next Adjustment" icon={Lightbulb} status="attention">
          {suggestedAdjustment}
        </InsightCard>
      )}

      {maintainOnCutCheck && (
        <InsightCard title="Maintain-on-Cut Check" icon={Scale}>
          {maintainOnCutCheck}
        </InsightCard>
      )}

      {/* Optional ask-a-question mini panel */}
      {onAskQuestion && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-white/40" />
            <span className="text-xs font-medium text-white/50">Ask a follow-up (optional)</span>
          </div>
          <div className="p-3 space-y-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              placeholder="e.g., How many sets for bench this week?"
              className="input-field w-full text-sm py-2"
            />
            <button
              type="button"
              onClick={handleAsk}
              disabled={!question.trim()}
              className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/90 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
            {asked && (
              <p className="text-xs text-white/50">Sent. Insights will update when ready.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

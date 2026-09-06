'use client'

import { ChevronDown, ChevronUp, type LucideIcon } from 'lucide-react'

interface LogHubSectionToggleProps {
  icon: LucideIcon
  title: string
  hint?: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}

export function LogHubSectionToggle({
  icon: Icon,
  title,
  hint,
  open,
  onToggle,
  children,
}: LogHubSectionToggleProps) {
  return (
    <div className="log-hub-section">
      <button type="button" onClick={onToggle} className="log-hub-section-toggle" aria-expanded={open}>
        <span className="log-hub-section-toggle-icon" aria-hidden>
          <Icon className="w-4 h-4" />
        </span>
        <span className="log-hub-section-toggle-copy">
          <span className="log-hub-section-toggle-title">{title}</span>
          {hint && !open ? <span className="log-hub-section-toggle-hint">{hint}</span> : null}
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-white/45 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/45 shrink-0" />
        )}
      </button>
      {open ? <div className="log-hub-section-body">{children}</div> : null}
    </div>
  )
}

'use client'

import { Play, Zap, type LucideIcon } from 'lucide-react'

interface HubActionProps {
  icon: LucideIcon
  title: string
  description: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
  suppressHydrationWarning?: boolean
}

function HubAction({
  icon: Icon,
  title,
  description,
  onClick,
  variant = 'secondary',
  suppressHydrationWarning,
}: HubActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`log-hub-action ${variant === 'primary' ? 'log-hub-action-primary' : 'log-hub-action-secondary'}`}
      suppressHydrationWarning={suppressHydrationWarning}
    >
      <span
        className={`log-hub-action-icon ${variant === 'primary' ? 'log-hub-action-icon-primary' : ''}`}
        aria-hidden
      >
        <Icon className="w-5 h-5" strokeWidth={variant === 'primary' ? 2.5 : 2} />
      </span>
      <span className="log-hub-action-copy">
        <span className="log-hub-action-title">{title}</span>
        <span className="log-hub-action-desc">{description}</span>
      </span>
    </button>
  )
}

interface LogHubActionsProps {
  startTitle: string
  startDescription: string
  onStartWorkout: () => void
  onQuickAddExercise: () => void
}

export function LogHubActions({
  startTitle,
  startDescription,
  onStartWorkout,
  onQuickAddExercise,
}: LogHubActionsProps) {
  return (
    <div className="log-hub-actions-card">
      <p className="log-hub-actions-label">What do you want to do?</p>
      <div className="log-hub-actions-grid">
        <HubAction
          icon={Play}
          title={startTitle}
          description={startDescription}
          onClick={onStartWorkout}
          variant="primary"
          suppressHydrationWarning
        />
        <HubAction
          icon={Zap}
          title="Quick log"
          description="One exercise, done fast"
          onClick={onQuickAddExercise}
          variant="secondary"
        />
      </div>
    </div>
  )
}

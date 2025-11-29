'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface FitnessGoalIndicatorProps {
  goal: 'bulk' | 'cut' | 'maintenance' | null
  size?: 'sm' | 'md' | 'lg'
}

export function FitnessGoalIndicator({ goal, size = 'md' }: FitnessGoalIndicatorProps) {
  if (!goal) return null

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  const config = {
    bulk: {
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-950/30',
      borderColor: 'border-green-600/50',
      label: 'BULK',
    },
    cut: {
      icon: TrendingDown,
      color: 'text-red-400',
      bgColor: 'bg-red-950/30',
      borderColor: 'border-red-600/50',
      label: 'CUT',
    },
    maintenance: {
      icon: Minus,
      color: 'text-gray-400',
      bgColor: 'bg-gray-800/30',
      borderColor: 'border-gray-600/50',
      label: 'MAINTENANCE',
    },
  }

  const { icon: Icon, color, bgColor, borderColor, label } = config[goal]

  return (
    <div
      className={`inline-flex items-center space-x-1.5 px-2 py-1 rounded-lg border ${bgColor} ${borderColor} ${color}`}
    >
      <Icon className={sizeClasses[size]} />
      <span className={`font-bold ${textSizeClasses[size]}`}>{label}</span>
    </div>
  )
}


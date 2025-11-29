'use client'

import Image from 'next/image'
import { Award } from 'lucide-react'

interface Badge {
  id: string
  name: string
  description: string | null
  icon_url: string | null
  earned_at: string
}

interface BadgeDisplayProps {
  badges: Badge[]
}

export function BadgeDisplay({ badges }: BadgeDisplayProps) {
  if (!badges || badges.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <Award className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-black text-white tracking-tight">Badges</h2>
      </div>

      <div className="flex flex-wrap gap-3">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800/60 p-4 hover:border-primary/30 transition-all group"
            title={badge.description || badge.name}
          >
            {badge.icon_url ? (
              <div className="w-16 h-16 rounded-lg overflow-hidden mb-2">
                <Image
                  src={badge.icon_url}
                  alt={badge.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gradient-primary flex items-center justify-center mb-2">
                <Award className="w-8 h-8 text-white" />
              </div>
            )}
            <p className="text-white font-bold text-xs text-center">{badge.name}</p>
            {badge.description && (
              <p className="text-gray-500 text-[10px] text-center mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {badge.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}


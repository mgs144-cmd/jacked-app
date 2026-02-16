'use client'

import { Users, Globe } from 'lucide-react'

interface FeedToggleProps {
  view: 'friends' | 'community'
  onViewChange: (view: 'friends' | 'community') => void
}

export function FeedToggle({ view, onViewChange }: FeedToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/5 mb-6">
      <button
        onClick={() => onViewChange('friends')}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
          view === 'friends' ? 'bg-[#dc2626] text-white' : 'text-[#a1a1a1] hover:text-white hover:bg-white/5'
        }`}
      >
        <Users className="w-4 h-4" />
        Friends
      </button>
      <button
        onClick={() => onViewChange('community')}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
          view === 'community' ? 'bg-[#dc2626] text-white' : 'text-[#a1a1a1] hover:text-white hover:bg-white/5'
        }`}
      >
        <Globe className="w-4 h-4" />
        Community
      </button>
    </div>
  )
}


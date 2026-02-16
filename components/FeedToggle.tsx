'use client'

import { Users, Globe } from 'lucide-react'

interface FeedToggleProps {
  view: 'friends' | 'community'
  onViewChange: (view: 'friends' | 'community') => void
}

export function FeedToggle({ view, onViewChange }: FeedToggleProps) {
  return (
    <div 
      className="flex items-center gap-1 py-0.5 px-1 bg-white/5 rounded-xl border border-white/5 w-full max-w-[640px] h-12"
    >
      <button
        onClick={() => onViewChange('friends')}
        className={`flex-1 flex items-center justify-center gap-2 px-4 rounded-lg text-sm font-medium transition-all h-11 active:scale-[0.98] touch-manipulation ${
          view === 'friends' ? 'bg-[#ff5555] text-white' : 'text-[#a1a1a1] hover:text-white hover:bg-white/5'
        }`}
      >
        <Users className="w-4 h-4" />
        Friends
      </button>
      <button
        onClick={() => onViewChange('community')}
        className={`flex-1 flex items-center justify-center gap-2 px-4 rounded-lg text-sm font-medium transition-all h-11 active:scale-[0.98] touch-manipulation ${
          view === 'community' ? 'bg-[#ff5555] text-white' : 'text-[#a1a1a1] hover:text-white hover:bg-white/5'
        }`}
      >
        <Globe className="w-4 h-4" />
        Community
      </button>
    </div>
  )
}


'use client'

import { Users, Globe } from 'lucide-react'

interface FeedToggleProps {
  view: 'friends' | 'community'
  onViewChange: (view: 'friends' | 'community') => void
}

export function FeedToggle({ view, onViewChange }: FeedToggleProps) {
  return (
    <div className="flex items-center space-x-2 p-1 bg-gray-900/60 rounded-xl border border-gray-800/60 mb-6">
      <button
        onClick={() => onViewChange('friends')}
        className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
          view === 'friends'
            ? 'bg-gradient-primary text-white shadow-lg'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        <Users className="w-4 h-4" />
        <span className="font-bold text-sm">Friends Only</span>
      </button>
      <button
        onClick={() => onViewChange('community')}
        className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
          view === 'community'
            ? 'bg-gradient-primary text-white shadow-lg'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        <Globe className="w-4 h-4" />
        <span className="font-bold text-sm">Community</span>
      </button>
    </div>
  )
}


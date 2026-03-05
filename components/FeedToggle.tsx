'use client'


interface FeedToggleProps {
  view: 'friends' | 'community'
  onViewChange: (view: 'friends' | 'community') => void
}

export function FeedToggle({ view, onViewChange }: FeedToggleProps) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={() => onViewChange('friends')}
        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
          view === 'friends' ? 'text-white' : 'text-white/50 hover:text-white/80'
        }`}
      >
        Friends
      </button>
      <span className="text-white/30 text-xs">/</span>
      <button
        onClick={() => onViewChange('community')}
        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
          view === 'community' ? 'text-white' : 'text-white/50 hover:text-white/80'
        }`}
      >
        Community
      </button>
    </div>
  )
}


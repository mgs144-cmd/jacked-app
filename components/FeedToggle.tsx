'use client'


interface FeedToggleProps {
  view: 'friends' | 'community'
  onViewChange: (view: 'friends' | 'community') => void
}

export function FeedToggle({ view, onViewChange }: FeedToggleProps) {
  return (
    <div className="flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] p-0.5">
      <button
        onClick={() => onViewChange('friends')}
        className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors ${
          view === 'friends' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80'
        }`}
      >
        Friends
      </button>
      <button
        onClick={() => onViewChange('community')}
        className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors ${
          view === 'community' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80'
        }`}
      >
        Community
      </button>
    </div>
  )
}


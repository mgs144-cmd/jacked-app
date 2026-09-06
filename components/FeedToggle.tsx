'use client'


interface FeedToggleProps {
  view: 'friends' | 'community'
  onViewChange: (view: 'friends' | 'community') => void
}

export function FeedToggle({ view, onViewChange }: FeedToggleProps) {
  return (
    <div className="flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] p-0.5">
      <button
        type="button"
        onClick={() => onViewChange('friends')}
        className={`btn btn-pill ${view === 'friends' ? 'btn-pill-active' : ''}`}
      >
        Friends
      </button>
      <button
        type="button"
        onClick={() => onViewChange('community')}
        className={`btn btn-pill ${view === 'community' ? 'btn-pill-active' : ''}`}
      >
        Community
      </button>
    </div>
  )
}


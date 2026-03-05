'use client'

export type PostVisibility = 'public' | 'followers' | 'log'

interface PrivacyToggleProps {
  visibility: PostVisibility
  onChange: (visibility: PostVisibility) => void
}

export function PrivacyToggle({ visibility, onChange }: PrivacyToggleProps) {
  return (
    <div className="bg-white/[0.02] backdrop-blur-sm rounded-xl border border-white/10 p-4">
      <label className="block text-sm font-bold text-white/80 mb-3 tracking-wide">
        POST VISIBILITY
      </label>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => onChange('public')}
          className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center ${
            visibility === 'public'
              ? 'bg-white text-black'
              : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          <span>PUBLIC</span>
        </button>

        <button
          type="button"
          onClick={() => onChange('followers')}
          className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center ${
            visibility === 'followers'
              ? 'bg-white text-black'
              : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          <span>FOLLOWERS ONLY</span>
        </button>

        <button
          type="button"
          onClick={() => onChange('log')}
          className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center ${
            visibility === 'log'
              ? 'bg-white text-black'
              : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          <span>LOG</span>
        </button>
      </div>

      <p className="text-xs text-white/50 mt-3 font-medium">
        {visibility === 'public' && 'Everyone can see this post'}
        {visibility === 'followers' && 'Only your followers can see this post'}
        {visibility === 'log' && 'Private log - only you can see this. Track your progress without posting to feeds.'}
      </p>
    </div>
  )
}

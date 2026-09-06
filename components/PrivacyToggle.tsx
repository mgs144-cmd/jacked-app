'use client'

export type PostVisibility = 'public' | 'followers' | 'log'

interface PrivacyToggleProps {
  visibility: PostVisibility
  onChange: (visibility: PostVisibility) => void
}

export function PrivacyToggle({ visibility, onChange }: PrivacyToggleProps) {
  return (
    <div className="bg-white/[0.02] backdrop-blur-sm rounded-xl border border-white/10 p-4">
      <label className="block text-[10px] font-metric font-semibold uppercase tracking-widest text-white/50 mb-3">
        Post visibility
      </label>

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={() => onChange('public')}
          className={`btn flex-1 ${visibility === 'public' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Public
        </button>

        <button
          type="button"
          onClick={() => onChange('followers')}
          className={`btn flex-1 ${visibility === 'followers' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Followers
        </button>

        <button
          type="button"
          onClick={() => onChange('log')}
          className={`btn flex-1 ${visibility === 'log' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Log only
        </button>
      </div>

      <p className="text-xs text-white/50 mt-3 font-medium">
        {visibility === 'public' && 'Everyone can see this post'}
        {visibility === 'followers' && 'Only your followers can see this post'}
        {visibility === 'log' &&
          'Private log — only you can see this. Track your progress without posting to feeds.'}
      </p>
    </div>
  )
}

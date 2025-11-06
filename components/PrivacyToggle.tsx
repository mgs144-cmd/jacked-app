'use client'

import { Globe, Lock } from 'lucide-react'

interface PrivacyToggleProps {
  isPrivate: boolean
  onChange: (isPrivate: boolean) => void
}

export function PrivacyToggle({ isPrivate, onChange }: PrivacyToggleProps) {
  return (
    <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800/60 p-4">
      <label className="block text-sm font-bold text-gray-300 mb-3 tracking-wide">
        POST PRIVACY
      </label>
      
      <div className="flex space-x-3">
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center space-x-2 ${
            !isPrivate
              ? 'bg-gradient-primary text-white shadow-lg shadow-primary/20'
              : 'bg-gray-800/60 text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <Globe className="w-5 h-5" />
          <span>PUBLIC</span>
        </button>

        <button
          type="button"
          onClick={() => onChange(true)}
          className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center space-x-2 ${
            isPrivate
              ? 'bg-gradient-primary text-white shadow-lg shadow-primary/20'
              : 'bg-gray-800/60 text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <Lock className="w-5 h-5" />
          <span>FOLLOWERS ONLY</span>
        </button>
      </div>

      <p className="text-xs text-gray-600 mt-3 font-medium">
        {isPrivate 
          ? '🔒 Only your followers can see this post'
          : '🌍 Everyone can see this post'
        }
      </p>
    </div>
  )
}



'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'
import { Navbar } from '@/components/Navbar'
import { Loader2, Lock, Unlock, Eye, EyeOff, Shield, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function PrivacySettingsPage() {
  const [isPrivateAccount, setIsPrivateAccount] = useState(false)
  const [hideFollowerCount, setHideFollowerCount] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    async function loadSettings() {
      if (!user) return
      
      setLoading(true)
      const { data } = await (supabase
        .from('profiles') as any)
        .select('is_account_private, hide_follower_count')
        .eq('id', user.id)
        .single()

      if (data) {
        setIsPrivateAccount(data.is_account_private || false)
        setHideFollowerCount(data.hide_follower_count || false)
      }
      setLoading(false)
    }

    loadSettings()
  }, [user, router, supabase])

  const handleSave = async () => {
    if (!user) return

    setError(null)
    setSuccess(false)
    setSaving(true)

    try {
      const { error: updateError } = await (supabase
        .from('profiles') as any)
        .update({
          is_account_private: isPrivateAccount,
          hide_follower_count: hideFollowerCount,
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update privacy settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20 md:pb-0 md:pt-24">
        <Navbar />
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-24">
      <Navbar />
      
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href="/settings"
          className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-6 font-semibold"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Settings</span>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-3">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-black text-white tracking-tight">Privacy</h1>
          </div>
          <p className="text-gray-400 font-medium">Control who can see your content</p>
        </div>

        <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800/60 overflow-hidden card-elevated">
          {/* Status Messages */}
          {error && (
            <div className="bg-red-950/50 border-b border-primary/50 text-red-400 px-6 py-4 backdrop-blur-sm">
              <p className="font-semibold">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-950/50 border-b border-green-600/50 text-green-400 px-6 py-4 backdrop-blur-sm">
              <p className="font-semibold">Privacy settings updated successfully!</p>
            </div>
          )}

          <div className="p-8 space-y-8">
            {/* Private Account Toggle */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {isPrivateAccount ? (
                      <Lock className="w-6 h-6 text-primary" />
                    ) : (
                      <Unlock className="w-6 h-6 text-gray-400" />
                    )}
                    <h3 className="text-xl font-black text-white">Private Account</h3>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    When your account is private, only people you approve can see your posts and follow you.
                    Your profile photo and username are always visible.
                  </p>
                </div>
                <button
                  onClick={() => setIsPrivateAccount(!isPrivateAccount)}
                  className={`ml-4 relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 ${
                    isPrivateAccount ? 'bg-primary' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isPrivateAccount ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {isPrivateAccount && (
                <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 mt-4">
                  <p className="text-yellow-400 text-sm font-semibold mb-2">🔒 Private Account Active</p>
                  <ul className="text-gray-300 text-sm space-y-1">
                    <li>• New followers must request to follow you</li>
                    <li>• You can approve or decline requests</li>
                    <li>• Only approved followers see your posts</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="border-t border-gray-800"></div>

            {/* Hide Follower Count Toggle */}
            <div>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {hideFollowerCount ? (
                      <EyeOff className="w-6 h-6 text-gray-400" />
                    ) : (
                      <Eye className="w-6 h-6 text-gray-400" />
                    )}
                    <h3 className="text-xl font-black text-white">Hide Follower Count</h3>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Hide your follower and following counts from your profile. You can still see them yourself.
                  </p>
                </div>
                <button
                  onClick={() => setHideFollowerCount(!hideFollowerCount)}
                  className={`ml-4 relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-900 ${
                    hideFollowerCount ? 'bg-primary' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      hideFollowerCount ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full btn-primary py-4 text-base font-bold tracking-wide flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>SAVING...</span>
                </>
              ) : (
                <span>SAVE PRIVACY SETTINGS</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


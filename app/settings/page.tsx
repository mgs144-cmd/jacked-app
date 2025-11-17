'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'
import { Navbar } from '@/components/Navbar'
import Link from 'next/link'
import { Loader2, Upload, LogOut, User, Shield } from 'lucide-react'
import { MusicSelector } from '@/components/MusicSelector'

export default function SettingsPage() {
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [profileSong, setProfileSong] = useState<{ title: string; artist: string; url?: string; spotifyId?: string } | null>(null)
  const [loading, setLoading] = useState(false)
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

    const currentUser = user
    async function loadProfile() {
      setLoading(true)
      const { data } = await (supabase
        .from('profiles') as any)
        .select('*')
        .eq('id', currentUser.id)
        .single()

      if (data) {
        setUsername(data.username || '')
        setFullName(data.full_name || '')
        setBio(data.bio || '')
        setAvatarPreview(data.avatar_url)
        if (data.profile_song_title && data.profile_song_artist) {
          setProfileSong({
            title: data.profile_song_title,
            artist: data.profile_song_artist,
            url: data.profile_song_url || undefined,
            spotifyId: data.profile_song_spotify_id || undefined,
          })
        }
      }
      setLoading(false)
    }

    loadProfile()
  }, [user, router, supabase])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setError(null)
    setSuccess(false)
    setSaving(true)

    try {
      let avatarUrl = avatarPreview

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile)

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from('avatars').getPublicUrl(fileName)
        avatarUrl = publicUrl
      }

      const { error: updateError } = await (supabase
        .from('profiles') as any)
        .update({
          username: username || null,
          full_name: fullName || null,
          bio: bio || null,
          avatar_url: avatarUrl,
          profile_song_title: profileSong?.title || null,
          profile_song_artist: profileSong?.artist || null,
          profile_song_url: profileSong?.url || null,
          profile_song_spotify_id: profileSong?.spotifyId || null,
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-3">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-black text-white tracking-tight">Settings</h1>
          </div>
          <p className="text-gray-400 font-medium">Manage your profile and account preferences</p>
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
              <p className="font-semibold">Profile updated successfully!</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Avatar Section */}
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-4 tracking-wide flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>PROFILE PICTURE</span>
              </label>
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-800 overflow-hidden ring-4 ring-gray-800">
                    {avatarPreview ? (
                      <Image
                        src={avatarPreview}
                        alt="Avatar"
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 text-white text-3xl font-black">
                        {username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                </div>
                <label className="btn-secondary px-6 py-3 cursor-pointer flex items-center space-x-2">
                  <Upload className="w-5 h-5" />
                  <span>Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-bold text-gray-300 mb-2 tracking-wide">
                  USERNAME
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field w-full"
                  placeholder="Your username"
                />
              </div>

              <div>
                <label htmlFor="fullName" className="block text-sm font-bold text-gray-300 mb-2 tracking-wide">
                  FULL NAME
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-field w-full"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-bold text-gray-300 mb-2 tracking-wide">
                  BIO
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="input-field w-full resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2 tracking-wide">
                  PROFILE SONG
                </label>
                <p className="text-xs text-gray-500 mb-3">This song will play when others visit your profile</p>
                <MusicSelector
                  onSelect={setProfileSong}
                  selectedSong={profileSong}
                  onClear={() => setProfileSong(null)}
                  uploadMode="profile"
                />
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full py-4 text-base font-bold tracking-wide flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>SAVING...</span>
                </>
              ) : (
                <span>SAVE CHANGES</span>
              )}
            </button>
          </form>

          {/* Privacy Settings Link */}
          <div className="border-t border-gray-800/60 p-8">
            <Link
              href="/settings/privacy"
              className="w-full px-6 py-4 bg-gray-800/60 border border-gray-700 rounded-xl text-white font-bold hover:bg-gray-700 transition-all flex items-center justify-center space-x-2"
            >
              <Shield className="w-5 h-5" />
              <span>PRIVACY SETTINGS</span>
            </Link>
          </div>

          {/* Sign Out Section */}
          <div className="border-t border-gray-800/60 p-8">
            <button
              onClick={handleSignOut}
              className="w-full px-6 py-4 border-2 border-red-600/50 rounded-xl text-red-400 font-bold hover:bg-red-950/30 hover:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all flex items-center justify-center space-x-2"
            >
              <LogOut className="w-5 h-5" />
              <span>SIGN OUT</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

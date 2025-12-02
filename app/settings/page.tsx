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
import { ImageCropper } from '@/components/ImageCropper'

export default function SettingsPage() {
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [profileSong, setProfileSong] = useState<{ title: string; artist: string; url?: string; spotifyId?: string; albumArt?: string } | null>(null)
  const [songStartTime, setSongStartTime] = useState<number | null>(null)
  const [fitnessGoal, setFitnessGoal] = useState<'bulk' | 'cut' | 'maintenance' | null>(null)
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
            albumArt: data.profile_song_album_art_url || undefined,
          })
        }
        setFitnessGoal(data.fitness_goal || null)
        setSongStartTime(data.profile_song_start_time || null)
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
        const imageUrl = reader.result as string
        setImageToCrop(imageUrl)
        setShowCropper(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropComplete = (croppedImage: string) => {
    setAvatarPreview(croppedImage)
    setShowCropper(false)
    setImageToCrop(null)
    
    // Convert cropped image to File for upload
    fetch(croppedImage)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
        setAvatarFile(file)
      })
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

      // Build update object conditionally to avoid errors if columns don't exist
      const updateData: any = {
        username: username || null,
        full_name: fullName || null,
        bio: bio || null,
        avatar_url: avatarUrl,
        profile_song_title: profileSong?.title || null,
        profile_song_artist: profileSong?.artist || null,
        profile_song_url: profileSong?.url || null,
      }
      
      // Only include album_art_url if column exists (check by trying to include it conditionally)
      // We'll try to update it, but if it fails, we'll catch the error
      if (profileSong?.albumArt) {
        updateData.profile_song_album_art_url = profileSong.albumArt
      }
      
      // Only include spotify_id if it exists
      if (profileSong?.spotifyId) {
        updateData.profile_song_spotify_id = profileSong.spotifyId
      }
      
      // Add fitness goal
      updateData.fitness_goal = fitnessGoal || null
      
      // Add song start time
      updateData.profile_song_start_time = songStartTime || null

      // Try to update, but handle missing columns gracefully
      const { error: updateError, data } = await (supabase
        .from('profiles') as any)
        .update(updateData)
        .eq('id', user.id)
        .select()

      if (updateError) {
        // If error is about missing column, try without that column
        if (updateError.message?.includes('profile_song_album_art_url') || 
            updateError.message?.includes('profile_song_spotify_id')) {
          console.log('Some profile song columns missing, trying without them...')
          const fallbackData: any = {
            username: username || null,
            full_name: fullName || null,
            bio: bio || null,
            avatar_url: avatarUrl,
            profile_song_title: profileSong?.title || null,
            profile_song_artist: profileSong?.artist || null,
            profile_song_url: profileSong?.url || null,
            fitness_goal: fitnessGoal || null,
          }
          const { error: fallbackError } = await (supabase
            .from('profiles') as any)
            .update(fallbackData)
            .eq('id', user.id)
          if (fallbackError) throw fallbackError
        } else {
          throw updateError
        }
      }

      // Redirect to profile page instead of showing success message
      router.push('/profile')
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
                
                {profileSong && (
                  <div className="mt-4">
                    <label htmlFor="songStartTime" className="block text-sm font-bold text-gray-300 mb-2 tracking-wide">
                      START TIME (SECONDS)
                    </label>
                    <p className="text-xs text-gray-500 mb-2">Skip to a specific part of the song (e.g., 30 to start at 30 seconds, leave empty to start from beginning)</p>
                    <input
                      id="songStartTime"
                      type="number"
                      min="0"
                      value={songStartTime || ''}
                      onChange={(e) => setSongStartTime(e.target.value ? parseInt(e.target.value) : null)}
                      className="input-field w-full"
                      placeholder="0 (start from beginning)"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2 tracking-wide">
                  FITNESS GOAL
                </label>
                <p className="text-xs text-gray-500 mb-3">Display your current fitness phase</p>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFitnessGoal('bulk')}
                    className={`py-3 px-4 rounded-xl border-2 transition-all font-bold ${
                      fitnessGoal === 'bulk'
                        ? 'border-green-600 bg-green-950/30 text-green-400'
                        : 'border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    BULK
                  </button>
                  <button
                    type="button"
                    onClick={() => setFitnessGoal('cut')}
                    className={`py-3 px-4 rounded-xl border-2 transition-all font-bold ${
                      fitnessGoal === 'cut'
                        ? 'border-red-600 bg-red-950/30 text-red-400'
                        : 'border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    CUT
                  </button>
                  <button
                    type="button"
                    onClick={() => setFitnessGoal('maintenance')}
                    className={`py-3 px-4 rounded-xl border-2 transition-all font-bold ${
                      fitnessGoal === 'maintenance'
                        ? 'border-gray-600 bg-gray-800/30 text-gray-400'
                        : 'border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600'
                    }`}
                  >
                    MAINTENANCE
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setFitnessGoal(null)}
                  className="mt-2 text-xs text-gray-500 hover:text-gray-400"
                >
                  Clear selection
                </button>
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

      {/* Image Cropper Modal */}
      {showCropper && imageToCrop && (
        <ImageCropper
          image={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setShowCropper(false)
            setImageToCrop(null)
            setAvatarFile(null)
          }}
          aspectRatio={1}
        />
      )}
    </div>
  )
}

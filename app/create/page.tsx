'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'
import { Navbar } from '@/components/Navbar'
import { MusicSelector } from '@/components/MusicSelector'
import { SongPreviewPlayer } from '@/components/SongPreviewPlayer'
import { PrivacyToggle } from '@/components/PrivacyToggle'
import { WorkoutForm } from '@/components/WorkoutForm'
import { ExerciseAutocomplete } from '@/components/ExerciseAutocomplete'
import Image from 'next/image'
import { Loader2, Upload, X, Image as ImageIcon, Video, Trophy } from 'lucide-react'

function CreatePage() {
  const [content, setContent] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null)
  const [selectedSong, setSelectedSong] = useState<{ title: string; artist: string; url?: string; spotifyId?: string; albumArt?: string } | null>(null)
  const [songStartTime, setSongStartTime] = useState<number | null>(null)
  const [previewStartTime, setPreviewStartTime] = useState<number | null>(null)

  // Debounce preview start time - only play after user stops typing
  useEffect(() => {
    if (songStartTime === null || songStartTime === undefined || songStartTime < 0) {
      setPreviewStartTime(null)
      return
    }

    const timer = setTimeout(() => {
      setPreviewStartTime(songStartTime)
    }, 800) // Wait 800ms after user stops typing

    return () => clearTimeout(timer)
  }, [songStartTime])
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'log'>('public')
  const [isPRPost, setIsPRPost] = useState(false)
  const [prExercise, setPRExercise] = useState('')
  const [prWeight, setPRWeight] = useState('')
  const [prReps, setPRReps] = useState('')
  const [prRpe, setPrRpe] = useState('')
  const [workoutExercises, setWorkoutExercises] = useState<Array<{ exercise_name: string; sets_data: Array<{ weight: number | null; reps: number | null }>; order_index: number }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()
  const { user } = useAuth()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setMediaFile(file)
    const type = file.type.startsWith('video/') ? 'video' : 'image'
    setMediaType(type)

    const reader = new FileReader()
    reader.onloadend = () => {
      setMediaPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveMedia = () => {
    setMediaFile(null)
    setMediaPreview(null)
    setMediaType(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || (!content.trim() && !mediaFile)) {
      setError('Please add some content or media')
      return
    }

    setError('')
    setLoading(true)

    try {
      if (!user) {
        setError('User not authenticated')
        return
      }

      let mediaUrl = null

      if (mediaFile && user) {
        const fileExt = mediaFile.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const bucket = mediaType === 'video' ? 'videos' : 'images'

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, mediaFile)

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from(bucket).getPublicUrl(fileName)
        mediaUrl = publicUrl
      }

      // Build post data conditionally to avoid errors if columns don't exist
      const postInsertData: any = {
        user_id: user.id,
        content: content.trim() || null,
        media_url: mediaUrl,
        media_type: mediaType,
        song_title: selectedSong?.title || null,
        song_artist: selectedSong?.artist || null,
        song_url: selectedSong?.url || null,
        song_album_art_url: selectedSong?.albumArt || null,
        song_start_time: songStartTime || null,
        is_private: visibility === 'followers',
        is_log_only: visibility === 'log',
        is_pr_post: isPRPost,
        pr_exercise: isPRPost ? prExercise.trim() : null,
        pr_weight: isPRPost && prWeight ? parseFloat(prWeight) : null,
        pr_reps: isPRPost && prReps ? parseInt(prReps) : null,
        pr_rpe: isPRPost && prRpe ? parseFloat(prRpe) : null,
      }

      // Only include spotify_id if it exists and column exists in database
      // (This column may not exist if Spotify migration wasn't run)
      if (selectedSong?.spotifyId) {
        try {
          postInsertData.song_spotify_id = selectedSong.spotifyId
        } catch (e) {
          // Column doesn't exist, skip it
          console.log('song_spotify_id column not available')
        }
      }

      const { data: postData, error: insertError } = await (supabase.from('posts') as any).insert(postInsertData).select().single()

      if (insertError) throw insertError

      // Create PR record if this is a PR post
      if (isPRPost && postData && prExercise.trim()) {
        await (supabase.from('personal_records') as any).insert({
          user_id: user.id,
          exercise_name: prExercise.trim(),
          weight: prWeight ? parseFloat(prWeight) : null,
          reps: prReps ? parseInt(prReps) : null,
          video_url: mediaUrl || null, // Video is optional now
          post_id: postData.id,
        })
      }

      // Create workout exercises if any
      if (workoutExercises.length > 0 && workoutExercises.some(ex => ex.exercise_name.trim())) {
        // Flatten sets_data into individual workout_exercise entries
        const validExercises: any[] = []
        workoutExercises
          .filter(ex => ex.exercise_name.trim())
          .forEach((ex, exerciseIndex) => {
            ex.sets_data.forEach((set, setIndex) => {
              if (set.weight !== null && set.reps !== null) {
                validExercises.push({
                  post_id: postData.id,
                  exercise_name: ex.exercise_name.trim(),
                  sets: 1, // Each entry is one set
                  reps: set.reps,
                  weight: set.weight,
                  order_index: exerciseIndex,
                })
              }
            })
          })

        if (validExercises.length > 0) {
          await (supabase.from('workout_exercises') as any).insert(validExercises)
        }
      }

      router.push('/feed')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-14 bg-[#1a1a1a]">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white tracking-tight mb-1">Create Post</h1>
          <p className="text-[#a1a1a1] text-sm">Share your progress with the community</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-[#ff5555]/10 border border-[#ff5555]/30 text-[#ff5555] px-6 py-4 rounded-[12px] font-medium">
              {error}
            </div>
          )}

          {mediaPreview && (
            <div className="relative rounded-[12px] overflow-hidden border border-white/5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div className="relative w-full aspect-square bg-[#1a1a1a]">
                {mediaType === 'video' ? (
                  <video
                    src={mediaPreview}
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src={mediaPreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <button
                type="button"
                onClick={handleRemoveMedia}
                className="absolute top-4 right-4 w-10 h-10 bg-black/80 backdrop-blur-sm hover:bg-[#ff5555] text-white rounded-full flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {!mediaPreview && (
            <div className="rounded-[12px] border-2 border-dashed border-white/10 p-12 text-center bg-white/[0.02] hover:border-[#ff5555]/30 transition-all" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <label className="cursor-pointer flex flex-col items-center space-y-4">
                <div className="w-20 h-20 rounded-[12px] bg-white/5 flex items-center justify-center">
                  <Upload className="w-10 h-10 text-[#a1a1a1]" />
                </div>
                <div>
                  <p className="text-white font-semibold text-base mb-1">Upload Photo or Video</p>
                  <p className="text-[#a1a1a1] text-sm">Click to browse or drag and drop</p>
                </div>
                <div className="flex items-center space-x-4 text-sm text-[#6b6b6b]">
                  <div className="flex items-center space-x-1">
                    <ImageIcon className="w-4 h-4" />
                    <span>JPG, PNG</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Video className="w-4 h-4" />
                    <span>MP4, MOV</span>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          )}

          <div className="rounded-[12px] border border-white/5 p-6 bg-white/[0.02]" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPRPost}
                onChange={(e) => setIsPRPost(e.target.checked)}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-[#ff5555] focus:ring-[#ff5555] focus:ring-offset-0"
              />
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-[#ff5555]" />
                <span className="text-white font-semibold">This is a Personal Record (PR) Post</span>
              </div>
            </label>
            <p className="text-xs text-[#a1a1a1] mt-2 ml-8">PR posts will be highlighted in the feed</p>
          </div>

          {/* PR Details - Only show if PR post */}
          {isPRPost && (
            <div className="rounded-[12px] border border-[#ff5555]/30 p-6 space-y-4 bg-[#ff5555]/5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div className="flex items-center space-x-2 mb-4">
                <Trophy className="w-6 h-6 text-[#ff5555]" />
                <h3 className="text-white font-bold text-lg">PR Details</h3>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">EXERCISE NAME</label>
                <ExerciseAutocomplete
                  value={prExercise}
                  onChange={setPRExercise}
                  placeholder="e.g., Deadlift"
                  className="input-field w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">WEIGHT (lbs)</label>
                  <input
                    type="number"
                    value={prWeight}
                    onChange={(e) => setPRWeight(e.target.value)}
                    placeholder="225"
                    min="0"
                    step="0.5"
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">REPS</label>
                  <input
                    type="number"
                    value={prReps}
                    onChange={(e) => setPRReps(e.target.value)}
                    placeholder="5"
                    min="1"
                    className="input-field w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">RPE (optional)</label>
                <select
                  value={prRpe}
                  onChange={(e) => setPrRpe(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="">Not specified (assume max)</option>
                  {[10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6].map((v) => (
                    <option key={v} value={v}>RPE {v} {v === 10 ? '(max)' : ''}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Workout Details */}
          <WorkoutForm exercises={workoutExercises} onChange={setWorkoutExercises} />

          {/* Music Selector - Removed for presentation (not working yet) */}

          {/* Privacy Toggle */}
          <PrivacyToggle visibility={visibility} onChange={setVisibility} />

          {/* Caption */}
          <div>
            <label htmlFor="content" className="block text-sm font-bold text-gray-300 mb-3 tracking-wide">
              CAPTION
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="input-field w-full resize-none text-lg"
              placeholder="What's on your mind? Share your workout, progress, or motivation..."
            />
            <p className="text-sm text-gray-600 mt-2 font-medium">
              {content.length}/500 characters
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 btn-secondary py-4 text-base font-bold tracking-wide"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading || (!content.trim() && !mediaFile)}
              className="flex-1 btn-primary py-4 text-base font-bold tracking-wide flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>POSTING...</span>
                </>
              ) : (
                <span>POST</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Wrapper component with Suspense boundary
export default function CreatePageWithSuspense() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pb-20 md:pb-0 md:pt-14 bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#ff5555] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#a1a1a1]">Loading...</p>
        </div>
      </div>
    }>
      <CreatePage />
    </Suspense>
  )
}

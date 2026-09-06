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
import { buildWorkoutExerciseRows, type WorkoutLogTier, type WorkoutExerciseDraft } from '@/lib/workoutPost'
import { ExerciseAutocomplete } from '@/components/ExerciseAutocomplete'
import { ImageCropModal } from '@/components/ImageCropModal'
import { PostDraftPreview } from '@/components/PostDraftPreview'
import { Loader2, Upload, Image as ImageIcon, Pencil, Video, Trophy, X } from 'lucide-react'
import { BrandHeading } from '@/components/BrandHeading'
import { ensureExercisesInCatalog } from '@/lib/exerciseCatalog'

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
  const [workoutTier, setWorkoutTier] = useState<WorkoutLogTier>('none')
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExerciseDraft[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cropOpen, setCropOpen] = useState(false)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [previewUsername, setPreviewUsername] = useState('You')
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const { user } = useAuth()

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    ;(async () => {
      const { data } = await supabase.from('profiles').select('username, avatar_url').eq('id', user.id).maybeSingle()
      if (cancelled || !data) return
      const row = data as { username?: string | null; avatar_url?: string | null }
      if (typeof row.username === 'string' && row.username) setPreviewUsername(row.username)
      if (typeof row.avatar_url === 'string' && row.avatar_url) setPreviewAvatar(row.avatar_url)
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id, supabase])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const type = file.type.startsWith('video/') ? 'video' : 'image'
    if (type === 'video') {
      setMediaFile(file)
      setMediaType('video')
      const reader = new FileReader()
      reader.onloadend = () => setMediaPreview(reader.result as string)
      reader.readAsDataURL(file)
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setCropSrc(reader.result as string)
      setCropOpen(true)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const onCropDone = (file: File) => {
    if (mediaPreview?.startsWith('blob:')) URL.revokeObjectURL(mediaPreview)
    setMediaFile(file)
    setMediaType('image')
    setMediaPreview(URL.createObjectURL(file))
    setCropOpen(false)
    setCropSrc(null)
  }

  const openEditPhoto = () => {
    if (mediaType !== 'image' || !mediaPreview) return
    setCropSrc(mediaPreview)
    setCropOpen(true)
  }

  const handleRemoveMedia = () => {
    if (mediaPreview?.startsWith('blob:')) URL.revokeObjectURL(mediaPreview)
    setMediaFile(null)
    setMediaPreview(null)
    setMediaType(null)
    setCropOpen(false)
    setCropSrc(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || (!content.trim() && !mediaFile && !mediaPreview)) {
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

      const workoutRows = buildWorkoutExerciseRows(workoutTier, workoutExercises, postData.id)
      if (workoutRows.length > 0) {
        await (supabase.from('workout_exercises') as any).insert(workoutRows)
        void ensureExercisesInCatalog(
          supabase,
          user.id,
          workoutRows.map((r) => r.exercise_name)
        )
      }
      if (isPRPost && prExercise.trim()) {
        void ensureExercisesInCatalog(supabase, user.id, [prExercise.trim()])
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
    <div className="min-h-screen pb-20 md:pb-0 md:pt-14 bg-black">
      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          open={cropOpen}
          onClose={() => {
            setCropOpen(false)
            setCropSrc(null)
          }}
          onCropped={onCropDone}
        />
      )}

      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <BrandHeading variant="page" className="mb-1">Create Post</BrandHeading>
          <p className="ui-subtitle mt-2">Share your progress with the community</p>
        </div>

        <div className="mb-8">
          <PostDraftPreview
            username={previewUsername}
            avatarUrl={previewAvatar}
            content={content}
            mediaPreview={mediaPreview}
            mediaType={mediaType}
            isPRPost={isPRPost}
            prExercise={prExercise}
            prWeight={prWeight}
            prReps={prReps}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-6 py-4 rounded-[12px] font-medium">
              {error}
            </div>
          )}

          {mediaPreview && (
            <div className="flex flex-wrap items-center gap-3">
              {mediaType === 'image' && (
                <button
                  type="button"
                  onClick={openEditPhoto}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-white hover:bg-white/[0.1]"
                >
                  <Pencil className="h-4 w-4 text-white/70" />
                  Edit photo
                </button>
              )}
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-white/80 hover:bg-white/[0.06]">
                <Upload className="h-4 w-4 text-white/50" />
                {mediaType === 'video' ? 'Replace video' : 'Replace media'}
                <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
              </label>
              <button
                type="button"
                onClick={handleRemoveMedia}
                className="inline-flex items-center gap-2 rounded-xl border border-red-500/25 px-4 py-2.5 text-sm font-medium text-red-300/90 hover:bg-red-500/10"
              >
                <X className="h-4 w-4" />
                Remove
              </button>
            </div>
          )}

          {!mediaPreview && (
            <label className="flex cursor-pointer flex-col items-center py-6">
              <Upload className="h-10 w-10 text-white/70" strokeWidth={1.5} />
              <p className="mt-3 ui-body-medium text-white">Upload photo or video</p>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}

          <div className="rounded-[12px] border border-white/5 p-6 bg-white/[0.02]" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPRPost}
                onChange={(e) => setIsPRPost(e.target.checked)}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-white focus:ring-white focus:ring-offset-0"
              />
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-white" />
                <span className="text-white font-semibold">This is a Personal Record (PR) Post</span>
              </div>
            </label>
            <p className="text-xs text-white/70 mt-2 ml-8">PR posts will be highlighted in the feed</p>
          </div>

          {/* PR Details - Only show if PR post */}
          {isPRPost && (
            <div className="rounded-[12px] border border-white/20 p-6 space-y-4 bg-white/5">
              <div className="flex items-center space-x-2 mb-4">
                <Trophy className="w-6 h-6 text-white" />
                <h3 className="text-white font-bold text-lg">PR Details</h3>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">EXERCISE NAME</label>
                <ExerciseAutocomplete
                  value={prExercise}
                  onChange={setPRExercise}
                  placeholder="e.g., Deadlift"
                  className="input-field w-full"
                  userId={user?.id}
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
          <WorkoutForm
            tier={workoutTier}
            onTierChange={setWorkoutTier}
            exercises={workoutExercises}
            onChange={setWorkoutExercises}
            userId={user?.id}
          />

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
              rows={3}
              className="input-field w-full min-h-[4.5rem] resize-y text-base"
              placeholder=""
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
              className="flex-1 btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (!content.trim() && !mediaFile && !mediaPreview)}
              className="flex-1 btn btn-primary gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
      <div className="min-h-screen pb-20 md:pb-0 md:pt-14 bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    }>
      <CreatePage />
    </Suspense>
  )
}

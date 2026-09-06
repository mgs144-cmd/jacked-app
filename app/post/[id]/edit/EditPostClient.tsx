'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'
import { Navbar } from '@/components/Navbar'
import { PrivacyToggle } from '@/components/PrivacyToggle'
import { WorkoutForm } from '@/components/WorkoutForm'
import { ExerciseAutocomplete } from '@/components/ExerciseAutocomplete'
import { ImageCropModal } from '@/components/ImageCropModal'
import { PostDraftPreview } from '@/components/PostDraftPreview'
import {
  buildWorkoutExerciseRows,
  exercisesFromDbRows,
  type WorkoutLogTier,
  type WorkoutExerciseDraft,
} from '@/lib/workoutPost'
import { Loader2, Pencil, Upload, X, Image as ImageIcon, Video, Trophy } from 'lucide-react'

type InitialPost = {
  id: string
  user_id: string
  content: string | null
  media_url: string | null
  media_type: string | null
  is_private: boolean | null
  is_log_only: boolean | null
  is_pr_post: boolean | null
  pr_exercise: string | null
  pr_weight: number | null
  pr_reps: number | null
  pr_rpe: number | null
  workout_exercises?: any[] | null
  profiles?: { username?: string; avatar_url?: string | null } | null
}

function storageObjectPathFromUrl(url: string, bucket: 'images' | 'videos'): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`
  const i = url.indexOf(marker)
  if (i === -1) return null
  return decodeURIComponent(url.slice(i + marker.length).split('?')[0])
}

function EditPostInner({ initialPost }: { initialPost: InitialPost }) {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()

  const [content, setContent] = useState(initialPost.content || '')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(initialPost.media_url)
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(
    initialPost.media_type === 'video' ? 'video' : initialPost.media_url ? 'image' : null
  )
  const [cropOpen, setCropOpen] = useState(false)
  const [cropSrc, setCropSrc] = useState<string | null>(null)

  const [visibility, setVisibility] = useState<'public' | 'followers' | 'log'>(() => {
    if (initialPost.is_log_only) return 'log'
    if (initialPost.is_private) return 'followers'
    return 'public'
  })

  const [isPRPost, setIsPRPost] = useState(Boolean(initialPost.is_pr_post))
  const [prExercise, setPRExercise] = useState(initialPost.pr_exercise || '')
  const [prWeight, setPRWeight] = useState(initialPost.pr_weight != null ? String(initialPost.pr_weight) : '')
  const [prReps, setPRReps] = useState(initialPost.pr_reps != null ? String(initialPost.pr_reps) : '')
  const [prRpe, setPrRpe] = useState(initialPost.pr_rpe != null ? String(initialPost.pr_rpe) : '')

  const { tier: loadedTier, exercises: loadedExercises } = exercisesFromDbRows(initialPost.workout_exercises)
  const [workoutTier, setWorkoutTier] = useState<WorkoutLogTier>(loadedTier)
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExerciseDraft[]>(loadedExercises)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  let profile: { username?: string; avatar_url?: string | null } | null = initialPost.profiles as any
  if (Array.isArray(profile)) profile = profile[0] || null
  const previewUsername = profile?.username || user?.email?.split('@')[0] || 'You'

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const type = file.type.startsWith('video/') ? 'video' : 'image'
    if (type === 'video') {
      if (mediaPreview?.startsWith('blob:')) URL.revokeObjectURL(mediaPreview)
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
    if (!user || (!content.trim() && !mediaPreview)) {
      setError('Add a caption or keep / replace media')
      return
    }

    setError('')
    setLoading(true)

    try {
      let mediaUrl: string | null = initialPost.media_url

      if (!mediaPreview) {
        mediaUrl = null
        if (initialPost.media_url) {
          const oldBucket = initialPost.media_type === 'video' ? 'videos' : 'images'
          const oldPath = storageObjectPathFromUrl(initialPost.media_url, oldBucket)
          if (oldPath) await supabase.storage.from(oldBucket).remove([oldPath])
        }
      } else if (mediaFile && user) {
        if (initialPost.media_url) {
          const oldBucket = initialPost.media_type === 'video' ? 'videos' : 'images'
          const oldPath = storageObjectPathFromUrl(initialPost.media_url, oldBucket)
          if (oldPath) await supabase.storage.from(oldBucket).remove([oldPath])
        }

        const fileExt = mediaFile.name.split('.').pop() || 'jpg'
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const bucket = mediaType === 'video' ? 'videos' : 'images'

        const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, mediaFile)
        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from(bucket).getPublicUrl(fileName)
        mediaUrl = publicUrl
      }

      const updatePayload: any = {
        content: content.trim() || null,
        media_url: mediaUrl,
        media_type: mediaType,
        is_private: visibility === 'followers',
        is_log_only: visibility === 'log',
        is_pr_post: isPRPost,
        pr_exercise: isPRPost ? prExercise.trim() || null : null,
        pr_weight: isPRPost && prWeight ? parseFloat(prWeight) : null,
        pr_reps: isPRPost && prReps ? parseInt(prReps, 10) : null,
        pr_rpe: isPRPost && prRpe ? parseFloat(prRpe) : null,
      }

      const { error: updErr } = await (supabase.from('posts') as any)
        .update(updatePayload)
        .eq('id', initialPost.id)
        .eq('user_id', user.id)

      if (updErr) throw updErr

      await (supabase.from('workout_exercises') as any).delete().eq('post_id', initialPost.id)

      const workoutRows = buildWorkoutExerciseRows(workoutTier, workoutExercises, initialPost.id)
      if (workoutRows.length > 0) {
        await (supabase.from('workout_exercises') as any).insert(workoutRows)
      }

      router.push('/feed')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-14 bg-black">
      {cropSrc && (
        <ImageCropModal imageSrc={cropSrc} open={cropOpen} onClose={() => { setCropOpen(false); setCropSrc(null) }} onCropped={onCropDone} />
      )}

      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="ui-page-title mb-1">Edit post</h1>
          <p className="ui-subtitle mt-2">Update caption, media, visibility, or workout</p>
        </div>

        <PostDraftPreview
          username={previewUsername}
          avatarUrl={profile?.avatar_url}
          content={content}
          mediaPreview={mediaPreview}
          mediaType={mediaType}
          isPRPost={isPRPost}
          prExercise={prExercise}
          prWeight={prWeight}
          prReps={prReps}
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-6 py-4 rounded-[12px] font-medium text-sm">{error}</div>
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
            <div className="rounded-[12px] border-2 border-dashed border-white/10 p-12 text-center bg-white/[0.02] hover:border-white/30 transition-all">
              <label className="cursor-pointer flex flex-col items-center space-y-4">
                <Upload className="w-10 h-10 text-white/60" />
                <p className="text-white font-semibold text-base">Replace photo or video</p>
                <div className="flex items-center space-x-4 text-sm text-white/50">
                  <span className="flex items-center gap-1">
                    <ImageIcon className="w-4 h-4" /> Images (crop)
                  </span>
                  <span className="flex items-center gap-1">
                    <Video className="w-4 h-4" /> Video
                  </span>
                </div>
                <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
              </label>
            </div>
          )}

          <div className="rounded-[12px] border border-white/5 p-6 bg-white/[0.02]">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPRPost}
                onChange={(e) => setIsPRPost(e.target.checked)}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-white"
              />
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-white" />
                <span className="text-white font-semibold">PR post</span>
              </div>
            </label>
          </div>

          {isPRPost && (
            <div className="rounded-[12px] border border-white/20 p-6 space-y-4 bg-white/5">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">Exercise</label>
                <ExerciseAutocomplete value={prExercise} onChange={setPRExercise} placeholder="e.g. Squat" className="input-field w-full" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Weight (lbs)</label>
                  <input type="number" value={prWeight} onChange={(e) => setPRWeight(e.target.value)} className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-2">Reps</label>
                  <input type="number" value={prReps} onChange={(e) => setPRReps(e.target.value)} className="input-field w-full" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">RPE (optional)</label>
                <select value={prRpe} onChange={(e) => setPrRpe(e.target.value)} className="input-field w-full">
                  <option value="">Not specified</option>
                  {[10, 9.5, 9, 8.5, 8, 7.5, 7].map((v) => (
                    <option key={v} value={v}>
                      RPE {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <WorkoutForm tier={workoutTier} onTierChange={setWorkoutTier} exercises={workoutExercises} onChange={setWorkoutExercises} />

          <PrivacyToggle visibility={visibility} onChange={setVisibility} />

          <div>
            <label htmlFor="content" className="block text-sm font-bold text-gray-300 mb-3">
              Caption
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              maxLength={500}
              className="input-field w-full resize-none text-lg"
              placeholder="Caption..."
            />
          </div>

          <div className="flex gap-4">
            <button type="button" onClick={() => router.back()} className="flex-1 btn btn-secondary btn-block">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (!content.trim() && !mediaPreview)}
              className="flex-1 btn btn-primary btn-block flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function EditPostClient({ initialPost }: { initialPost: InitialPost }) {
  return <EditPostInner initialPost={initialPost} />
}

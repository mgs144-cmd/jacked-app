'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  const [isDeadcemberPost, setIsDeadcemberPost] = useState(false)
  const [deadcemberVolume, setDeadcemberVolume] = useState('')
  const [deadliftVariation, setDeadliftVariation] = useState('')
  const [deadliftSets, setDeadliftSets] = useState<Array<{ weight: number; reps: number }>>([{ weight: 0, reps: 0 }])
  const [deadcemberVisibility, setDeadcemberVisibility] = useState<'full' | 'volume-only' | 'private'>('full')
  const [prExercise, setPRExercise] = useState('')
  const [prWeight, setPRWeight] = useState('')
  const [prReps, setPRReps] = useState('')
  const [workoutExercises, setWorkoutExercises] = useState<Array<{ exercise_name: string; sets_data: Array<{ weight: number | null; reps: number | null }>; order_index: number }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const { user } = useAuth()

  // Check if coming from Deadcember page
  useEffect(() => {
    const isDeadcemberParam = searchParams.get('deadcember')
    if (isDeadcemberParam === 'true') {
      setIsDeadcemberPost(true)
    }
  }, [searchParams])

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

  // Auto-calculate Deadcember volume from sets
  useEffect(() => {
    if (isDeadcemberPost && deadliftSets.length > 0) {
      const totalVolume = deadliftSets.reduce((sum, set) => {
        return sum + (set.weight * set.reps)
      }, 0)
      setDeadcemberVolume(totalVolume.toString())
    }
  }, [deadliftSets, isDeadcemberPost])

  const addDeadliftSet = () => {
    setDeadliftSets([...deadliftSets, { weight: 0, reps: 0 }])
  }

  const removeDeadliftSet = (index: number) => {
    if (deadliftSets.length > 1) {
      setDeadliftSets(deadliftSets.filter((_, i) => i !== index))
    }
  }

  const updateDeadliftSet = (index: number, field: 'weight' | 'reps', value: number) => {
    const newSets = [...deadliftSets]
    newSets[index][field] = value
    setDeadliftSets(newSets)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // For private Deadcember tracking, we still need volume
    if (isDeadcemberPost && deadcemberVisibility === 'private' && !deadcemberVolume) {
      setError('Please enter your deadlift volume for tracking')
      return
    }
    
    // For public posts, require content or media (unless it's a Deadcember post with volume)
    if (deadcemberVisibility !== 'private' && !isDeadcemberPost && (!user || (!content.trim() && !mediaFile))) {
      setError('Please add some content or media')
      return
    }
    
    // For Deadcember posts, require deadlift data
    if (isDeadcemberPost && !deadcemberVolume && deadliftSets.every(set => set.weight === 0 && set.reps === 0)) {
      setError('Please add deadlift data for your Deadcember post')
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
        is_private: deadcemberVisibility === 'private' ? true : visibility === 'followers',
        is_log_only: deadcemberVisibility === 'private' ? true : visibility === 'log',
        is_pr_post: isPRPost,
        pr_exercise: isPRPost ? prExercise.trim() : null,
        pr_weight: isPRPost && prWeight ? parseFloat(prWeight) : null,
        pr_reps: isPRPost && prReps ? parseInt(prReps) : null,
        is_deadcember_post: isDeadcemberPost,
        deadcember_volume: isDeadcemberPost && deadcemberVolume ? parseFloat(deadcemberVolume) : null,
      }

      // Add deadlift details only if visibility is 'full'
      if (isDeadcemberPost && deadcemberVisibility === 'full') {
        try {
          postInsertData.deadlift_variation = deadliftVariation || null
          // Store sets as JSON
          postInsertData.deadlift_sets = deadliftSets.filter(s => s.weight > 0 && s.reps > 0)
        } catch (e) {
          console.log('deadlift columns not available')
        }
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

          <div className="rounded-[12px] border border-white/5 p-6 bg-white/[0.02]" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isDeadcemberPost}
                onChange={(e) => setIsDeadcemberPost(e.target.checked)}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-[#ff5555] focus:ring-[#ff5555] focus:ring-offset-0"
              />
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span className="text-white font-semibold">This is a Deadcember Post</span>
              </div>
            </label>
            <p className="text-xs text-[#a1a1a1] mt-2 ml-8">Track your December deadlift volume</p>
          </div>

          {isDeadcemberPost && (
            <div className="rounded-[12px] border border-amber-500/30 p-6 space-y-4 bg-amber-500/5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div className="flex items-center space-x-2 mb-4">
                <Trophy className="w-6 h-6 text-amber-400" />
                <h3 className="text-white font-semibold text-lg">Deadcember Details</h3>
              </div>

              <div className="rounded-lg p-4 space-y-3 bg-white/5">
                <label className="block text-sm font-medium text-[#a1a1a1] mb-3">Post visibility</label>
                <div className="space-y-2">
                  <label className="flex items-start space-x-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="deadcemberVisibility"
                      value="full"
                      checked={deadcemberVisibility === 'full'}
                      onChange={(e) => setDeadcemberVisibility('full')}
                      className="mt-1 w-4 h-4 text-primary focus:ring-primary"
                    />
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm group-hover:text-primary transition-colors">Show Full Details</p>
                      <p className="text-gray-500 text-xs mt-1">Post with set-by-set breakdown and total volume</p>
                    </div>
                  </label>
                  <label className="flex items-start space-x-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="deadcemberVisibility"
                      value="volume-only"
                      checked={deadcemberVisibility === 'volume-only'}
                      onChange={(e) => setDeadcemberVisibility('volume-only')}
                      className="mt-1 w-4 h-4 text-primary focus:ring-primary"
                    />
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm group-hover:text-primary transition-colors">Show Volume Only</p>
                      <p className="text-gray-500 text-xs mt-1">Post with just the total volume (no set details)</p>
                    </div>
                  </label>
                  <label className="flex items-start space-x-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="deadcemberVisibility"
                      value="private"
                      checked={deadcemberVisibility === 'private'}
                      onChange={(e) => setDeadcemberVisibility('private')}
                      className="mt-1 w-4 h-4 text-primary focus:ring-primary"
                    />
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm group-hover:text-primary transition-colors">Private Tracking Only</p>
                      <p className="text-gray-500 text-xs mt-1">Track volume privately (adds to your total + community total, no public post)</p>
                    </div>
                  </label>
                </div>
              </div>
              
              {/* Deadlift Variation */}
              <div>
                <label className="block text-sm font-medium text-[#a1a1a1] mb-2">Deadlift variation</label>
                <select
                  value={deadliftVariation}
                  onChange={(e) => setDeadliftVariation(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="">Select variation...</option>
                  <option value="Conventional Deadlift">Conventional Deadlift</option>
                  <option value="Sumo Deadlift">Sumo Deadlift</option>
                  <option value="Trap Bar Deadlift">Trap Bar Deadlift</option>
                  <option value="Romanian Deadlift">Romanian Deadlift (RDL)</option>
                  <option value="Stiff-Leg Deadlift">Stiff-Leg Deadlift</option>
                  <option value="Deficit Deadlift">Deficit Deadlift</option>
                  <option value="Rack Pull">Rack Pull</option>
                  <option value="Snatch Grip Deadlift">Snatch Grip Deadlift</option>
                </select>
              </div>

              {/* Sets Tracker */}
              <div>
                <label className="block text-sm font-medium text-[#a1a1a1] mb-3">Sets</label>
                <div className="space-y-3">
                  {deadliftSets.map((set, index) => (
                    <div key={index} className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/5">
                      <span className="text-gray-400 font-bold min-w-[60px]">Set {index + 1}</span>
                      <input
                        type="number"
                        value={set.weight || ''}
                        onChange={(e) => updateDeadliftSet(index, 'weight', parseFloat(e.target.value) || 0)}
                        placeholder="Weight"
                        min="0"
                        step="5"
                        className="input-field flex-1 py-2"
                      />
                      <span className="text-gray-500">lbs ×</span>
                      <input
                        type="number"
                        value={set.reps || ''}
                        onChange={(e) => updateDeadliftSet(index, 'reps', parseInt(e.target.value) || 0)}
                        placeholder="Reps"
                        min="1"
                        className="input-field flex-1 py-2"
                      />
                      <span className="text-gray-500">reps</span>
                      {deadliftSets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDeadliftSet(index)}
                          className="text-red-400 hover:text-red-300 p-2"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addDeadliftSet}
                    className="w-full btn-secondary py-3 text-sm font-bold"
                  >
                    + ADD SET
                  </button>
                </div>
              </div>

              {/* Auto-calculated Volume Display */}
              <div className="bg-yellow-950/20 border border-yellow-600/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 font-semibold">Total Volume:</span>
                  <span className="text-yellow-400 text-2xl font-black">
                    {deadcemberVolume ? parseFloat(deadcemberVolume).toLocaleString() : '0'} lbs
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {deadcemberVisibility === 'private' 
                    ? 'Tracked privately - contributes to totals only'
                    : deadcemberVisibility === 'volume-only'
                    ? 'Only total volume will be shown publicly'
                    : 'Full details will be shown in your post'}
                </p>
              </div>
            </div>
          )}

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

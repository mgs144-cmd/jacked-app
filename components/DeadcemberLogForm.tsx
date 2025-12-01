'use client'

import { useState, useEffect } from 'react'
import { Trophy, Loader2, Lock, Globe, EyeOff, Plus, X } from 'lucide-react'

interface Set {
  weight: string
  reps: string
}

interface DeadcemberLogFormProps {
  onSuccess?: () => void
}

type ExerciseVariation = 'deadlift' | 'paused_deadlift' | 'rdl' | 'sumo_deadlift' | 'deficit_deadlift'
type PrivacyOption = 'full' | 'volume_only' | 'silent'

export function DeadcemberLogForm({ onSuccess }: DeadcemberLogFormProps) {
  const [exerciseVariation, setExerciseVariation] = useState<ExerciseVariation>('deadlift')
  const [sets, setSets] = useState<Set[]>([{ weight: '', reps: '' }])
  const [caption, setCaption] = useState('')
  const [privacyOption, setPrivacyOption] = useState<PrivacyOption>('volume_only')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const exerciseLabels: Record<ExerciseVariation, string> = {
    deadlift: 'Deadlift',
    paused_deadlift: 'Paused Deadlift',
    rdl: 'RDL',
    sumo_deadlift: 'Sumo Deadlift',
    deficit_deadlift: 'Deficit Deadlift',
  }

  const calculateVolume = () => {
    return sets.reduce((total, set) => {
      const weight = parseFloat(set.weight) || 0
      const reps = parseInt(set.reps) || 0
      return total + (weight * reps)
    }, 0)
  }

  const addSet = () => {
    setSets([...sets, { weight: '', reps: '' }])
  }

  const removeSet = (index: number) => {
    if (sets.length > 1) {
      setSets(sets.filter((_, i) => i !== index))
    }
  }

  const updateSet = (index: number, field: 'weight' | 'reps', value: string) => {
    const newSets = [...sets]
    newSets[index] = { ...newSets[index], [field]: value }
    setSets(newSets)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate all sets
    const hasEmptySets = sets.some(set => !set.weight || !set.reps)
    if (hasEmptySets) {
      setError('Please fill in all weight and rep fields')
      return
    }

    const setsData = sets.map(set => ({
      weight: parseFloat(set.weight),
      reps: parseInt(set.reps),
    }))

    const hasInvalidValues = setsData.some(set => set.weight <= 0 || set.reps <= 0)
    if (hasInvalidValues) {
      setError('All weights and reps must be greater than 0')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/deadcember/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_type: exerciseVariation,
          sets: setsData,
          caption: caption.trim() || null,
          privacy_option: privacyOption,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to log workout')
      }

      // Reset form
      setSets([{ weight: '', reps: '' }])
      setCaption('')
      setError('')

      if (onSuccess) {
        onSuccess()
      }

      // Refresh page to show new post
      window.location.reload()
    } catch (err: any) {
      setError(err.message || 'Failed to log workout')
    } finally {
      setLoading(false)
    }
  }

  const volume = calculateVolume()

  return (
    <div className="bg-gradient-to-br from-red-950/30 via-gray-900/60 to-gray-900/60 backdrop-blur-sm rounded-2xl border-2 border-primary/50 p-6 glow-red-sm">
      <div className="flex items-center space-x-3 mb-6">
        <Trophy className="w-6 h-6 text-primary" />
        <h3 className="text-white font-black text-xl">Log Deadcember Workout</h3>
      </div>

      {error && (
        <div className="bg-red-950/50 border border-primary/50 text-red-400 px-4 py-3 rounded-xl mb-4 font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Exercise Variation */}
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">EXERCISE VARIATION</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {(['deadlift', 'paused_deadlift', 'rdl', 'sumo_deadlift', 'deficit_deadlift'] as ExerciseVariation[]).map((variation) => (
              <button
                key={variation}
                type="button"
                onClick={() => setExerciseVariation(variation)}
                className={`py-2.5 px-3 rounded-xl border-2 transition-all font-bold text-xs ${
                  exerciseVariation === variation
                    ? 'border-primary bg-primary/20 text-primary'
                    : 'border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600'
                }`}
              >
                {exerciseLabels[variation]}
              </button>
            ))}
          </div>
        </div>

        {/* Sets with Different Weights */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-bold text-gray-300">SETS</label>
            <button
              type="button"
              onClick={addSet}
              className="text-primary hover:text-primary/80 transition-colors flex items-center space-x-1 text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>ADD SET</span>
            </button>
          </div>
          <div className="space-y-2">
            {sets.map((set, index) => (
              <div key={index} className="bg-gray-900/60 rounded-lg p-3 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-400">SET {index + 1}</span>
                  {sets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSet(index)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">WEIGHT (lbs)</label>
                    <input
                      type="number"
                      value={set.weight}
                      onChange={(e) => updateSet(index, 'weight', e.target.value)}
                      placeholder="225"
                      min="0"
                      step="0.5"
                      className="input-field w-full text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1">REPS</label>
                    <input
                      type="number"
                      value={set.reps}
                      onChange={(e) => updateSet(index, 'reps', e.target.value)}
                      placeholder="5"
                      min="1"
                      className="input-field w-full text-sm"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Volume Display */}
        {volume > 0 && (
          <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-bold text-sm">TOTAL VOLUME</span>
              <span className="text-primary font-black text-2xl">{volume.toLocaleString()} lbs</span>
            </div>
          </div>
        )}

        {/* Caption (Optional) */}
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">CAPTION (OPTIONAL)</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption to your Deadcember post..."
            rows={3}
            maxLength={500}
            className="input-field w-full resize-none"
          />
          <p className="text-gray-500 text-xs mt-1">{caption.length}/500</p>
        </div>

        {/* Privacy Options */}
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">PRIVACY</label>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setPrivacyOption('full')}
              className={`w-full py-3 px-4 rounded-xl border-2 transition-all font-bold flex items-center justify-center space-x-2 ${
                privacyOption === 'full'
                  ? 'border-primary bg-primary/20 text-primary'
                  : 'border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>SHOW ALL DETAILS</span>
            </button>
            <button
              type="button"
              onClick={() => setPrivacyOption('volume_only')}
              className={`w-full py-3 px-4 rounded-xl border-2 transition-all font-bold flex items-center justify-center space-x-2 ${
                privacyOption === 'volume_only'
                  ? 'border-primary bg-primary/20 text-primary'
                  : 'border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>VOLUME ONLY</span>
            </button>
            <button
              type="button"
              onClick={() => setPrivacyOption('silent')}
              className={`w-full py-3 px-4 rounded-xl border-2 transition-all font-bold flex items-center justify-center space-x-2 ${
                privacyOption === 'silent'
                  ? 'border-primary bg-primary/20 text-primary'
                  : 'border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600'
              }`}
            >
              <EyeOff className="w-4 h-4" />
              <span>SILENT (NO POST)</span>
            </button>
          </div>
          <p className="text-gray-500 text-xs mt-2">
            {privacyOption === 'full' && 'Everyone can see your weights, sets, reps, and total volume.'}
            {privacyOption === 'volume_only' && 'Only your total volume is shown. Weights and sets are hidden, but still count towards totals.'}
            {privacyOption === 'silent' && 'No post is created. Your volume is added to totals silently.'}
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || sets.some(s => !s.weight || !s.reps)}
          className="w-full btn-primary py-4 text-base font-bold tracking-wide flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>LOGGING...</span>
            </>
          ) : (
            <>
              <Trophy className="w-5 h-5" />
              <span>LOG DEADCEMBER WORKOUT</span>
            </>
          )}
        </button>
      </form>
    </div>
  )
}

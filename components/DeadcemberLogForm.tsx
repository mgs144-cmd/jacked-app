'use client'

import { useState } from 'react'
import { Trophy, Loader2 } from 'lucide-react'

interface DeadcemberLogFormProps {
  onSuccess?: () => void
}

export function DeadcemberLogForm({ onSuccess }: DeadcemberLogFormProps) {
  const [exerciseType, setExerciseType] = useState<'deadlift' | 'rdl'>('deadlift')
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [sets, setSets] = useState('')
  const [caption, setCaption] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const calculateVolume = () => {
    const w = parseFloat(weight) || 0
    const r = parseInt(reps) || 0
    const s = parseInt(sets) || 0
    return w * r * s
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!weight || !reps || !sets) {
      setError('Please fill in all fields')
      return
    }

    const weightNum = parseFloat(weight)
    const repsNum = parseInt(reps)
    const setsNum = parseInt(sets)

    if (weightNum <= 0 || repsNum <= 0 || setsNum <= 0) {
      setError('All values must be greater than 0')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/deadcember/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_type: exerciseType,
          weight: weightNum,
          reps: repsNum,
          sets: setsNum,
          caption: caption.trim() || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to log workout')
      }

      // Reset form
      setWeight('')
      setReps('')
      setSets('')
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
        {/* Exercise Type */}
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">EXERCISE</label>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setExerciseType('deadlift')}
              className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all font-bold ${
                exerciseType === 'deadlift'
                  ? 'border-primary bg-primary/20 text-primary'
                  : 'border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600'
              }`}
            >
              DEADLIFT
            </button>
            <button
              type="button"
              onClick={() => setExerciseType('rdl')}
              className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all font-bold ${
                exerciseType === 'rdl'
                  ? 'border-primary bg-primary/20 text-primary'
                  : 'border-gray-700 bg-gray-800/40 text-gray-400 hover:border-gray-600'
              }`}
            >
              RDL
            </button>
          </div>
        </div>

        {/* Weight, Reps, Sets */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">WEIGHT (lbs)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="225"
              min="0"
              step="0.5"
              className="input-field w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">REPS</label>
            <input
              type="number"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder="5"
              min="1"
              className="input-field w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">SETS</label>
            <input
              type="number"
              value={sets}
              onChange={(e) => setSets(e.target.value)}
              placeholder="3"
              min="1"
              className="input-field w-full"
              required
            />
          </div>
        </div>

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

        {/* Volume Display */}
        {volume > 0 && (
          <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-bold text-sm">TOTAL VOLUME</span>
              <span className="text-primary font-black text-2xl">{volume.toLocaleString()} lbs</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !weight || !reps || !sets}
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


'use client'

import { useState, useEffect } from 'react'
import { Trophy, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'

export function DeadcemberPRTracker() {
  const { user } = useAuth()
  const supabase = createClient()
  const [startingPR, setStartingPR] = useState('')
  const [endingPR, setEndingPR] = useState('')
  const [progress, setProgress] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const isDecember = currentMonth === 12

  useEffect(() => {
    if (!user) return
    loadPRData()
  }, [user])

  const loadPRData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error: fetchError } = await supabase
        .from('deadcember_prs')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', currentYear)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      if (data) {
        setStartingPR(data.starting_pr ? String(data.starting_pr) : '')
        setEndingPR(data.ending_pr ? String(data.ending_pr) : '')
        setProgress(data.progress)
      }
    } catch (err: any) {
      console.error('Error loading PR data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveStartingPR = async () => {
    if (!user || !startingPR) return
    setSaving(true)
    setError('')

    try {
      const prValue = parseFloat(startingPR)
      if (prValue <= 0) {
        setError('PR must be greater than 0')
        return
      }

      const { error: upsertError } = await supabase
        .from('deadcember_prs')
        .upsert({
          user_id: user.id,
          year: currentYear,
          starting_pr: prValue,
        }, {
          onConflict: 'user_id,year'
        })

      if (upsertError) throw upsertError

      await loadPRData()
    } catch (err: any) {
      setError(err.message || 'Failed to save starting PR')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveEndingPR = async () => {
    if (!user || !endingPR) return
    setSaving(true)
    setError('')

    try {
      const prValue = parseFloat(endingPR)
      if (prValue <= 0) {
        setError('PR must be greater than 0')
        return
      }

      const { error: upsertError } = await supabase
        .from('deadcember_prs')
        .upsert({
          user_id: user.id,
          year: currentYear,
          ending_pr: prValue,
        }, {
          onConflict: 'user_id,year'
        })

      if (upsertError) throw upsertError

      await loadPRData()
    } catch (err: any) {
      setError(err.message || 'Failed to save ending PR')
    } finally {
      setSaving(false)
    }
  }

  if (!isDecember) {
    return null
  }

  if (loading) {
    return (
      <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800/60 p-6">
        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-red-950/30 via-gray-900/60 to-gray-900/60 backdrop-blur-sm rounded-2xl border-2 border-primary/50 p-6 glow-red-sm">
      <div className="flex items-center space-x-3 mb-6">
        <Trophy className="w-6 h-6 text-primary" />
        <h3 className="text-white font-black text-xl">Deadcember PR Progress</h3>
      </div>

      {error && (
        <div className="bg-red-950/50 border border-primary/50 text-red-400 px-4 py-3 rounded-xl mb-4 font-medium">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Starting PR */}
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">Starting PR (Beginning of December)</label>
          <div className="flex space-x-3">
            <input
              type="number"
              value={startingPR}
              onChange={(e) => setStartingPR(e.target.value)}
              placeholder="e.g., 315"
              min="0"
              step="0.5"
              className="input-field flex-1"
              disabled={!!progress && progress !== null}
            />
            <button
              onClick={handleSaveStartingPR}
              disabled={!startingPR || saving || (progress !== null && startingPR)}
              className="btn-secondary px-6 font-bold disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SAVE'}
            </button>
          </div>
        </div>

        {/* Ending PR */}
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">Ending PR (End of December)</label>
          <div className="flex space-x-3">
            <input
              type="number"
              value={endingPR}
              onChange={(e) => setEndingPR(e.target.value)}
              placeholder="e.g., 335"
              min="0"
              step="0.5"
              className="input-field flex-1"
            />
            <button
              onClick={handleSaveEndingPR}
              disabled={!endingPR || saving}
              className="btn-secondary px-6 font-bold disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SAVE'}
            </button>
          </div>
        </div>

        {/* Progress Display */}
        {progress !== null && (
          <div className="bg-gray-900/60 rounded-xl p-4 border border-gray-800">
            <div className="text-center">
              <p className="text-gray-400 font-bold text-sm mb-2">PR PROGRESS</p>
              <p className={`text-3xl font-black ${progress > 0 ? 'text-green-400' : progress < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                {progress > 0 ? '+' : ''}{progress.toFixed(1)} lbs
              </p>
              {progress > 0 && (
                <p className="text-green-400 text-sm mt-2 font-semibold">🎉 You increased your PR!</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [checking, setChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const finishCheck = () => {
      if (!cancelled) setChecking(false)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      if (session) {
        setReady(true)
        finishCheck()
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return
      if (session) {
        setReady(true)
        finishCheck()
      }
    })

    timeoutId = setTimeout(async () => {
      if (cancelled) return
      const { data: { session } } = await supabase.auth.getSession()
      if (session) setReady(true)
      finishCheck()
    }, 1200)

    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Use at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { error: upd } = await supabase.auth.updateUser({ password })
      if (upd) throw upd
      await supabase.auth.signOut()
      router.push('/auth/login?reset=1')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not update password')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-black text-center">
        <p className="text-white/80 font-medium mb-2">Link invalid or expired</p>
        <p className="text-white/50 text-sm mb-6 max-w-sm">
          Request a new reset email from the sign-in page. Make sure you open the link in the same browser and that your Supabase project allows redirect to this site&apos;s{' '}
          <span className="font-mono text-white/70">/auth/update-password</span> URL.
        </p>
        <Link href="/auth/forgot-password" className="text-white font-medium hover:underline">
          Try again
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-black">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="ui-page-title">Choose a new password</h1>
          <p className="ui-subtitle mt-2">Then sign in with your email and this password.</p>
        </div>

        <div className="bg-white/[0.03] rounded-2xl p-8 border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/70 mb-1.5">
                New password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white"
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-white/70 mb-1.5">
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white"
                placeholder="Repeat password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-block btn-round gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving…
                </>
              ) : (
                'Update password'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

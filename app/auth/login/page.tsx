'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import { JackedLogo } from '@/components/JackedLogo'
import { safeInternalRedirectPath } from '@/lib/groupInviteLink'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetBanner, setResetBanner] = useState('')
  const [inviteBanner, setInviteBanner] = useState('')
  const [postLoginRedirect, setPostLoginRedirect] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const q = new URLSearchParams(window.location.search)
    if (q.get('reset') === '1') {
      setResetBanner('Password updated. Sign in with your email and new password.')
    }
    const rawRedirect = q.get('redirect')
    const safe = safeInternalRedirectPath(rawRedirect)
    if (safe) {
      setPostLoginRedirect(safe)
      if (safe.includes('/community/join')) {
        setInviteBanner('You have a group invite — sign in below to join.')
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      if (data.user) {
        let next: string | null = postLoginRedirect ? safeInternalRedirectPath(postLoginRedirect) : null
        if (!next && typeof window !== 'undefined') {
          const raw = new URLSearchParams(window.location.search).get('redirect')
          next = safeInternalRedirectPath(raw)
        }
        router.push(next || '/feed')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-black">
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center">
          <h1 className="mb-3">
            <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
              <JackedLogo size="large" />
            </Link>
          </h1>
          <p className="ui-subtitle text-base mt-2">
            Welcome back, lifter
          </p>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-5">
            {resetBanner && (
              <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-200/90 px-4 py-3 rounded-lg text-sm">
                {resetBanner}
              </div>
            )}
            {inviteBanner && (
              <div className="bg-sky-500/10 border border-sky-500/25 text-sky-200/90 px-4 py-3 rounded-lg text-sm">
                {inviteBanner}
              </div>
            )}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-1.5">
                  Email <span className="text-white/45 font-normal">(sign-in uses email, not username)</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-colors"
                  placeholder="you@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/70 mb-1.5">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="text-right">
              <Link 
                href="/auth/forgot-password" 
                className="text-sm text-white font-medium hover:text-white/80 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-block btn-round gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/60">
            Don&apos;t have an account?{' '}
            <Link
              href={
                postLoginRedirect
                  ? `/auth/signup?redirect=${encodeURIComponent(postLoginRedirect)}`
                  : '/auth/signup'
              }
              className="text-white font-medium hover:text-white/80 transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>

        <p className="text-center text-white/40 text-sm">
          The social network for lifters
        </p>
      </div>
    </div>
  )
}

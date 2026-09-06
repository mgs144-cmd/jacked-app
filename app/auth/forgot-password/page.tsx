'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const redirectTo = `${origin}/auth/update-password`

      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      })

      if (resetErr) throw resetErr

      setInfo(
        'If an account exists for that email, we sent a reset link. Check your inbox and spam folder. The link opens this app so you can choose a new password.'
      )
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-black">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
          <h1 className="ui-page-title">Reset password</h1>
          <p className="ui-subtitle mt-2">
            Enter the email you used for Jacked. We&apos;ll send a link to set a new password.
          </p>
        </div>

        <div className="bg-white/[0.03] rounded-2xl p-8 border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}
            {info && (
              <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-200/90 px-4 py-3 rounded-lg text-sm">{info}</div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                placeholder="you@email.com"
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
                  Sending…
                </>
              ) : (
                'Send reset link'
              )}
            </button>
          </form>

          <p className="mt-6 text-xs text-white/45 leading-relaxed">
            In Supabase Dashboard → Authentication → URL configuration, add this redirect URL for production and local dev:{' '}
            <span className="text-white/70 font-mono break-all">…/auth/update-password</span>
          </p>
        </div>
      </div>
    </div>
  )
}

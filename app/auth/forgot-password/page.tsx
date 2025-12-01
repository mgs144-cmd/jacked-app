'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Mail, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (resetError) throw resetError

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/3 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Logo and header */}
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-logo tracking-[0.2em] text-center text-white mb-4 text-glow">
            JACKED
          </h1>
          <p className="text-gray-400 text-lg font-medium">
            Reset your password
          </p>
        </div>

        {/* Form */}
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-800/60 card-elevated">
          {success ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-green-900/50 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
                  <p className="text-gray-400">
                    We&apos;ve sent a password reset link to <strong className="text-white">{email}</strong>
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Click the link in the email to reset your password. The link will expire in 1 hour.
                  </p>
                </div>
              </div>
              <Link
                href="/auth/login"
                className="block w-full btn-primary text-center py-4 text-base font-bold tracking-wide"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-950/50 border border-primary/50 text-red-400 px-4 py-3 rounded-xl text-sm font-medium backdrop-blur-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <p className="text-gray-400 text-sm">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </p>
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-gray-300 mb-2 tracking-wide">
                    EMAIL ADDRESS
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field w-full pl-10"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center space-x-2 py-4 text-base font-bold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>SENDING...</span>
                  </>
                ) : (
                  <span>SEND RESET LINK</span>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Remember your password?{' '}
              <Link 
                href="/auth/login" 
                className="text-primary font-bold hover:text-white transition-colors hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer tagline */}
        <p className="text-center text-gray-600 text-sm font-medium">
          The social network for lifters
        </p>
      </div>
    </div>
  )
}


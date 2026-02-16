'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || null,
            username: username || null,
          },
        },
      })

      if (signUpError) throw signUpError

      if (data.user) {
        const userId = data.user.id
        
        // Update/create profile
        try {
          const { error: updateError } = await (supabase
            .from('profiles') as any)
            .update({
              username: username || null,
              full_name: fullName || null,
              email: email, // Store email in profiles for admin dashboard
            })
            .eq('id', userId)

          if (updateError) {
            const { error: insertError } = await (supabase
              .from('profiles') as any)
              .insert({
                id: userId,
                username: username || null,
                full_name: fullName || null,
                email: email, // Store email in profiles for admin dashboard
              })

            if (insertError) {
              console.error('Profile insert error:', insertError)
              // Continue anyway - profile might already exist
            }
          }

          // Immediately redirect to payment checkout
          try {
            const response = await fetch('/api/create-onboarding-checkout', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
            })

            const checkoutData = await response.json()

            if (!response.ok) {
              console.error('Checkout API error:', {
                status: response.status,
                statusText: response.statusText,
                data: checkoutData,
              })
              setError(checkoutData.error || 'Failed to start payment process. Please try again or contact support.')
              setLoading(false)
              // Still redirect to payment required page as fallback
              setTimeout(() => {
                router.push('/payment-required')
              }, 3000)
              return
            }

            if (checkoutData.url) {
              // Success - redirect to Stripe checkout
              window.location.href = checkoutData.url
              return
            } else {
              // No URL - redirect to payment required page
              console.error('No checkout URL in response:', checkoutData)
              setError('Payment system error. Please try again or contact support.')
              setLoading(false)
              setTimeout(() => {
                router.push('/payment-required')
              }, 3000)
              return
            }
          } catch (fetchError: any) {
            console.error('Network error creating checkout:', fetchError)
            setError('Network error. Please check your connection and try again.')
            setLoading(false)
            setTimeout(() => {
              router.push('/payment-required')
            }, 3000)
            return
          }
        } catch (err: any) {
          console.error('Signup flow error:', err)
          setError(err.message || 'Failed to complete signup. Please try again.')
          setLoading(false)
          // Still redirect to payment page as fallback
          setTimeout(() => {
            router.push('/payment-required')
          }, 2000)
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
      setLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0d0a08 0%, #1a0f0a 50%, #2d1510 100%)' }}
    >
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 
              className="text-4xl md:text-5xl font-bold tracking-wider uppercase text-white mb-3 hover:opacity-90 transition-opacity"
              style={{ fontFamily: 'var(--font-black-ops-one)' }}
            >
              JACKED
            </h1>
          </Link>
          <p className="text-white/70 text-base font-normal">
            Join the community
          </p>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-white/70 mb-1.5">Full name (optional)</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#ff5555] focus:border-transparent"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-white/70 mb-1.5">Username (optional)</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#ff5555] focus:border-transparent"
                  placeholder="Choose a username"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-1.5">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#ff5555] focus:border-transparent"
                  placeholder="you@email.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/70 mb-1.5">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#ff5555] focus:border-transparent"
                  placeholder="Min. 6 characters"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#ff5555] hover:bg-[#ff4444] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/60">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-[#ff5555] font-medium hover:text-[#ff6666] transition-colors">Sign in</Link>
          </p>
        </div>

        <div className="flex items-center justify-center gap-6 text-xs text-white/40">
          <Link href="/terms" className="hover:text-white/60 transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
          <Link href="/refund" className="hover:text-white/60 transition-colors">Refund</Link>
        </div>
      </div>
    </div>
  )
}

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
            })
            .eq('id', userId)

          if (updateError) {
            const { error: insertError } = await (supabase
              .from('profiles') as any)
              .insert({
                id: userId,
                username: username || null,
                full_name: fullName || null,
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/3 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-logo tracking-[0.2em] text-center text-white mb-4 text-glow">
            JACKED
          </h1>
          <p className="text-gray-400 text-lg font-medium">
            Join the community
          </p>
        </div>

        {/* Signup form */}
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-800/60 card-elevated">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-950/50 border border-primary/50 text-red-400 px-4 py-3 rounded-xl text-sm font-medium backdrop-blur-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-bold text-gray-300 mb-2 tracking-wide">
                  FULL NAME (OPTIONAL)
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-field w-full"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-bold text-gray-300 mb-2 tracking-wide">
                  USERNAME (OPTIONAL)
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field w-full"
                  placeholder="Choose a username"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-bold text-gray-300 mb-2 tracking-wide">
                  EMAIL ADDRESS
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field w-full"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-bold text-gray-300 mb-2 tracking-wide">
                  PASSWORD
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  className="input-field w-full"
                  placeholder="Min. 6 characters"
                />
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
                  <span>CREATING ACCOUNT...</span>
                </>
              ) : (
                <span>CREATE ACCOUNT</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{' '}
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

'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Loader2, Lock, ExternalLink, Instagram, Globe, Mail } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface PaymentRequiredClientProps {
  userId: string
}

export function PaymentRequiredClient({ userId }: PaymentRequiredClientProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  // Check payment status periodically and redirect if paid
  useEffect(() => {
    let checkCount = 0
    const maxChecks = 30 // Check for up to 60 seconds (30 * 2s)
    
    const checkPaymentStatus = async () => {
      try {
        checkCount++
        
        // First, check database
        const { data: profile, error } = await (supabase
          .from('profiles') as any)
          .select('has_paid_onboarding, onboarding_payment_id')
          .eq('id', userId)
          .single()

        if (error) {
          console.error('Error checking payment status:', error)
          return
        }

        if ((profile as any)?.has_paid_onboarding) {
          // User has paid, redirect to feed immediately
          console.log('✅ Payment confirmed in database, redirecting to feed')
          window.location.href = '/feed'
          return
        }

        // Check URL params for payment success
        const urlParams = new URLSearchParams(window.location.search)
        const sessionId = urlParams.get('session_id')
        const paymentSuccess = urlParams.get('payment') === 'success'

        if (paymentSuccess && sessionId) {
          console.log(`[Check ${checkCount}] Payment success detected in URL, verifying with Stripe...`)
          // Verify payment directly with Stripe
          try {
            const verifyResponse = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ session_id: sessionId }),
            })

            const verifyData = await verifyResponse.json()
            
            if (verifyData.paid) {
              console.log('✅ Payment verified via Stripe API, redirecting...')
              // Force redirect
              window.location.href = '/feed'
              return
            } else {
              console.log(`[Check ${checkCount}] Payment not yet verified. Status:`, verifyData)
            }
          } catch (verifyErr) {
            console.error('Error verifying payment:', verifyErr)
          }
        }

        // Stop checking after max attempts
        if (checkCount >= maxChecks) {
          console.log('Stopped checking payment status after max attempts')
        }
      } catch (err) {
        console.error('Error in payment status check:', err)
      }
    }

    // Check immediately
    checkPaymentStatus()

    // Check every 2 seconds (for webhook processing)
    const interval = setInterval(() => {
      if (checkCount < maxChecks) {
        checkPaymentStatus()
      } else {
        clearInterval(interval)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [userId, supabase])

  const handleStartPayment = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/create-onboarding-checkout', {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        const errorMsg = data.error || data.message || 'Failed to create checkout session'
        console.error('Checkout error:', data)
        throw new Error(errorMsg)
      }

      const { url } = await response.json()
      
      if (url) {
        window.location.href = url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start payment. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-lg px-4 py-8">
      <div className="space-y-6">
        {/* Main Payment Card */}
        <div className="bg-gray-900/80 backdrop-blur-md rounded-3xl border border-gray-800/50 p-10 text-center shadow-2xl">
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg">
              <Lock className="w-12 h-12 text-white" />
            </div>
          </div>

          <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Welcome to Jacked</h1>
          <p className="text-lg font-semibold text-gray-300 mb-6">One-Time Access Fee</p>
          <div className="bg-black/30 rounded-2xl p-6 mb-6">
            <div className="text-5xl font-black text-white mb-2">$0.99</div>
            <p className="text-gray-400 text-sm">One-time • Lifetime Access</p>
          </div>

          {/* Important Notice */}
          <div className="bg-yellow-950/20 border border-yellow-600/30 rounded-2xl p-5 mb-8 text-left">
            <p className="text-yellow-400 text-sm font-bold mb-2.5 flex items-center gap-2">
              <span className="text-lg">⚠️</span> Important
            </p>
            <p className="text-yellow-100/90 text-sm leading-relaxed">
              <strong>Only pay once.</strong> If you do not immediately receive access after payment, please do not pay again. 
              Contact us at <a href="mailto:jackedapp@gmail.com" className="text-yellow-300 underline hover:text-yellow-200 font-semibold">jackedapp@gmail.com</a> and we will resolve the issue and grant you access right away.
            </p>
          </div>

          {error && (
            <div className="bg-red-950/50 border border-primary/50 text-red-400 px-4 py-3 rounded-xl mb-6 font-medium">
              {error}
            </div>
          )}

          <button
            onClick={handleStartPayment}
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white py-5 rounded-2xl text-lg font-black tracking-wide flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>PROCESSING...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-6 h-6" />
                <span>COMPLETE PAYMENT</span>
              </>
            )}
          </button>

          <p className="text-gray-500 text-xs mt-4 flex items-center justify-center gap-2">
            <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-[10px]">✓</span>
            Secure payment powered by Stripe
          </p>
        </div>

        {/* Learn More Section */}
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-3xl border border-gray-800/50 p-8 shadow-xl">
          <h2 className="text-xl font-black text-white mb-3 flex items-center gap-2">
            <span className="text-2xl">💪</span> Learn More
          </h2>
          
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            Not sure yet? Check out our website and Instagram to see what Jacked is all about.
          </p>

          <div className="space-y-3">
            {/* Website Link */}
            <a
              href="https://jackedlifting.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 bg-gray-800/40 hover:bg-gray-800/60 border border-gray-700/50 rounded-2xl transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-bold text-base">Visit Our Website</p>
                <p className="text-gray-400 text-xs">jackedlifting.com</p>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-500 group-hover:text-gray-300 transition-colors" />
            </a>

            {/* Instagram Link */}
            <a
              href="https://instagram.com/jackedlifters"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 bg-gray-800/40 hover:bg-gray-800/60 border border-gray-700/50 rounded-2xl transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-600 to-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <Instagram className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-bold text-base">Follow on Instagram</p>
                <p className="text-gray-400 text-xs">@jackedlifters</p>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-500 group-hover:text-gray-300 transition-colors" />
            </a>

            {/* Email Support */}
            <a
              href="mailto:jackedapp@gmail.com"
              className="flex items-center gap-4 p-4 bg-gray-800/40 hover:bg-gray-800/60 border border-gray-700/50 rounded-2xl transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-white font-bold text-base">Contact Support</p>
                <p className="text-gray-400 text-xs">jackedapp@gmail.com</p>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-500 group-hover:text-gray-300 transition-colors" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}


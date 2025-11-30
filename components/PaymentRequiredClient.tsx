'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Loader2, Lock } from 'lucide-react'
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
    const checkPaymentStatus = async () => {
      const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('has_paid_onboarding')
        .eq('id', userId)
        .single()

      if ((profile as any)?.has_paid_onboarding) {
        // User has paid, redirect to feed
        window.location.href = '/feed'
      }
    }

    // Check immediately
    checkPaymentStatus()

    // Check every 2 seconds (for webhook processing)
    const interval = setInterval(checkPaymentStatus, 2000)

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
    <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border-2 border-primary/50 p-8 text-center glow-red-sm">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center">
              <Lock className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-black text-white mb-4">Payment Required</h1>
          <p className="text-gray-400 mb-2">
            To use Jacked, you need to complete a one-time $0.99 payment.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            This is a one-time charge to create your account and access all features.
          </p>

          {error && (
            <div className="bg-red-950/50 border border-primary/50 text-red-400 px-4 py-3 rounded-xl mb-6 font-medium">
              {error}
            </div>
          )}

          <button
            onClick={handleStartPayment}
            disabled={loading}
            className="w-full btn-primary py-4 text-base font-bold tracking-wide flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>LOADING...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                <span>PAY $0.99 TO CONTINUE</span>
              </>
            )}
          </button>

          <p className="text-gray-600 text-xs mt-6">
            Secure payment powered by Stripe
          </p>
        </div>
      </div>
    </div>
  )
}


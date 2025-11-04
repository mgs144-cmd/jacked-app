'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers'
import { Navbar } from '@/components/Navbar'
import { Crown, Check } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function PremiumPage() {
  const [loading, setLoading] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    async function checkPremiumStatus() {
      const { data } = await supabase
        .from('profiles')
        .select('is_premium')
        .eq('id', user.id)
        .single()

      if (data) {
        setIsPremium(data.is_premium)
      }
    }

    checkPremiumStatus()
  }, [user, router, supabase])

  const handleSubscribe = async () => {
    if (!user) return

    setLoading(true)

    try {
      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      })

      const { sessionId } = await response.json()

      // Redirect to Stripe Checkout
      const stripe = await stripePromise
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId })
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pt-20">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <Crown className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4 text-gray-900">Jacked+</h1>
          <p className="text-xl text-gray-600">
            Unlock premium features and support Jacked
          </p>
        </div>

        {isPremium ? (
          <div className="bg-white rounded-lg border-2 border-primary p-8 text-center">
            <Crown className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-gray-900">
              You're a Jacked+ Member!
            </h2>
            <p className="text-gray-600 mb-4">
              Thank you for supporting Jacked. Enjoy your premium perks.
            </p>
            <p className="text-sm text-gray-500">
              Manage your subscription in Settings
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
            <div className="text-center mb-8">
              <div className="text-5xl font-bold text-primary mb-2">$2.99</div>
              <div className="text-gray-600">per month</div>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start space-x-3">
                <Check className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-gray-900">Premium Badge</div>
                  <div className="text-sm text-gray-600">
                    Show off your Jacked+ status with a special badge
                  </div>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <Check className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-gray-900">Advanced Analytics</div>
                  <div className="text-sm text-gray-600">
                    Track your progress with detailed workout insights
                  </div>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <Check className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-gray-900">Priority Support</div>
                  <div className="text-sm text-gray-600">
                    Get help faster with dedicated support channels
                  </div>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <Check className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-gray-900">Exclusive Content</div>
                  <div className="text-sm text-gray-600">
                    Access premium workout plans and tips
                  </div>
                </div>
              </li>
            </ul>

            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full py-4 px-6 border border-transparent rounded-lg text-white font-semibold bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
            >
              {loading ? 'Processing...' : 'Subscribe to Jacked+'}
            </button>

            <p className="text-xs text-center text-gray-500 mt-4">
              Cancel anytime. Charged monthly.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}


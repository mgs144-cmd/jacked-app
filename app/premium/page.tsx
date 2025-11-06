'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { useAuth } from '@/app/providers'
import { Crown, Check, Zap, TrendingUp, Shield, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function PremiumPage() {
  const [loading, setLoading] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    const fetchPremiumStatus = async () => {
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('is_premium')
        .eq('id', user.id)
        .single()

      if (data) {
        setIsPremium((data as any).is_premium || false)
      }
    }

    fetchPremiumStatus()
  }, [user, supabase])

  const handleSubscribe = async () => {
    if (!user) return

    setLoading(true)
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-24">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-primary flex items-center justify-center glow-red">
              <Crown className="w-12 h-12 text-white fill-current" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight">Jacked+</h1>
          <p className="text-xl text-gray-400 font-medium">
            Unlock premium features and elevate your fitness journey
          </p>
        </div>

        {isPremium ? (
          // Already Premium View
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-sm rounded-3xl border-2 border-primary/50 p-10 text-center card-elevated glow-red">
            <Crown className="w-16 h-16 text-primary mx-auto mb-6 fill-current" />
            <h2 className="text-3xl font-black text-white mb-3">
              You&apos;re a Jacked+ Member!
            </h2>
            <p className="text-gray-300 text-lg mb-6 font-medium">
              Thank you for supporting Jacked. Enjoy your premium perks.
            </p>
            <div className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-primary rounded-xl glow-red-sm">
              <Shield className="w-5 h-5 text-white" />
              <span className="text-white font-bold text-sm tracking-wide">PREMIUM ACTIVE</span>
            </div>
            <p className="text-sm text-gray-500 mt-6 font-medium">
              Manage your subscription in Settings
            </p>
          </div>
        ) : (
          // Subscription View
          <div className="bg-gray-900/60 backdrop-blur-sm rounded-3xl border border-gray-800/60 overflow-hidden card-elevated">
            <div className="p-8 md:p-10">
              {/* Price */}
              <div className="text-center mb-10">
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <span className="text-gray-500 text-2xl font-bold line-through">$4.99</span>
                  <span className="text-6xl font-black bg-gradient-to-r from-primary to-red-400 bg-clip-text text-transparent">
                    $2.99
                  </span>
                </div>
                <p className="text-gray-400 text-lg font-semibold">per month</p>
                <p className="text-primary text-sm font-bold mt-2">LIMITED TIME OFFER</p>
              </div>

              {/* Features */}
              <ul className="space-y-5 mb-10">
                <li className="flex items-start space-x-4 group">
                  <div className="mt-1 flex-shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center glow-red-sm">
                      <Check className="w-5 h-5 text-white" strokeWidth={3} />
                    </div>
                  </div>
                  <div>
                    <div className="font-black text-white text-lg mb-1">Premium Badge</div>
                    <div className="text-gray-400 font-medium">
                      Stand out with an exclusive Jacked+ badge and crown icon on your profile
                    </div>
                  </div>
                </li>

                <li className="flex items-start space-x-4 group">
                  <div className="mt-1 flex-shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center glow-red-sm">
                      <TrendingUp className="w-5 h-5 text-white" strokeWidth={3} />
                    </div>
                  </div>
                  <div>
                    <div className="font-black text-white text-lg mb-1">Advanced Analytics</div>
                    <div className="text-gray-400 font-medium">
                      Track your progress with detailed workout insights and performance metrics
                    </div>
                  </div>
                </li>

                <li className="flex items-start space-x-4 group">
                  <div className="mt-1 flex-shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center glow-red-sm">
                      <Zap className="w-5 h-5 text-white" strokeWidth={3} />
                    </div>
                  </div>
                  <div>
                    <div className="font-black text-white text-lg mb-1">Priority Support</div>
                    <div className="text-gray-400 font-medium">
                      Get help faster with dedicated support channels and priority responses
                    </div>
                  </div>
                </li>

                <li className="flex items-start space-x-4 group">
                  <div className="mt-1 flex-shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center glow-red-sm">
                      <Crown className="w-5 h-5 text-white fill-current" strokeWidth={3} />
                    </div>
                  </div>
                  <div>
                    <div className="font-black text-white text-lg mb-1">Exclusive Content</div>
                    <div className="text-gray-400 font-medium">
                      Access premium workout plans, nutrition tips, and expert advice
                    </div>
                  </div>
                </li>
              </ul>

              {/* CTA Button */}
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full btn-primary py-5 text-lg font-black tracking-wide flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>PROCESSING...</span>
                  </>
                ) : (
                  <>
                    <Crown className="w-6 h-6 fill-current" />
                    <span>SUBSCRIBE TO JACKED+</span>
                  </>
                )}
              </button>

              <p className="text-xs text-center text-gray-500 mt-6 font-medium">
                Cancel anytime. Billed monthly. Secure payment via Stripe.
              </p>
            </div>

            {/* Bottom gradient accent */}
            <div className="h-2 bg-gradient-to-r from-primary via-red-500 to-primary"></div>
          </div>
        )}
      </div>
    </div>
  )
}

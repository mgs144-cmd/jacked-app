'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PostCard } from '@/components/PostCard'
import { FeedToggle } from '@/components/FeedToggle'
import { Loader2 } from 'lucide-react'

interface FeedClientProps {
  allPosts: any[]
  followingPosts: any[]
  publicPosts: any[]
}

export function FeedClient({ allPosts, followingPosts, publicPosts }: FeedClientProps) {
  const [view, setView] = useState<'friends' | 'community'>('community')
  const [verifyingPayment, setVerifyingPayment] = useState(false)
  const [paymentVerified, setPaymentVerified] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check for payment success and verify payment
  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    const paymentSuccess = searchParams.get('payment') === 'success'

    if (paymentSuccess && sessionId) {
      verifyPayment(sessionId)
    }
  }, [searchParams])

  const verifyPayment = async (sessionId: string) => {
    setVerifyingPayment(true)
    try {
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id: sessionId }),
      })

      const data = await response.json()

      if (data.success && data.paid) {
        setPaymentVerified(true)
        // Immediately redirect to feed (middleware will handle the rest)
        window.location.href = '/feed'
      } else {
        console.error('Payment verification failed:', data)
        // If verification fails, still try to redirect after a delay
        // The webhook might have processed it
        setTimeout(() => {
          window.location.href = '/feed'
        }, 2000)
      }
    } catch (error) {
      console.error('Error verifying payment:', error)
    } finally {
      setVerifyingPayment(false)
    }
  }

  const displayedPosts = view === 'friends' ? followingPosts : allPosts

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
      {/* Payment verification message */}
      {(verifyingPayment || paymentVerified) && (
        <div className="mb-6 bg-green-950/50 border border-green-500/50 text-green-400 px-6 py-4 rounded-xl flex items-center space-x-3">
          {verifyingPayment ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-semibold">Verifying your payment...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Payment verified! Your account is now active.</span>
            </>
          )}
        </div>
      )}

      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Your Feed
            </h1>
          </div>
        </div>
      </div>

      {/* Feed Toggle */}
      <FeedToggle view={view} onViewChange={setView} />

      {/* Posts */}
      {!displayedPosts || displayedPosts.length === 0 ? (
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800/60 p-12 text-center card-elevated">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
            <Flame className="w-10 h-10 text-gray-600" />
          </div>
          <p className="text-gray-400 text-lg font-semibold mb-2">
            {view === 'friends' ? 'No posts from friends yet' : 'No posts yet'}
          </p>
          <p className="text-gray-600 text-sm">
            {view === 'friends' 
              ? 'Follow some users to see their posts here!' 
              : 'Be the first to share your progress!'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {displayedPosts.map((post: any) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* Load more indicator */}
      {displayedPosts && displayedPosts.length >= 50 && (
        <div className="mt-8 text-center">
          <button className="btn-secondary px-8 py-3">
            <span className="font-bold">LOAD MORE</span>
          </button>
        </div>
      )}
    </div>
  )
}


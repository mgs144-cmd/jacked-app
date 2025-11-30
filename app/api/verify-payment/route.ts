import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { session_id } = await request.json()

    if (!session_id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    let checkoutSession: any

    // Handle both checkout session IDs (cs_) and payment intent IDs (pi_)
    if (session_id.startsWith('cs_')) {
      // It's a checkout session ID
      checkoutSession = await stripe.checkout.sessions.retrieve(session_id)
    } else if (session_id.startsWith('pi_')) {
      // It's a payment intent ID - find the checkout session
      const paymentIntent = await stripe.paymentIntents.retrieve(session_id)
      
      // Find the checkout session that created this payment intent
      // We'll search recent checkout sessions and match by payment_intent
      const sessions = await stripe.checkout.sessions.list({
        limit: 100,
        created: { gte: Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60) }, // Last 7 days
      })
      
      checkoutSession = sessions.data.find(
        (s: any) => s.payment_intent === session_id || s.payment_intent === paymentIntent.id
      )
      
      if (!checkoutSession) {
        // If we can't find the session, verify payment intent directly
        if (paymentIntent.status === 'succeeded' && paymentIntent.metadata?.user_id === session.user.id) {
          // Update directly from payment intent
          const { error } = await (supabase
            .from('profiles') as any)
            .update({ 
              has_paid_onboarding: true,
              onboarding_payment_id: session_id,
            })
            .eq('id', session.user.id)

          if (error) {
            console.error('Error updating payment status:', error)
            return NextResponse.json({ error: 'Failed to update payment status' }, { status: 500 })
          }

          return NextResponse.json({ 
            success: true,
            paid: true,
            message: 'Payment verified and account activated'
          })
        }
        
        return NextResponse.json({ 
          error: 'Could not find checkout session for this payment',
          payment_intent_status: paymentIntent.status
        }, { status: 404 })
      }
    } else {
      return NextResponse.json({ error: 'Invalid session ID format' }, { status: 400 })
    }

    // Verify this session belongs to the current user
    if (checkoutSession.client_reference_id !== session.user.id) {
      return NextResponse.json({ error: 'Session does not belong to user' }, { status: 403 })
    }

    // Check if payment was successful
    if (checkoutSession.payment_status === 'paid' && checkoutSession.metadata?.type === 'onboarding') {
      // Update user's payment status
      const { error } = await (supabase
        .from('profiles') as any)
        .update({ 
          has_paid_onboarding: true,
          onboarding_payment_id: session_id,
        })
        .eq('id', session.user.id)

      if (error) {
        console.error('Error updating payment status:', error)
        return NextResponse.json({ error: 'Failed to update payment status' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true,
        paid: true,
        message: 'Payment verified and account activated'
      })
    }

    return NextResponse.json({ 
      success: false,
      paid: checkoutSession.payment_status === 'paid',
      payment_status: checkoutSession.payment_status
    })
  } catch (error: any) {
    console.error('Error verifying payment:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to verify payment',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}


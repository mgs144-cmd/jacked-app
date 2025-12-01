import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
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

    // Retrieve the checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(session_id)

    console.log('Verifying payment for session:', {
      sessionId: session_id,
      paymentStatus: checkoutSession.payment_status,
      customerEmail: checkoutSession.customer_email,
      clientReferenceId: checkoutSession.client_reference_id,
    })

    // Check if payment was successful
    if (checkoutSession.payment_status === 'paid') {
      // Get user ID from session or email
      let userId = checkoutSession.client_reference_id || session.user.id

      // If no client_reference_id, try to find by email
      if (!userId && checkoutSession.customer_email) {
        const { data: profileByEmail } = await (supabase
          .from('profiles') as any)
          .select('id')
          .eq('email', checkoutSession.customer_email)
          .single()

        if (profileByEmail) {
          userId = profileByEmail.id
        }
      }

      if (!userId) {
        return NextResponse.json({ 
          error: 'Could not identify user',
          paid: false 
        }, { status: 400 })
      }

      // Verify the user matches
      if (userId !== session.user.id) {
        return NextResponse.json({ 
          error: 'Payment session does not match current user',
          paid: false 
        }, { status: 403 })
      }

      // Check if already marked as paid
      const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('has_paid_onboarding, onboarding_payment_id')
        .eq('id', userId)
        .single()

      if ((profile as any)?.has_paid_onboarding) {
        return NextResponse.json({ 
          paid: true,
          message: 'User already marked as paid',
          alreadyPaid: true
        })
      }

      // Mark as paid
      const { error: updateError } = await (supabase
        .from('profiles') as any)
        .update({ 
          has_paid_onboarding: true,
          onboarding_payment_id: session_id,
        })
        .eq('id', userId)

      if (updateError) {
        console.error('Error updating payment status:', updateError)
        return NextResponse.json({ 
          error: 'Failed to update payment status',
          paid: false 
        }, { status: 500 })
      }

      return NextResponse.json({ 
        paid: true,
        message: 'Payment verified and account activated'
      })
    }

    return NextResponse.json({ 
      paid: false,
      paymentStatus: checkoutSession.payment_status
    })
  } catch (error: any) {
    console.error('Error verifying payment:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to verify payment',
      paid: false 
    }, { status: 500 })
  }
}

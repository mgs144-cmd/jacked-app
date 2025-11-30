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

    // Check if user is admin
    const { data: adminProfile } = await (supabase
      .from('profiles') as any)
      .select('*')
      .eq('id', session.user.id)
      .single()

    const isAdmin = session.user.email === process.env.ADMIN_EMAIL || 
                    (adminProfile as any)?.is_admin === true ||
                    !process.env.ADMIN_EMAIL

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // Retrieve the checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)

    if (!checkoutSession) {
      return NextResponse.json({ error: 'Checkout session not found' }, { status: 404 })
    }

    const userId = checkoutSession.client_reference_id
    const paymentType = checkoutSession.metadata?.type

    if (!userId) {
      return NextResponse.json({ error: 'No user ID in checkout session' }, { status: 400 })
    }

    // Update user's payment status
    const { error } = await (supabase
      .from('profiles') as any)
      .update({ 
        has_paid_onboarding: true,
        onboarding_payment_id: sessionId,
      })
      .eq('id', userId)

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to update payment status',
        details: error.message 
      }, { status: 500 })
    }

    // Also set as admin if it's the admin email
    if (checkoutSession.customer_email === process.env.ADMIN_EMAIL || 
        checkoutSession.customer_email === 'jackedapp@gmail.com') {
      await (supabase
        .from('profiles') as any)
        .update({ is_admin: true })
        .eq('id', userId)
    }

    return NextResponse.json({ 
      success: true,
      message: `Payment verified for user ${userId}`,
      userId,
      sessionId,
      paymentStatus: checkoutSession.payment_status,
      customerEmail: checkoutSession.customer_email
    })
  } catch (error: any) {
    console.error('Error fixing payment:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to fix payment',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

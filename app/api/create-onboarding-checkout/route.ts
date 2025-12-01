import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe key is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is not configured')
      return NextResponse.json({ error: 'Payment system not configured' }, { status: 500 })
    }

    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already paid
    const { data: profile } = await supabase
      .from('profiles')
      .select('has_paid_onboarding')
      .eq('id', session.user.id)
      .single()

    if ((profile as any)?.has_paid_onboarding) {
      return NextResponse.json({ error: 'Already paid' }, { status: 400 })
    }

    // Create Stripe checkout session
    try {
      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Jacked App - One-Time Onboarding Fee',
                description: 'One-time $0.99 charge to create your account',
              },
              unit_amount: 99, // $0.99 in cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${request.nextUrl.origin}/payment-required?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${request.nextUrl.origin}/payment-required?canceled=true`,
        client_reference_id: session.user.id,
        customer_email: session.user.email || undefined, // Include email for fallback lookup
        metadata: {
          user_id: session.user.id,
          type: 'onboarding',
          email: session.user.email || '',
        },
      })

      if (!checkoutSession.url) {
        console.error('Stripe checkout session created but no URL returned')
        return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
      }

      return NextResponse.json({ url: checkoutSession.url })
    } catch (stripeError: any) {
      console.error('Stripe API error:', {
        message: stripeError.message,
        type: stripeError.type,
        code: stripeError.code,
        statusCode: stripeError.statusCode,
      })
      return NextResponse.json({ 
        error: stripeError.message || 'Failed to create checkout session',
        details: process.env.NODE_ENV === 'development' ? stripeError : undefined
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Unexpected error in checkout route:', error)
    return NextResponse.json({ 
      error: error.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

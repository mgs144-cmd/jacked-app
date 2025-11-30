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
      success_url: `${request.nextUrl.origin}/feed?payment=success`,
      cancel_url: `${request.nextUrl.origin}/auth/signup?canceled=true`,
      client_reference_id: session.user.id,
      metadata: {
        user_id: session.user.id,
        type: 'onboarding',
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    console.error('Stripe error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


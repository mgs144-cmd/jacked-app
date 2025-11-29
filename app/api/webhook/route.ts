import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  const supabase = await createClient()

  // Handle checkout session completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.client_reference_id
    const paymentType = session.metadata?.type

    if (userId) {
      if (paymentType === 'onboarding') {
        // Mark user as having paid onboarding fee
        const { error } = await (supabase
          .from('profiles') as any)
          .update({ 
            has_paid_onboarding: true,
            onboarding_payment_id: session.id,
          })
          .eq('id', userId)
        
        if (error) {
          console.error('Error updating onboarding payment status:', error)
        }
      } else {
        // Premium subscription
        const { error } = await (supabase
          .from('profiles') as any)
          .update({ is_premium: true })
          .eq('id', userId)
        
        if (error) {
          console.error('Error updating premium status:', error)
        }
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    // You'd need to store Stripe customer ID in your database to map back to user
    // For now, this is a placeholder
  }

  return NextResponse.json({ received: true })
}


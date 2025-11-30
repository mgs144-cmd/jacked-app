import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Allow GET requests for testing (returns webhook status)
export async function GET() {
  return NextResponse.json({ 
    status: 'Webhook endpoint is active',
    message: 'This endpoint only accepts POST requests from Stripe',
    configured: !!webhookSecret && !!process.env.STRIPE_SECRET_KEY
  })
}

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = headers()
  const signature = headersList.get('stripe-signature')

  console.log('Webhook received:', {
    hasSignature: !!signature,
    hasWebhookSecret: !!webhookSecret,
    timestamp: new Date().toISOString()
  })

  if (!signature) {
    console.error('Webhook: No signature header')
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  if (!webhookSecret) {
    console.error('Webhook: STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    console.log('Webhook event verified:', event.type, event.id)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', {
      message: err.message,
      type: err.type,
      hasBody: !!body,
      bodyLength: body.length
    })
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  const supabase = await createClient()

  // Handle checkout session completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.client_reference_id
    const paymentType = session.metadata?.type

    console.log('Processing checkout.session.completed:', {
      sessionId: session.id,
      userId,
      paymentType,
      paymentStatus: session.payment_status,
      customerEmail: session.customer_email
    })

    // Only process if payment was actually successful
    if (session.payment_status !== 'paid') {
      console.log(`Payment not completed yet. Status: ${session.payment_status}`)
      return NextResponse.json({ 
        received: true,
        message: `Payment status: ${session.payment_status}`,
        eventType: event.type
      })
    }

    if (userId) {
      if (paymentType === 'onboarding') {
        // Mark user as having paid onboarding fee
        const { error, data } = await (supabase
          .from('profiles') as any)
          .update({ 
            has_paid_onboarding: true,
            onboarding_payment_id: session.id,
          })
          .eq('id', userId)
          .select()
        
        if (error) {
          console.error('❌ Error updating onboarding payment status:', error)
          return NextResponse.json({ 
            error: 'Database update failed',
            details: error.message 
          }, { status: 500 })
        } else {
          console.log(`✅ User ${userId} automatically activated after payment`)
          return NextResponse.json({ 
            success: true,
            message: `User ${userId} payment processed and account activated`,
            userId,
            sessionId: session.id
          })
        }
      } else {
        // Premium subscription
        const { error } = await (supabase
          .from('profiles') as any)
          .update({ is_premium: true })
          .eq('id', userId)
        
        if (error) {
          console.error('Error updating premium status:', error)
          return NextResponse.json({ 
            error: 'Database update failed',
            details: error.message 
          }, { status: 500 })
        } else {
          console.log(`✅ User ${userId} premium status updated`)
          return NextResponse.json({ 
            success: true,
            message: `User ${userId} premium activated`,
            userId
          })
        }
      }
    } else {
      console.error('❌ No user ID in checkout session:', {
        sessionId: session.id,
        clientReferenceId: session.client_reference_id,
        metadata: session.metadata
      })
      return NextResponse.json({ 
        error: 'No user ID in session',
        sessionId: session.id
      }, { status: 400 })
    }
  }

  // Also handle payment_intent.succeeded as a fallback
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    const userId = paymentIntent.metadata?.user_id
    
    console.log('Processing payment_intent.succeeded:', {
      paymentIntentId: paymentIntent.id,
      userId,
      amount: paymentIntent.amount,
      metadata: paymentIntent.metadata
    })

    if (userId && paymentIntent.metadata?.type === 'onboarding') {
      const { error } = await (supabase
        .from('profiles') as any)
        .update({ 
          has_paid_onboarding: true,
          onboarding_payment_id: paymentIntent.id,
        })
        .eq('id', userId)

      if (error) {
        console.error('❌ Error updating payment status from payment_intent:', error)
      } else {
        console.log(`✅ User ${userId} activated via payment_intent webhook`)
      }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    // You'd need to store Stripe customer ID in your database to map back to user
    // For now, this is a placeholder
    console.log('Subscription deleted:', subscription.id)
  }

  // Return success for other event types
  return NextResponse.json({ 
    received: true,
    eventType: event.type,
    eventId: event.id
  })
}


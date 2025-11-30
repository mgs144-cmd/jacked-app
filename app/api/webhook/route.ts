import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import crypto from 'crypto'

const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET!

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = headers()
  const signature = headersList.get('paddle-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  // Verify Paddle webhook signature
  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex')
    
    if (signature !== expectedSignature) {
      console.error('Paddle webhook signature verification failed')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  let event: any
  try {
    event = JSON.parse(body)
  } catch (err: any) {
    console.error('Failed to parse webhook body:', err.message)
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const supabase = await createClient()

  // Handle transaction completed (payment succeeded)
  if (event.event_type === 'transaction.completed' || event.event_type === 'transaction.payment_succeeded') {
    const transaction = event.data
    const customData = transaction.custom_data || {}
    const userId = customData.user_id || transaction.customer_id

    if (userId) {
      const paymentType = customData.type || 'onboarding'

      if (paymentType === 'onboarding') {
        // Mark user as having paid onboarding fee
        const { error } = await (supabase
          .from('profiles') as any)
          .update({ 
            has_paid_onboarding: true,
            onboarding_payment_id: transaction.id,
          })
          .eq('id', userId)
        
        if (error) {
          console.error('Error updating onboarding payment status:', error)
        } else {
          console.log(`User ${userId} marked as paid onboarding fee`)
        }
      } else if (paymentType === 'premium') {
        // Premium subscription
        const { error } = await (supabase
          .from('profiles') as any)
          .update({ is_premium: true })
          .eq('id', userId)
        
        if (error) {
          console.error('Error updating premium status:', error)
        }
      }
    } else {
      console.error('No user ID found in transaction:', transaction)
    }
  }

  // Handle other Paddle events if needed
  // transaction.payment_failed, transaction.refunded, etc.

  return NextResponse.json({ received: true })
}


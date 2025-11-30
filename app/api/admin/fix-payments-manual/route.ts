import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

// Manual endpoint to fix payment status for users who paid but aren't activated
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
    const { data: profile } = await (supabase
      .from('profiles') as any)
      .select('is_admin, email')
      .eq('id', session.user.id)
      .single()

    const adminEmail = process.env.ADMIN_EMAIL
    const isAdmin = (adminEmail && session.user.email === adminEmail) || 
                    session.user.email === 'jackedapp@gmail.com' ||
                    session.user.email === 'chippersnyder0227@gmail.com' ||
                    (profile as any)?.is_admin === true

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    // Find user by email
    const { data: userProfile } = await (supabase
      .from('profiles') as any)
      .select('id, email, has_paid_onboarding, onboarding_payment_id')
      .eq('email', email)
      .single()

    if (!userProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Search Stripe for recent payments from this email
    const customers = await stripe.customers.list({
      email: email,
      limit: 10,
    })

    let foundPayment = false
    let sessionId = null

    // Check each customer's payment intents
    for (const customer of customers.data) {
      const paymentIntents = await stripe.paymentIntents.list({
        customer: customer.id,
        limit: 10,
      })

      for (const pi of paymentIntents.data) {
        if (pi.status === 'succeeded' && pi.amount === 99) { // $0.99 in cents
          // Found a successful $0.99 payment
          foundPayment = true
          sessionId = pi.id
          
          // Also check checkout sessions
          const sessions = await stripe.checkout.sessions.list({
            limit: 100,
          })
          
          const matchingSession = sessions.data.find(
            (s: any) => s.payment_intent === pi.id || s.customer_email === email
          )
          
          if (matchingSession) {
            sessionId = matchingSession.id
          }
          
          break
        }
      }
      
      if (foundPayment) break
    }

    // Also search checkout sessions directly
    if (!foundPayment) {
      const sessions = await stripe.checkout.sessions.list({
        limit: 100,
      })
      
      const matchingSession = sessions.data.find(
        (s: any) => s.customer_email === email && 
                   s.payment_status === 'paid' && 
                   s.amount_total === 99
      )
      
      if (matchingSession) {
        foundPayment = true
        sessionId = matchingSession.id
      }
    }

    if (foundPayment) {
      // Update user's payment status
      const { error } = await (supabase
        .from('profiles') as any)
        .update({ 
          has_paid_onboarding: true,
          onboarding_payment_id: sessionId,
        })
        .eq('id', userProfile.id)

      if (error) {
        console.error('Error updating payment status:', error)
        return NextResponse.json({ error: 'Failed to update payment status' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true,
        message: `User ${email} payment status updated`,
        userId: userProfile.id,
        sessionId
      })
    } else {
      return NextResponse.json({ 
        success: false,
        message: `No payment found for ${email}. You can still manually activate them.`,
        foundPayment: false
      })
    }
  } catch (error: any) {
    console.error('Error fixing payment:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to fix payment',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}


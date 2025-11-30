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
                    !process.env.ADMIN_EMAIL // Allow if ADMIN_EMAIL not set

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    // Find user by email in profiles table
    const { data: userProfile, error: profileError } = await (supabase
      .from('profiles') as any)
      .select('*')
      .eq('email', email)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ 
        error: 'User not found',
        details: profileError?.message 
      }, { status: 404 })
    }

    const userId = userProfile.id

    // Check for recent Stripe payments for this user
    // Look for checkout sessions in the last 7 days
    const sevenDaysAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60)
    
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      created: { gte: sevenDaysAgo },
    })

    // Find sessions that match this user
    const userSessions = sessions.data.filter(
      session => session.client_reference_id === userId && 
                 session.metadata?.type === 'onboarding' &&
                 session.payment_status === 'paid'
    )

    if (userSessions.length === 0) {
      // Still mark as paid if admin is doing this manually
      const { error } = await (supabase
        .from('profiles') as any)
        .update({ 
          has_paid_onboarding: true,
          onboarding_payment_id: 'manual_verification',
        })
        .eq('id', userId)

      if (error) {
        return NextResponse.json({ 
          error: 'Failed to update payment status',
          details: error.message 
        }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true,
        message: `User ${email} marked as paid (manual verification)`,
        userId: userId,
        note: 'No recent Stripe payment found, but manually verified'
      })
    }

    // Use the most recent paid session
    const latestSession = userSessions[0]

    // Update user's payment status
    const { error } = await (supabase
      .from('profiles') as any)
      .update({ 
        has_paid_onboarding: true,
        onboarding_payment_id: latestSession.id,
      })
      .eq('id', userId)

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to update payment status',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: `User ${email} payment verified and activated`,
      userId: userId,
      sessionId: latestSession.id,
      paymentDate: new Date(latestSession.created * 1000).toISOString()
    })
  } catch (error: any) {
    console.error('Error verifying payment:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to verify payment',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}


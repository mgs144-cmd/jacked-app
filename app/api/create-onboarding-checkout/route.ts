import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Check if Paddle API key is configured
    if (!process.env.PADDLE_API_KEY) {
      console.error('PADDLE_API_KEY is not configured')
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

    // Create Paddle checkout transaction
    try {
      // Paddle API endpoint - adjust based on your Paddle account type
      // For Paddle Classic: https://vendors.paddle.com/api/2.0/product/generate_pay_link
      // For Paddle Billing: https://api.paddle.com/transactions
      const paddleApiUrl = process.env.PADDLE_API_URL || 'https://api.paddle.com/transactions'
      
      const paddleResponse = await fetch(paddleApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PADDLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              quantity: 1,
              custom_price: {
                amount: '0.99',
                currency_code: 'USD',
              },
            },
          ],
          customer_id: session.user.id,
          custom_data: {
            user_id: session.user.id,
            type: 'onboarding',
          },
          checkout: {
            url: `${request.nextUrl.origin}/feed?payment=success`,
            cancel_url: `${request.nextUrl.origin}/payment-required?canceled=true`,
          },
        }),
      })

      if (!paddleResponse.ok) {
        const errorData = await paddleResponse.json()
        console.error('Paddle API error:', {
          status: paddleResponse.status,
          statusText: paddleResponse.statusText,
          error: errorData,
        })
        return NextResponse.json({ 
          error: errorData.error?.detail || 'Failed to create checkout session',
          details: process.env.NODE_ENV === 'development' ? errorData : undefined
        }, { status: 500 })
      }

      const checkoutData = await paddleResponse.json()
      
      // Paddle returns checkout URL in response
      if (!checkoutData.data?.checkout?.url) {
        console.error('Paddle checkout created but no URL returned:', checkoutData)
        return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
      }

      return NextResponse.json({ 
        url: checkoutData.data.checkout.url,
        transaction_id: checkoutData.data.id,
      })
    } catch (paddleError: any) {
      console.error('Paddle API error:', {
        message: paddleError.message,
        stack: paddleError.stack,
      })
      return NextResponse.json({ 
        error: paddleError.message || 'Failed to create checkout session',
        details: process.env.NODE_ENV === 'development' ? paddleError.stack : undefined
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


# Stripe Webhook Setup for Production

## The Problem
Users are being charged but not getting access because the webhook isn't updating the database.

## Fix: Configure Stripe Webhook

### 1. Create Webhook in Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Switch to **Production mode** (top right toggle)
3. Go to **Developers** → **Webhooks**
4. Click **Add endpoint**

### 2. Configure Webhook Settings

**Endpoint URL:**
```
https://app.jackedlifting.com/api/webhook
```

**Events to listen for:**
- `checkout.session.completed`
- `customer.subscription.deleted` (if using subscriptions)

**API Version:** Latest (should be `2023-10-16` or newer)

### 3. Get Webhook Signing Secret

After creating the webhook:
- Click on the webhook endpoint
- Click **Reveal** under "Signing secret"
- Copy the secret (starts with `whsec_`)

### 4. Add to Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your `jacked-app` project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

```
STRIPE_SECRET_KEY=sk_live_your_production_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
NEXT_PUBLIC_APP_URL=https://app.jackedlifting.com
```

**IMPORTANT:** Make sure you're using **LIVE** keys (starting with `sk_live_` and `pk_live_`), not test keys!

### 5. Redeploy

After adding the environment variables:
- Go to **Deployments** tab
- Click **Redeploy** on the latest deployment

OR trigger a redeploy:
```bash
git commit --allow-empty -m "Trigger redeploy with webhook configured"
git push
```

## Test the Webhook

### Option 1: Use Stripe CLI (for testing)
```bash
stripe listen --forward-to https://app.jackedlifting.com/api/webhook
stripe trigger checkout.session.completed
```

### Option 2: Test with Real Payment
Make a test payment and check:
1. Stripe Dashboard → Events → See the `checkout.session.completed` event
2. Check if webhook was delivered successfully
3. Check Vercel logs for webhook processing

## Verify Webhook is Working

Run this in Supabase SQL Editor to see recent webhook activity:
```sql
-- Check recent users who got access via webhook
SELECT 
  u.email,
  p.username,
  p.has_paid_onboarding,
  p.onboarding_payment_id,
  p.updated_at as access_granted_at
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.has_paid_onboarding = true
ORDER BY p.updated_at DESC
LIMIT 10;
```

## Troubleshooting

### Check Vercel Logs
1. Go to Vercel Dashboard
2. Click on your deployment
3. Go to **Functions** tab
4. Look for `/api/webhook` logs

### Check Stripe Event Log
1. Go to Stripe Dashboard → Developers → Events
2. Find the `checkout.session.completed` event
3. Check if webhook was delivered
4. Check the response status

### Common Issues
- ❌ Using test keys in production
- ❌ Wrong webhook URL (should be `/api/webhook`)
- ❌ Webhook secret not set in Vercel
- ❌ Webhook secret doesn't match Stripe
- ❌ CORS or firewall blocking webhook requests

## Current Environment Check

You can verify your webhook endpoint is accessible:
```bash
curl https://app.jackedlifting.com/api/webhook
```

Should return:
```json
{
  "status": "Webhook endpoint is active",
  "message": "This endpoint only accepts POST requests from Stripe",
  "configured": true
}
```


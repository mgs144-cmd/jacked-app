# Stripe Checkout Troubleshooting Guide

If you're seeing "A processing error occurred" when trying to checkout with Stripe, follow these steps:

## Step 1: Check Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Verify these variables are set:
   - `STRIPE_SECRET_KEY` - Should start with `sk_` (test mode) or `sk_live_` (live mode)
   - `STRIPE_PUBLISHABLE_KEY` - Should start with `pk_` (test mode) or `pk_live_` (live mode)
   - `STRIPE_WEBHOOK_SECRET` - Should start with `whsec_`

## Step 2: Verify Stripe Keys Match Mode

**Important:** Make sure you're using keys from the same Stripe mode:
- **Test Mode**: Keys start with `sk_test_` and `pk_test_`
- **Live Mode**: Keys start with `sk_live_` and `pk_live_`

You cannot mix test and live keys!

## Step 3: Check Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Make sure you're in the correct mode (Test mode vs Live mode)
3. Go to **Developers** → **API keys**
4. Verify the keys match what's in Vercel

## Step 4: Check Vercel Logs

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Deployments** → Click on the latest deployment
4. Click **Functions** tab
5. Look for `/api/create-onboarding-checkout`
6. Check for any error messages

## Step 5: Common Issues

### Issue: "Invalid API Key"
- **Solution**: Make sure `STRIPE_SECRET_KEY` is set correctly in Vercel
- Make sure there are no extra spaces or quotes around the key
- Redeploy after adding/changing the key

### Issue: "API version mismatch"
- **Solution**: The code uses Stripe API version `2023-10-16`. If Stripe has deprecated this, we may need to update it.

### Issue: "Test mode vs Live mode mismatch"
- **Solution**: Make sure all your Stripe keys are from the same mode (test or live)

## Step 6: Test with Stripe CLI (Local Testing)

If you want to test locally:

1. Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/webhook`
4. Copy the webhook secret it gives you
5. Add to `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## Step 7: Check Browser Console

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Try to sign up again
4. Look for any error messages
5. Check the **Network** tab for the `/api/create-onboarding-checkout` request
6. Look at the response - it should show the error details

## Step 8: Verify Stripe Account Status

1. Go to Stripe Dashboard
2. Check if your account is fully activated
3. Make sure you've completed all required setup steps
4. Check if there are any account restrictions

## Step 9: Contact Stripe Support

If none of the above works:
1. Go to Stripe Dashboard → **Help** → **Contact Support**
2. Include:
   - The exact error message
   - When it happens (during checkout creation or payment submission)
   - Your Stripe account email
   - Screenshots if possible

## Quick Fix: Redeploy

Sometimes environment variables don't take effect until you redeploy:

1. In Vercel, go to **Deployments**
2. Click the **⋯** menu on the latest deployment
3. Click **Redeploy**
4. Wait for it to finish
5. Try again

## Still Not Working?

If you're still having issues, check:
1. Are you using the correct Stripe account? (Not a test/development account)
2. Is your Stripe account in good standing?
3. Are there any payment method restrictions?
4. Is the amount ($0.99) valid for your currency?


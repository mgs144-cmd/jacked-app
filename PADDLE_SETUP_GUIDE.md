# Paddle Setup Guide - Complete Instructions

## Why Paddle?

✅ **No account review delays** - Start accepting payments immediately  
✅ **Handles taxes automatically** - Great for international users  
✅ **Similar API to Stripe** - Easy migration  
✅ **Merchant of record** - They handle compliance  
✅ **Works worldwide** - No geographic restrictions  

## Step 1: Create Paddle Account

1. Go to [paddle.com](https://paddle.com)
2. Click **"Get Started"** or **"Sign Up"**
3. Fill out the signup form:
   - Business name
   - Email
   - Password
4. Verify your email
5. Complete basic business information (much faster than Stripe review)

## Step 2: Get API Keys

1. Once logged in, go to **Developer Tools** → **Authentication**
2. You'll see:
   - **API Key** (starts with `test_` or `live_`)
   - **Public Key** (starts with `test_` or `live_`)
3. Copy both keys (you'll need them in Step 4)

**Note:** Paddle has Test Mode and Live Mode (toggle in top right of dashboard)

## Step 3: Install Paddle SDK

The code I'll provide uses Paddle's REST API directly (no SDK needed), but if you want to use their SDK later:

```bash
npm install @paddle/paddle-node-api
```

## Step 4: Update Environment Variables in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add/Update these variables:

```
PADDLE_API_KEY=your_paddle_api_key_here
PADDLE_PUBLIC_KEY=your_paddle_public_key_here
PADDLE_WEBHOOK_SECRET=your_webhook_secret_here (get this in Step 5)
```

5. Click **Save**
6. **Redeploy** your app (important!)

## Step 5: Set Up Webhook

1. In Paddle Dashboard, go to **Developer Tools** → **Notifications**
2. Click **"Add endpoint"**
3. Enter your webhook URL:
   ```
   https://your-app.vercel.app/api/webhook
   ```
   (Replace with your actual Vercel URL)
4. Select events to listen for:
   - ✅ `transaction.completed`
   - ✅ `transaction.payment_succeeded`
5. Click **Save**
6. Copy the **Webhook Secret** (starts with `whsec_`)
7. Add it to Vercel environment variables as `PADDLE_WEBHOOK_SECRET`

## Step 6: Test the Integration

1. **Use Test Mode:**
   - Toggle to Test Mode in Paddle Dashboard
   - Use test API keys in Vercel
   - Test cards: `4242 4242 4242 4242` (any future expiry, any CVC)

2. **Test the flow:**
   - Sign up on your app
   - Should redirect to Paddle checkout
   - Complete payment with test card
   - Should redirect back to your app
   - User should be marked as paid

## Step 7: Switch to Live Mode

Once everything works in test mode:

1. **In Paddle Dashboard:**
   - Toggle to **Live Mode**
   - Get your **Live API keys**

2. **In Vercel:**
   - Update environment variables with live keys
   - Redeploy

3. **Update Webhook:**
   - Create a new webhook endpoint for live mode
   - Update the webhook secret in Vercel

## Pricing

- **Fees:** 2.9% + $0.30 per transaction (same as Stripe)
- **No monthly fees**
- **No setup fees**

## Support

- **Paddle Docs:** [developer.paddle.com](https://developer.paddle.com)
- **Paddle Support:** Available in dashboard
- **Status Page:** [status.paddle.com](https://status.paddle.com)

## Troubleshooting

### Issue: "Invalid API key"
- Make sure you're using the correct mode (test vs live)
- Check for extra spaces in environment variables
- Redeploy after updating variables

### Issue: Webhook not working
- Verify webhook URL is correct
- Check webhook secret matches
- Look at Paddle Dashboard → Notifications for delivery status

### Issue: Payment not completing
- Check browser console for errors
- Verify Paddle checkout is loading
- Check Vercel function logs

## Next Steps After Setup

1. Test the full payment flow
2. Verify webhook is receiving events
3. Check database is updating correctly
4. Switch to live mode when ready


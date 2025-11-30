# Paddle Quick Start - Step by Step

## ✅ What I've Done

I've updated your code to use **Paddle** instead of Stripe:

1. ✅ Updated `/app/api/create-onboarding-checkout/route.ts` - Now uses Paddle API
2. ✅ Updated `/app/api/webhook/route.ts` - Now handles Paddle webhooks
3. ✅ Frontend stays the same - No changes needed!

## 🚀 Setup Steps (15 minutes)

### Step 1: Create Paddle Account (5 min)

1. Go to [paddle.com](https://paddle.com)
2. Click **"Get Started"**
3. Sign up with your email
4. Complete basic business info (much faster than Stripe!)

### Step 2: Get Your API Keys (2 min)

1. In Paddle Dashboard, go to **Developer Tools** → **Authentication**
2. You'll see:
   - **API Key** (starts with `test_` or `live_`)
   - **Public Key** (starts with `test_` or `live_`)
3. **Copy both keys**

**Important:** Toggle to **Test Mode** (top right) for testing!

### Step 3: Set Up Webhook (3 min)

1. In Paddle Dashboard, go to **Developer Tools** → **Notifications**
2. Click **"Add endpoint"**
3. Enter your webhook URL:
   ```
   https://your-app.vercel.app/api/webhook
   ```
   (Replace `your-app.vercel.app` with your actual Vercel URL)
4. Select events:
   - ✅ `transaction.completed`
   - ✅ `transaction.payment_succeeded`
5. Click **Save**
6. **Copy the Webhook Secret** (starts with `whsec_`)

### Step 4: Add Environment Variables in Vercel (3 min)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add these 3 variables:

```
PADDLE_API_KEY=test_your_api_key_here
PADDLE_PUBLIC_KEY=test_your_public_key_here
PADDLE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**Note:** Use `test_` keys for testing, `live_` keys for production

5. Click **Save**
6. **Redeploy** your app (important!)

### Step 5: Test It! (2 min)

1. Go to your app's signup page
2. Create a test account
3. Should redirect to Paddle checkout
4. Use test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
5. Complete payment
6. Should redirect back to your app
7. User should be marked as paid ✅

## 🔧 If Something Doesn't Work

### Issue: "Invalid API key"
- Make sure you're using Test Mode keys in Test Mode
- Check for extra spaces in Vercel environment variables
- Redeploy after updating variables

### Issue: Webhook not working
- Verify webhook URL is correct (must be HTTPS)
- Check webhook secret matches
- Look at Paddle Dashboard → Notifications for delivery status

### Issue: Checkout URL not loading
- Check browser console (F12) for errors
- Verify Paddle API key is correct
- Check Vercel function logs

## 📝 Notes

- **Test Mode:** Use test keys, works immediately, no account review
- **Live Mode:** Use live keys, processes real payments
- **Fees:** Same as Stripe (2.9% + $0.30)
- **No monthly fees**

## 🎯 Next Steps

1. Test in Test Mode first
2. Once everything works, switch to Live Mode
3. Update environment variables with live keys
4. Redeploy

## 📚 Need Help?

- **Paddle Docs:** [developer.paddle.com](https://developer.paddle.com)
- **Paddle Support:** Available in dashboard
- **Check Paddle Dashboard:** Look at Transactions to see test payments

---

**That's it!** Your app now uses Paddle instead of Stripe. No more account review delays! 🎉


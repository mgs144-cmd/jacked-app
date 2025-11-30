# Stripe Setup - Simple Guide

## Step 1: Get Your Stripe Keys

### For Testing (Start Here!)

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Make sure you're in **Test mode** (toggle in top right)
3. Go to **Developers** → **API keys**
4. Copy:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`) - Click "Reveal" to see it

### For Production (Later)

1. Switch to **Live mode** (toggle in top right)
2. Go to **Developers** → **API keys**
3. Copy:
   - **Publishable key** (starts with `pk_live_...`)
   - **Secret key** (starts with `sk_live_...`)

---

## Step 2: Add Keys to Your App

### Local Development (.env.local)

Create/update `.env.local` in your project root:

```env
# Test Mode Keys (for development)
STRIPE_SECRET_KEY=sk_test_51ABC123...your_test_secret_key
STRIPE_WEBHOOK_SECRET=whsec_...your_webhook_secret
```

### Production (Vercel)

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add:
   - `STRIPE_SECRET_KEY` = `sk_live_...` (for production) or `sk_test_...` (for testing)
   - `STRIPE_WEBHOOK_SECRET` = `whsec_...` (from Step 3)

---

## Step 3: Set Up Webhook

### Option A: Production Webhook (Recommended)

1. Go to **Stripe Dashboard** → **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. Enter your endpoint URL:
   ```
   https://your-app-name.vercel.app/api/webhook
   ```
   **Replace `your-app-name` with your actual Vercel app name!**
   
   To find your Vercel URL:
   - Go to Vercel Dashboard → Your Project
   - Look at the "Domains" section
   - Use the `.vercel.app` URL

4. Select events:
   - ✅ `checkout.session.completed`

5. Click **"Add endpoint"**

6. Copy the **Signing secret** (starts with `whsec_`)
   - This is your `STRIPE_WEBHOOK_SECRET`

### Option B: Local Testing with Stripe CLI

If testing locally:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Run:
   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/webhook
   ```
3. Copy the webhook signing secret it shows (starts with `whsec_`)
4. Add it to `.env.local` as `STRIPE_WEBHOOK_SECRET`

---

## Step 4: Test It!

### Test Mode Cards

Use these in **Test mode**:

- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **3D Secure:** `4000 0025 0000 3155`

**Expiry:** Any future date (e.g., `12/25`)  
**CVC:** Any 3 digits (e.g., `123`)  
**ZIP:** Any 5 digits (e.g., `12345`)

### Test Flow

1. Start your app: `npm run dev`
2. Go to signup page
3. Create an account
4. You'll be redirected to Stripe checkout
5. Use test card: `4242 4242 4242 4242`
6. Complete payment
7. You should be redirected back to your app

---

## Quick Checklist

- [ ] Got Stripe account (test mode)
- [ ] Copied test secret key (`sk_test_...`)
- [ ] Set up webhook endpoint (your Vercel URL + `/api/webhook`)
- [ ] Copied webhook signing secret (`whsec_...`)
- [ ] Added both to `.env.local` (local) and Vercel (production)
- [ ] Tested with test card `4242 4242 4242 4242`

---

## Finding Your Vercel URL

1. Go to [vercel.com](https://vercel.com) → Your Project
2. Look at the top - you'll see your domain
3. It will be something like: `jacked-app-abc123.vercel.app`
4. Your webhook URL is: `https://jacked-app-abc123.vercel.app/api/webhook`

---

## Example

If your Vercel app is named `jacked-app` and your project is `mgs144-8670s-projects`, your URL might be:
```
https://jacked-app-mgs144-8670s-projects.vercel.app/api/webhook
```

Or if you have a custom domain:
```
https://jacked.com/api/webhook
```

---

## Summary

**For Development:**
- Use **Test mode** keys (`sk_test_...`)
- Webhook URL: Your Vercel URL + `/api/webhook`
- Test with card: `4242 4242 4242 4242`

**For Production:**
- Use **Live mode** keys (`sk_live_...`)
- Same webhook URL (but make sure it's your production domain)
- Real payments will process

That's it! 🚀


# $0.99 Onboarding Payment Setup Guide

## Simple Explanation

When users sign up, they'll be redirected to Stripe to pay $0.99. Once they complete payment, they can use the app. This is a one-time payment per account.

---

## How It Works

1. **User signs up** → Account is created
2. **User is redirected** → To Stripe checkout page ($0.99)
3. **User pays** → Stripe processes payment
4. **Stripe sends webhook** → Your app marks user as "paid"
5. **User can use app** → Full access granted

---

## Setup Steps

### Step 1: Get Stripe Account

1. Go to [stripe.com](https://stripe.com) and create an account (or log in)
2. Get your API keys from the Dashboard

### Step 2: Add Environment Variables

Add these to your `.env.local` file (and Vercel environment variables):

```env
STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)
STRIPE_WEBHOOK_SECRET=whsec_... (get this from Step 3)
```

**Where to find:**
- `STRIPE_SECRET_KEY`: Dashboard → Developers → API keys → Secret key
- `STRIPE_WEBHOOK_SECRET`: Dashboard → Developers → Webhooks → Your webhook → Signing secret

### Step 3: Set Up Webhook

1. Go to **Stripe Dashboard** → **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. Enter your webhook URL:
   - **Development:** `https://your-app.vercel.app/api/webhook`
   - **Production:** `https://your-domain.com/api/webhook`
4. Select events to listen for:
   - `checkout.session.completed` ✅
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add it to your `.env.local` as `STRIPE_WEBHOOK_SECRET`

### Step 4: Run Database Migration

Make sure you've run `COMPLETE_FEATURES_MIGRATION.sql` which includes:
- `has_paid_onboarding` column
- `onboarding_payment_id` column

If not, add these columns to your `profiles` table:

```sql
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS has_paid_onboarding BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_payment_id TEXT;
```

### Step 5: Test It!

1. Try signing up a new account
2. You should be redirected to Stripe checkout
3. Use Stripe test card: `4242 4242 4242 4242`
4. Complete payment
5. Check that user can access the app

---

## Testing with Stripe Test Cards

Use these in test mode:

- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **3D Secure:** `4000 0025 0000 3155`

Expiry: Any future date (e.g., `12/25`)  
CVC: Any 3 digits (e.g., `123`)

---

## Protecting Routes (Optional)

If you want to block unpaid users from accessing the app, add this check to protected pages:

```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('has_paid_onboarding')
  .eq('id', session.user.id)
  .single()

if (!profile?.has_paid_onboarding) {
  redirect('/auth/signup?payment_required=true')
}
```

---

## What Happens After Payment

1. Stripe sends webhook to `/api/webhook`
2. Webhook handler updates user's profile:
   - Sets `has_paid_onboarding = true`
   - Stores `onboarding_payment_id`
3. User is redirected back to app
4. User can now use all features

---

## Troubleshooting

**Payment not working?**
- Check Stripe keys are correct
- Verify webhook URL is correct
- Check webhook is receiving events (Stripe Dashboard → Webhooks → Your endpoint → Events)

**User stuck after payment?**
- Check webhook is working
- Verify `has_paid_onboarding` is being set to `true`
- Check browser console for errors

**Test mode vs Live mode:**
- Use test keys (`sk_test_...`) for development
- Use live keys (`sk_live_...`) for production
- Test cards only work in test mode

---

## Summary

✅ **Code is ready** - Already implemented  
✅ **Just need:** Stripe account + API keys + Webhook setup  
✅ **Price:** $0.99 (99 cents)  
✅ **One-time payment** per account

That's it! Once you add the Stripe keys and set up the webhook, the payment flow will work automatically.


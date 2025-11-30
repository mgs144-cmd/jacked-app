# Stripe Account Under Review - Solutions

If your Stripe account is under review, you may encounter "processing error" messages during checkout. Here's what to do:

## Why This Happens

Stripe reviews new accounts to:
- Verify business information
- Ensure compliance with payment regulations
- Prevent fraud

During review, Stripe may restrict:
- Live payments
- Certain payment methods
- High-value transactions

## Solutions

### Option 1: Use Test Mode (Recommended for Development)

While your account is under review, you can use **Test Mode** which doesn't require review:

1. **In Stripe Dashboard:**
   - Toggle to **Test Mode** (top right of dashboard)
   - Test mode keys start with `sk_test_` and `pk_test_`

2. **In Vercel:**
   - Update environment variables with test mode keys:
     - `STRIPE_SECRET_KEY` → Use `sk_test_...`
     - `STRIPE_PUBLISHABLE_KEY` → Use `pk_test_...`
   - Redeploy your app

3. **Test Payments:**
   - Use test card numbers from [Stripe Testing](https://stripe.com/docs/testing)
   - Example: `4242 4242 4242 4242` (any future expiry, any CVC)

### Option 2: Complete Stripe Review

1. **Check Review Status:**
   - Go to Stripe Dashboard
   - Look for any notifications or warnings
   - Check **Settings** → **Account** for pending items

2. **Complete Required Information:**
   - Business details
   - Bank account information
   - Identity verification
   - Business verification documents

3. **Contact Stripe Support:**
   - Go to **Help** → **Contact Support**
   - Ask about your review status
   - They can expedite if needed

### Option 3: Temporarily Disable Payment Requirement

If you need the app working immediately, you can temporarily allow users to sign up without payment:

1. **Update Middleware:**
   - Comment out the payment check in `middleware.ts`
   - Users can sign up without paying
   - Re-enable once Stripe review is complete

2. **Or Create a Bypass:**
   - Add an environment variable: `BYPASS_PAYMENT=true`
   - Check this in middleware to skip payment requirement

## Recommended Approach

**For now (while under review):**
- Use **Test Mode** with test keys
- Test the full payment flow
- Users can sign up and "pay" with test cards

**Once review is complete:**
- Switch to **Live Mode** keys
- Update Vercel environment variables
- Redeploy

## Test Mode vs Live Mode

| Feature | Test Mode | Live Mode |
|---------|-----------|-----------|
| Account Review | Not Required | Required |
| Real Payments | No | Yes |
| Test Cards | Yes | No |
| Webhooks | Works | Works |
| Production Ready | No | Yes |

## Checking Your Account Status

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Look at the top banner for review status
3. Check **Settings** → **Account** → **Verification**
4. See what information is still needed

## Need Help?

- **Stripe Support:** [support.stripe.com](https://support.stripe.com)
- **Stripe Status:** [status.stripe.com](https://status.stripe.com)
- **Stripe Docs:** [stripe.com/docs](https://stripe.com/docs)

## Quick Test Mode Setup

1. In Stripe Dashboard, toggle to **Test Mode**
2. Go to **Developers** → **API keys**
3. Copy the **Test mode** keys (not live mode)
4. In Vercel, update:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
5. Redeploy
6. Test with card: `4242 4242 4242 4242`

This will work immediately without waiting for account review!


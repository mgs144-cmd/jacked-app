# How to Fix Paid Users Who Can't Access the App

## Quick Fix Steps:

### 1. Get Customer Emails from Stripe
1. Go to https://dashboard.stripe.com
2. Click **Payments** in the left sidebar
3. Filter for:
   - Amount: $0.99
   - Status: Succeeded
   - Date: Last 7 days
4. For each payment, click on it and note the **Customer Email**

### 2. Update Users in Database
Run this SQL in Supabase SQL Editor, replacing the emails with actual customer emails:

```sql
UPDATE profiles
SET 
  has_paid_onboarding = true,
  onboarding_payment_id = 'stripe_fix_' || id::text || '_' || EXTRACT(EPOCH FROM NOW())::bigint::text
WHERE email IN (
  'customer1@example.com',
  'customer2@example.com',
  'customer3@example.com'
  -- Add all customer emails from Stripe here
);
```

### 3. Verify Fix
```sql
SELECT email, username, has_paid_onboarding, onboarding_payment_id
FROM profiles
WHERE email IN (
  'customer1@example.com',
  'customer2@example.com'
  -- Same emails as above
);
```

## Why This Happens:

The webhook might not be receiving `client_reference_id` correctly, or the user email might not match. The updated webhook code now:
- ✅ Falls back to email lookup if `client_reference_id` is missing
- ✅ Has better logging to debug issues
- ✅ Verifies payment on client-side as backup

## Check Webhook Logs:

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on your webhook endpoint
3. Click **"Event deliveries"** tab
4. Check recent `checkout.session.completed` events
5. Look at the response to see if it succeeded

## Alternative: Use Admin Endpoint

You can also use the admin API endpoint to fix users:

```bash
POST /api/admin/fix-payments-manual
Headers: { "Content-Type": "application/json" }
Body: { "email": "user@example.com" }
```

This will automatically search Stripe for payments and update the user.


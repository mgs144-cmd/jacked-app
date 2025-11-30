# Verify Payment for chippersnyder0227@gmail.com

## Option 1: Use Admin Dashboard (Easiest)

1. Go to `/admin` in your app
2. Search for `chippersnyder0227@gmail.com`
3. Click "Approve" button

## Option 2: Use API Route (If you're logged in as admin)

Make a POST request to:
```
POST https://app.jackedlifting.com/api/admin/verify-payment
Content-Type: application/json

{
  "email": "chippersnyder0227@gmail.com"
}
```

## Option 3: Direct Database Update (Quick Fix)

Run this SQL in Supabase SQL Editor:

```sql
UPDATE profiles 
SET has_paid_onboarding = true,
    onboarding_payment_id = 'manual_verification_' || id
WHERE email = 'chippersnyder0227@gmail.com';
```

This will immediately activate the account.


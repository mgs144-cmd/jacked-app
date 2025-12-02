-- Fix redirect loop for clareamurray2006@icloud.com
-- The middleware requires a valid payment ID, so we'll set one

-- Step 1: Check current payment ID
SELECT 
  email,
  username,
  has_paid_onboarding,
  onboarding_payment_id,
  CASE 
    WHEN onboarding_payment_id IS NULL THEN '❌ No payment ID - will cause redirect loop'
    WHEN onboarding_payment_id LIKE 'cs_%' THEN '✅ Valid Stripe checkout session'
    WHEN onboarding_payment_id LIKE 'pi_%' THEN '✅ Valid Stripe payment intent'
    WHEN onboarding_payment_id LIKE 'manual_%' THEN '✅ Valid manual fix ID'
    WHEN onboarding_payment_id LIKE 'stripe_fix_%' THEN '✅ Valid stripe fix ID'
    ELSE '⚠️ Invalid payment ID format'
  END as payment_id_status
FROM profiles
WHERE email = 'clareamurray2006@icloud.com';

-- Step 2: Fix by setting a valid payment ID
-- Option A: If you have the actual Stripe payment ID, use this:
-- UPDATE profiles
-- SET 
--   onboarding_payment_id = 'pi_YOUR_ACTUAL_STRIPE_PAYMENT_ID',  -- Replace with actual Stripe ID
--   has_paid_onboarding = true,
--   updated_at = NOW()
-- WHERE email = 'clareamurray2006@icloud.com';

-- Option B: Use a manual fix ID (if you don't have the Stripe ID):
UPDATE profiles
SET 
  username = 'Clare',
  has_paid_onboarding = true,
  onboarding_payment_id = 'manual_clare_fix_' || EXTRACT(EPOCH FROM NOW())::text,
  updated_at = NOW()
WHERE email = 'clareamurray2006@icloud.com';

-- Step 3: Verify the fix
SELECT 
  'AFTER FIX' as status,
  email,
  username,
  has_paid_onboarding,
  onboarding_payment_id,
  CASE 
    WHEN has_paid_onboarding = true AND onboarding_payment_id LIKE 'manual_%' THEN '✅ Fixed - should work now'
    WHEN has_paid_onboarding = true AND onboarding_payment_id LIKE 'pi_%' THEN '✅ Fixed with Stripe ID'
    WHEN has_paid_onboarding = true AND onboarding_payment_id LIKE 'cs_%' THEN '✅ Fixed with Stripe checkout ID'
    ELSE '⚠️ Check payment ID format'
  END as final_status
FROM profiles
WHERE email = 'clareamurray2006@icloud.com';


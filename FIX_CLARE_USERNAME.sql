-- Fix missing username and check payment status for clareamurray2006@icloud.com

-- Step 1: Check current status
SELECT 
  'BEFORE FIX' as status,
  id,
  email,
  username,
  full_name,
  has_paid_onboarding,
  onboarding_payment_id,
  created_at
FROM profiles
WHERE email = 'clareamurray2006@icloud.com';

-- Step 2: Fix the username to "Clare" and ensure payment status
UPDATE profiles
SET 
  username = 'Clare',
  has_paid_onboarding = true,
  updated_at = NOW()
WHERE email = 'clareamurray2006@icloud.com';

-- Step 3: Verify the fix
SELECT 
  'AFTER FIX' as status,
  id,
  email,
  username,
  full_name,
  has_paid_onboarding,
  onboarding_payment_id,
  created_at
FROM profiles
WHERE email = 'clareamurray2006@icloud.com';

-- Step 4: Check if they have paid (if not, this might be why they can't access)
-- If has_paid_onboarding is false, they need to complete payment
SELECT 
  CASE 
    WHEN has_paid_onboarding = true THEN '✅ User has paid - should have access'
    WHEN has_paid_onboarding = false AND onboarding_payment_id IS NOT NULL THEN '⚠️ Payment in progress - check Stripe'
    ELSE '❌ User has not paid - needs to complete payment'
  END as payment_status,
  has_paid_onboarding,
  onboarding_payment_id
FROM profiles
WHERE email = 'clareamurray2006@icloud.com';


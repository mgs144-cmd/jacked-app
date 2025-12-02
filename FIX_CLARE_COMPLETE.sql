-- Fix username and payment status for clareamurray2006@icloud.com
-- User has paid in Stripe, so we'll set both username and payment status

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

-- Step 2: Fix username and ensure payment status is correct
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

-- Step 4: Final status check
SELECT 
  CASE 
    WHEN has_paid_onboarding = true AND username IS NOT NULL THEN '✅ User is fixed and should have access'
    WHEN has_paid_onboarding = true AND username IS NULL THEN '⚠️ Payment fixed but username still missing'
    WHEN has_paid_onboarding = false THEN '❌ Payment status not fixed'
    ELSE '⚠️ Unknown status'
  END as final_status,
  username,
  has_paid_onboarding
FROM profiles
WHERE email = 'clareamurray2006@icloud.com';


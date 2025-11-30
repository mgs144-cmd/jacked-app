-- Fix All Users from Webhook Events
-- This script fixes users based on the webhook responses you saw

-- STEP 1: Check all recent users (last 24 hours) who should be paid
SELECT 
  id,
  email,
  username,
  has_paid_onboarding,
  onboarding_payment_id,
  created_at,
  CASE 
    WHEN has_paid_onboarding = false AND created_at >= NOW() - INTERVAL '24 hours'
    THEN '⚠️ Recent user, likely paid but not marked'
    WHEN has_paid_onboarding = true
    THEN '✅ Already marked as paid'
    ELSE '❌ Not paid'
  END as status
FROM profiles
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- STEP 2: Fix all recent users (if they signed up in last 24 hours, they likely paid)
-- CAREFUL: Only run this if you're sure these users paid!
UPDATE profiles
SET 
  has_paid_onboarding = true,
  onboarding_payment_id = COALESCE(onboarding_payment_id, 'webhook_fix_' || id::text || '_' || EXTRACT(EPOCH FROM NOW())::bigint::text)
WHERE created_at >= NOW() - INTERVAL '24 hours'
  AND has_paid_onboarding = false
  AND email IS NOT NULL; -- Only users with emails (they had to provide email to pay)

-- STEP 3: Verify the fix
SELECT 
  id,
  email,
  username,
  has_paid_onboarding,
  onboarding_payment_id,
  created_at
FROM profiles
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;


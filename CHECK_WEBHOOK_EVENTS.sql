-- Check Webhook Processing Status
-- This helps identify if webhook events are being processed correctly

-- Check users with payment IDs (webhook should have set these)
SELECT 
  id,
  email,
  username,
  has_paid_onboarding,
  onboarding_payment_id,
  created_at
FROM profiles
WHERE onboarding_payment_id IS NOT NULL
ORDER BY created_at DESC;

-- Check users who should be paid but aren't
SELECT 
  id,
  email,
  username,
  has_paid_onboarding,
  created_at,
  CASE 
    WHEN onboarding_payment_id IS NOT NULL AND has_paid_onboarding = false 
    THEN '⚠️ Has payment ID but not marked as paid'
    WHEN onboarding_payment_id IS NULL AND has_paid_onboarding = false
    THEN '❌ No payment recorded'
    ELSE '✅ Paid'
  END as status
FROM profiles
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;


-- Find users who are marked as paid but don't have valid Stripe payment IDs
-- This helps identify users who might have been incorrectly marked as paid

-- Users marked as paid but with suspicious payment IDs
SELECT 
  id,
  email,
  username,
  has_paid_onboarding,
  onboarding_payment_id,
  created_at,
  CASE 
    WHEN onboarding_payment_id IS NULL THEN 'No payment ID'
    WHEN onboarding_payment_id LIKE 'cs_%' THEN 'Valid Stripe checkout session'
    WHEN onboarding_payment_id LIKE 'pi_%' THEN 'Valid Stripe payment intent'
    WHEN onboarding_payment_id LIKE 'manual_%' THEN 'Manually set (verify)'
    WHEN onboarding_payment_id LIKE 'accepted_all_%' THEN 'Bulk accepted (verify)'
    WHEN onboarding_payment_id LIKE 'webhook_fix_%' THEN 'Webhook fix (verify)'
    WHEN onboarding_payment_id LIKE 'stripe_fix_%' THEN 'Stripe fix (verify)'
    ELSE 'Unknown format'
  END as payment_status
FROM profiles
WHERE has_paid_onboarding = true
ORDER BY created_at DESC;

-- Users marked as paid but created recently (last 24 hours) - might need verification
SELECT 
  id,
  email,
  username,
  has_paid_onboarding,
  onboarding_payment_id,
  created_at
FROM profiles
WHERE has_paid_onboarding = true
  AND created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- All users and their payment status
SELECT 
  id,
  email,
  username,
  has_paid_onboarding,
  onboarding_payment_id,
  created_at,
  CASE 
    WHEN has_paid_onboarding = true AND onboarding_payment_id LIKE 'cs_%' THEN '✅ Paid (Stripe)'
    WHEN has_paid_onboarding = true AND onboarding_payment_id LIKE 'pi_%' THEN '✅ Paid (Stripe)'
    WHEN has_paid_onboarding = true THEN '⚠️ Marked paid (verify)'
    ELSE '❌ Not paid'
  END as status
FROM profiles
ORDER BY created_at DESC
LIMIT 50;


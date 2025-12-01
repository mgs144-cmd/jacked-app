-- Reset ALL users who have webhook_fix_ payment IDs
-- These were set by fix scripts, not actual Stripe payments
-- This will require them to actually pay

UPDATE profiles
SET 
  has_paid_onboarding = false,
  onboarding_payment_id = NULL
WHERE onboarding_payment_id LIKE 'webhook_fix_%'
   OR onboarding_payment_id LIKE 'webhook_fix%';

-- Verify the reset
SELECT 
  id,
  email,
  username,
  has_paid_onboarding,
  onboarding_payment_id,
  created_at
FROM profiles
WHERE onboarding_payment_id LIKE 'webhook_fix_%'
   OR onboarding_payment_id LIKE 'webhook_fix%'
ORDER BY created_at DESC;

-- Check how many users were reset
SELECT 
  COUNT(*) as users_reset
FROM profiles
WHERE has_paid_onboarding = false
  AND (onboarding_payment_id IS NULL OR onboarding_payment_id = '');


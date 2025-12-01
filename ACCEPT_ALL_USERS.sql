-- Accept All Users - Mark everyone as paid
-- WARNING: This will mark ALL users as having paid, even if they haven't
-- Use this only if you want to temporarily disable payment requirements

-- Mark all existing users as paid
UPDATE profiles
SET 
  has_paid_onboarding = true,
  onboarding_payment_id = COALESCE(onboarding_payment_id, 'accepted_all_' || id::text || '_' || EXTRACT(EPOCH FROM NOW())::bigint::text)
WHERE has_paid_onboarding = false;

-- Verify the update
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE has_paid_onboarding = true) as paid_users,
  COUNT(*) FILTER (WHERE has_paid_onboarding = false) as unpaid_users
FROM profiles;

-- Show all users and their payment status
SELECT 
  id,
  email,
  username,
  has_paid_onboarding,
  onboarding_payment_id,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 50;


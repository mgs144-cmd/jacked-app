-- Reset payment status for users who haven't actually paid
-- This will require them to pay before accessing the app

-- Option 1: Reset ALL users who don't have a valid onboarding_payment_id
-- (This will require everyone to pay again, use with caution!)
-- UPDATE profiles
-- SET 
--   has_paid_onboarding = false,
--   onboarding_payment_id = NULL
-- WHERE onboarding_payment_id IS NULL 
--    OR onboarding_payment_id NOT LIKE 'cs_%' 
--    AND onboarding_payment_id NOT LIKE 'pi_%'
--    AND onboarding_payment_id NOT LIKE 'manual_%'
--    AND onboarding_payment_id NOT LIKE 'accepted_all_%'
--    AND onboarding_payment_id NOT LIKE 'webhook_fix_%'
--    AND onboarding_payment_id NOT LIKE 'stripe_fix_%';

-- Option 2: Reset specific users by email
-- Replace the emails below with the actual user emails
UPDATE profiles
SET 
  has_paid_onboarding = false,
  onboarding_payment_id = NULL
WHERE email IN (
  'user1@example.com',
  'user2@example.com'
  -- Add the actual email addresses here
);

-- Option 3: Reset users created after a certain time who haven't paid
-- This resets users created in the last 24 hours who don't have a valid payment ID
-- UPDATE profiles
-- SET 
--   has_paid_onboarding = false,
--   onboarding_payment_id = NULL
-- WHERE created_at >= NOW() - INTERVAL '24 hours'
--   AND (
--     onboarding_payment_id IS NULL 
--     OR onboarding_payment_id NOT LIKE 'cs_%' 
--     AND onboarding_payment_id NOT LIKE 'pi_%'
--   );

-- Verify the changes
SELECT 
  id,
  email,
  username,
  has_paid_onboarding,
  onboarding_payment_id,
  created_at
FROM profiles
WHERE email IN (
  'user1@example.com',
  'user2@example.com'
  -- Add the actual email addresses here
)
ORDER BY created_at DESC;

-- Or check all users who are marked as paid but might not have actually paid
SELECT 
  id,
  email,
  username,
  has_paid_onboarding,
  onboarding_payment_id,
  created_at
FROM profiles
WHERE has_paid_onboarding = true
  AND (
    onboarding_payment_id IS NULL 
    OR onboarding_payment_id NOT LIKE 'cs_%' 
    AND onboarding_payment_id NOT LIKE 'pi_%'
    AND onboarding_payment_id NOT LIKE 'manual_%'
  )
ORDER BY created_at DESC;


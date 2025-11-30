-- Fix daniellebsnyder@gmail.com account
-- First, check current status
SELECT id, email, username, has_paid_onboarding, is_admin, onboarding_payment_id, created_at
FROM profiles
WHERE email = 'daniellebsnyder@gmail.com';

-- If the account exists but isn't marked as paid, fix it:
UPDATE profiles 
SET has_paid_onboarding = true,
    onboarding_payment_id = 'pi_3SZCL5LrnvsxMxER1cJ7ZkB9'
WHERE email = 'daniellebsnyder@gmail.com';

-- If the account doesn't exist, we need to find the user ID from auth.users
-- Run this to find the user:
-- SELECT id, email, created_at FROM auth.users WHERE email = 'daniellebsnyder@gmail.com';

-- Verify the fix
SELECT id, email, username, has_paid_onboarding, is_admin, onboarding_payment_id
FROM profiles
WHERE email = 'daniellebsnyder@gmail.com';


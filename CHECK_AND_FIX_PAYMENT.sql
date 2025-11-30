-- Check current status of chippersnyder0227@gmail.com
SELECT id, email, username, has_paid_onboarding, is_admin, onboarding_payment_id, created_at
FROM profiles
WHERE email = 'chippersnyder0227@gmail.com';

-- If has_paid_onboarding is false, run this to fix it:
UPDATE profiles 
SET has_paid_onboarding = true,
    onboarding_payment_id = 'pi_3SZCL5LrnvsxMxER1cJ7ZkB9',
    is_admin = true
WHERE email = 'chippersnyder0227@gmail.com'
  AND has_paid_onboarding = false;

-- Verify the fix
SELECT id, email, username, has_paid_onboarding, is_admin, onboarding_payment_id
FROM profiles
WHERE email = 'chippersnyder0227@gmail.com';


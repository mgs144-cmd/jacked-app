-- Fix payments for the correct accounts
-- chippersnyder0227@gmail.com and daniellebsnyder@gmail.com made purchases

-- Mark chippersnyder0227@gmail.com as paid and admin
UPDATE profiles 
SET has_paid_onboarding = true,
    onboarding_payment_id = 'pi_3SZCL5LrnvsxMxER1cJ7ZkB9',
    is_admin = true
WHERE email = 'chippersnyder0227@gmail.com';

-- Mark daniellebsnyder@gmail.com as paid
UPDATE profiles 
SET has_paid_onboarding = true,
    onboarding_payment_id = 'pi_3SZCL5LrnvsxMxER1cJ7ZkB9'
WHERE email = 'daniellebsnyder@gmail.com';

-- Remove payment status from jackedapp@gmail.com if it was incorrectly marked
-- (Keep it as admin but remove payment if it didn't pay)
UPDATE profiles 
SET has_paid_onboarding = false,
    onboarding_payment_id = NULL
WHERE email = 'jackedapp@gmail.com'
  AND onboarding_payment_id = 'pi_3SZCL5LrnvsxMxER1cJ7ZkB9';

-- Verify the updates
SELECT id, email, username, has_paid_onboarding, is_admin, onboarding_payment_id
FROM profiles
WHERE email IN ('jackedapp@gmail.com', 'chippersnyder0227@gmail.com', 'daniellebsnyder@gmail.com');


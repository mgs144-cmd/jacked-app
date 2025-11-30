-- Fix payments for both accounts
-- Run this in Supabase SQL Editor

-- 1. Mark chippersnyder0227@gmail.com as paid and admin
UPDATE profiles 
SET has_paid_onboarding = true,
    onboarding_payment_id = 'pi_3SZCL5LrnvsxMxER1cJ7ZkB9',
    is_admin = true
WHERE email = 'chippersnyder0227@gmail.com';

-- 2. Mark jackedapp@gmail.com as paid and admin
UPDATE profiles 
SET has_paid_onboarding = true,
    onboarding_payment_id = 'pi_3SZCL5LrnvsxMxER1cJ7ZkB9',
    is_admin = true
WHERE email = 'jackedapp@gmail.com';

-- Verify the updates
SELECT id, email, username, has_paid_onboarding, is_admin, onboarding_payment_id
FROM profiles
WHERE email IN ('chippersnyder0227@gmail.com', 'jackedapp@gmail.com');

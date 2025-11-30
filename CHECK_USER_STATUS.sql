-- Comprehensive check for daniellebsnyder@gmail.com
-- Run this to see the full status

-- 1. Check if user exists in auth.users
SELECT id, email, created_at, email_confirmed_at
FROM auth.users
WHERE email = 'daniellebsnyder@gmail.com';

-- 2. Check profile status
SELECT 
    id, 
    email, 
    username, 
    full_name,
    has_paid_onboarding, 
    is_admin, 
    onboarding_payment_id,
    created_at
FROM profiles
WHERE email = 'daniellebsnyder@gmail.com';

-- 3. If profile doesn't exist but auth user does, create it:
-- (Replace USER_ID_HERE with the id from step 1)
-- INSERT INTO profiles (id, email, has_paid_onboarding, onboarding_payment_id)
-- VALUES ('USER_ID_HERE', 'daniellebsnyder@gmail.com', true, 'pi_3SZCL5LrnvsxMxER1cJ7ZkB9')
-- ON CONFLICT (id) DO UPDATE 
-- SET has_paid_onboarding = true,
--     onboarding_payment_id = 'pi_3SZCL5LrnvsxMxER1cJ7ZkB9',
--     email = 'daniellebsnyder@gmail.com';


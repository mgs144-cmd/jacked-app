-- Complete fix for daniellebsnyder@gmail.com
-- Run this entire script in Supabase SQL Editor

-- Step 1: Find the user ID from auth.users
DO $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Get the user ID
    SELECT id INTO user_uuid
    FROM auth.users
    WHERE email = 'daniellebsnyder@gmail.com';
    
    IF user_uuid IS NULL THEN
        RAISE NOTICE 'User daniellebsnyder@gmail.com not found in auth.users';
        RAISE NOTICE 'The user may need to sign up first';
    ELSE
        RAISE NOTICE 'Found user ID: %', user_uuid;
        
        -- Step 2: Insert or update the profile
        INSERT INTO profiles (
            id, 
            email, 
            has_paid_onboarding, 
            onboarding_payment_id
        )
        VALUES (
            user_uuid,
            'daniellebsnyder@gmail.com',
            true,
            'pi_3SZCL5LrnvsxMxER1cJ7ZkB9'
        )
        ON CONFLICT (id) 
        DO UPDATE SET
            email = 'daniellebsnyder@gmail.com',
            has_paid_onboarding = true,
            onboarding_payment_id = 'pi_3SZCL5LrnvsxMxER1cJ7ZkB9';
        
        RAISE NOTICE 'Profile created/updated successfully';
    END IF;
END $$;

-- Step 3: Verify the fix
SELECT 
    p.id,
    p.email,
    p.username,
    p.has_paid_onboarding,
    p.is_admin,
    p.onboarding_payment_id,
    u.email as auth_email,
    u.created_at as account_created
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE p.email = 'daniellebsnyder@gmail.com' OR u.email = 'daniellebsnyder@gmail.com';


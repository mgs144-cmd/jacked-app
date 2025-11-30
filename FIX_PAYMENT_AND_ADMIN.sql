-- Step 1: Add is_admin column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Step 2: Create index for faster admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;

-- Step 3: Mark both accounts as paid and admin
UPDATE profiles 
SET has_paid_onboarding = true,
    onboarding_payment_id = 'pi_3SZCL5LrnvsxMxER1cJ7ZkB9',
    is_admin = true
WHERE email IN ('jackedapp@gmail.com', 'chippersnyder0227@gmail.com');

-- Step 4: Verify the updates
SELECT id, email, username, has_paid_onboarding, is_admin, onboarding_payment_id
FROM profiles
WHERE email IN ('jackedapp@gmail.com', 'chippersnyder0227@gmail.com');


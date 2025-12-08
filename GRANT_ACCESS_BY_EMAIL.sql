-- Grant App Access to User by Email
-- This script bypasses the paywall for a specific user
-- Usage: Replace 'user@example.com' with the actual user email

-- OPTION 1: Grant basic app access (no premium)
UPDATE profiles
SET 
  has_paid_onboarding = true,
  onboarding_payment_id = 'manual_grant_' || CURRENT_TIMESTAMP::text,
  updated_at = NOW()
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'user@example.com'
);

-- OPTION 2: Grant app access AND premium
UPDATE profiles
SET 
  has_paid_onboarding = true,
  onboarding_payment_id = 'manual_grant_' || CURRENT_TIMESTAMP::text,
  is_premium = true,
  updated_at = NOW()
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'user@example.com'
);

-- Verify the update
SELECT 
  p.id,
  u.email,
  p.username,
  p.has_paid_onboarding,
  p.is_premium,
  p.onboarding_payment_id,
  p.updated_at
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'user@example.com';

-- ============================================
-- QUICK REFERENCE FOR COMMON SCENARIOS:
-- ============================================

-- 1. Grant access to multiple users at once:
/*
UPDATE profiles
SET 
  has_paid_onboarding = true,
  onboarding_payment_id = 'manual_grant_' || CURRENT_TIMESTAMP::text,
  updated_at = NOW()
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('user1@example.com', 'user2@example.com', 'user3@example.com')
);
*/

-- 2. Remove access (if needed):
/*
UPDATE profiles
SET 
  has_paid_onboarding = false,
  onboarding_payment_id = NULL,
  is_premium = false,
  updated_at = NOW()
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'user@example.com'
);
*/

-- 3. Check all users who have been manually granted access:
/*
SELECT 
  u.email,
  p.username,
  p.has_paid_onboarding,
  p.is_premium,
  p.onboarding_payment_id,
  p.created_at,
  p.updated_at
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.onboarding_payment_id LIKE 'manual_grant_%'
ORDER BY p.updated_at DESC;
*/

-- 4. Find user by partial email:
/*
SELECT 
  u.email,
  p.username,
  p.has_paid_onboarding,
  p.is_premium
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email ILIKE '%partialname%';
*/


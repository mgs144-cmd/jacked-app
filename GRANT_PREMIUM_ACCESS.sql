-- Grant premium access and app access to user with email njarolem@gmail.com
-- Run this in Supabase SQL Editor
-- 
-- This script:
-- 1. Grants app access (has_paid_onboarding + onboarding_payment_id)
-- 2. Grants premium access (is_premium)
-- 3. Verifies the changes

-- Step 1: Check current status
SELECT 
  'BEFORE FIX' as status,
  u.email,
  p.username,
  p.has_paid_onboarding,
  p.onboarding_payment_id,
  p.is_premium,
  CASE 
    WHEN p.onboarding_payment_id IS NULL THEN '❌ No payment ID - will cause redirect loop'
    WHEN p.onboarding_payment_id LIKE 'cs_%' THEN '✅ Valid Stripe checkout session'
    WHEN p.onboarding_payment_id LIKE 'pi_%' THEN '✅ Valid Stripe payment intent'
    WHEN p.onboarding_payment_id LIKE 'manual_%' THEN '✅ Valid manual fix ID'
    WHEN p.onboarding_payment_id LIKE 'stripe_fix_%' THEN '✅ Valid stripe fix ID'
    ELSE '⚠️ Invalid payment ID format'
  END as payment_id_status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'njarolem@gmail.com';

-- Step 2: Grant access and premium
UPDATE profiles
SET 
  has_paid_onboarding = true,
  onboarding_payment_id = COALESCE(
    onboarding_payment_id,  -- Keep existing if it's valid
    'manual_njarolem_' || EXTRACT(EPOCH FROM NOW())::text  -- Create new if missing
  ),
  is_premium = true,
  updated_at = NOW()
WHERE id IN (
  SELECT id 
  FROM auth.users 
  WHERE email = 'njarolem@gmail.com'
);

-- Step 3: Verify the fix
SELECT 
  'AFTER FIX' as status,
  u.email,
  p.username,
  p.has_paid_onboarding,
  p.onboarding_payment_id,
  p.is_premium,
  CASE 
    WHEN p.has_paid_onboarding = true AND p.is_premium = true AND p.onboarding_payment_id IS NOT NULL 
      THEN '✅ Fixed - user should have full access now'
    WHEN p.has_paid_onboarding = true AND p.onboarding_payment_id IS NOT NULL 
      THEN '⚠️ App access granted but premium not set'
    ELSE '❌ Something went wrong'
  END as final_status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'njarolem@gmail.com';


-- Fix Payments Based on Stripe Data
-- This script helps you manually update users who have paid in Stripe
-- You'll need to get the user emails from Stripe Dashboard first

-- STEP 1: Get list of all unpaid users (to compare with Stripe)
SELECT 
  id,
  email,
  username,
  created_at,
  has_paid_onboarding
FROM profiles
WHERE has_paid_onboarding = false
  AND email IS NOT NULL
ORDER BY created_at DESC;

-- STEP 2: Update specific users by email (replace with actual emails from Stripe)
-- Go to Stripe Dashboard → Payments → Find the $0.99 payments → Get customer emails
-- Then update this list:

UPDATE profiles
SET 
  has_paid_onboarding = true,
  onboarding_payment_id = 'stripe_manual_' || id::text || '_' || EXTRACT(EPOCH FROM NOW())::bigint::text
WHERE email IN (
  -- Add customer emails from Stripe here (one per line)
  -- Example:
  -- 'customer1@example.com',
  -- 'customer2@example.com'
);

-- STEP 3: Verify updates worked
SELECT 
  email,
  username,
  has_paid_onboarding,
  onboarding_payment_id,
  created_at
FROM profiles
WHERE has_paid_onboarding = true
ORDER BY created_at DESC;


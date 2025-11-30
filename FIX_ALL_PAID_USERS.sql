-- Fix All Paid Users Script
-- This script helps identify and fix users who have paid but aren't marked as paid

-- STEP 1: Check current payment status
-- Run this first to see who should be paid
SELECT 
  id,
  email,
  username,
  has_paid_onboarding,
  onboarding_payment_id,
  created_at
FROM profiles
WHERE has_paid_onboarding = false
ORDER BY created_at DESC;

-- STEP 2: If you know specific user emails who have paid, update them manually
-- Replace 'user@example.com' with actual email addresses
UPDATE profiles
SET 
  has_paid_onboarding = true,
  onboarding_payment_id = 'manual_fix_' || id::text
WHERE email IN (
  'user1@example.com',
  'user2@example.com',
  'user3@example.com'
  -- Add more emails here
);

-- STEP 3: Verify the updates
SELECT 
  id,
  email,
  username,
  has_paid_onboarding,
  onboarding_payment_id
FROM profiles
WHERE has_paid_onboarding = true
ORDER BY created_at DESC;

-- STEP 4: If you want to see all users created in the last 7 days (likely paid users)
SELECT 
  id,
  email,
  username,
  has_paid_onboarding,
  onboarding_payment_id,
  created_at
FROM profiles
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;


-- Setup Demo Account for Presentations
-- Run this in your Supabase SQL Editor

-- Step 1: Create the demo user in auth.users (if not exists)
-- You'll need to do this through Supabase Auth UI or API
-- Go to Authentication > Users > Add User
-- Email: demo@jackedlifting.com
-- Password: DemoJacked2024!
-- Auto-confirm email: YES

-- Step 2: After creating the user, get their ID and run this:
-- Replace 'DEMO_USER_ID_HERE' with the actual UUID from auth.users

-- Grant demo user full access (bypass payment)
UPDATE profiles
SET 
  has_paid_onboarding = true,
  onboarding_payment_id = 'demo_account',
  is_premium = true,
  username = 'demo_user',
  full_name = 'Demo User',
  bio = '👋 This is a demo account for presentations. Feel free to explore!'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'demo@jackedlifting.com'
);

-- Verify the demo account is set up
SELECT 
  id,
  email,
  username,
  full_name,
  has_paid_onboarding,
  is_premium
FROM profiles
WHERE username = 'demo_user';

-- ===================================
-- QUICK SETUP INSTRUCTIONS:
-- ===================================
-- 
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add User"
-- 3. Enter:
--    - Email: demo@jackedlifting.com
--    - Password: DemoJacked2024!
--    - Auto Confirm User: YES (check this box)
-- 4. Click "Create User"
-- 5. Run the UPDATE query above in SQL Editor
-- 6. Visit: https://app.jackedlifting.com/demo
-- 7. Generate QR code pointing to that URL
--
-- ===================================
-- QR CODE GENERATION:
-- ===================================
--
-- Option 1: Use a free QR code generator
-- - Go to: qr-code-generator.com or qrcode-monkey.com
-- - Enter URL: https://app.jackedlifting.com/demo
-- - Download and print
--
-- Option 2: Use Node.js to generate
-- npm install qrcode
-- node -e "require('qrcode').toFile('demo-qr.png', 'https://app.jackedlifting.com/demo')"
--
-- ===================================


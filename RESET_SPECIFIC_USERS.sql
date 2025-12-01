-- Reset specific users by email to require payment
-- Replace the email addresses below with the actual user emails

UPDATE profiles
SET 
  has_paid_onboarding = false,
  onboarding_payment_id = NULL
WHERE email IN (
  'user1@example.com',  -- Replace with first user's email
  'user2@example.com'    -- Replace with second user's email
);

-- Verify the reset worked
SELECT 
  id,
  email,
  username,
  has_paid_onboarding,
  onboarding_payment_id,
  created_at
FROM profiles
WHERE email IN (
  'user1@example.com',  -- Replace with first user's email
  'user2@example.com'    -- Replace with second user's email
)
ORDER BY created_at DESC;


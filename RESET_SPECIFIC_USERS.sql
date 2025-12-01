-- Reset specific users by email to require payment
-- These users have webhook_fix_ payment IDs which are not valid Stripe payments

UPDATE profiles
SET 
  has_paid_onboarding = false,
  onboarding_payment_id = NULL
WHERE email IN (
  'jonathanmilesfrank@gmail.com',
  'purbanek06@gmail.com',
  'oliviaselden@icloud.com'
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


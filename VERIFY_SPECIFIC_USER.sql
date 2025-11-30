-- Verify if a specific user (from webhook) is marked as paid
-- Replace the user ID with the one from the webhook response

SELECT 
  id,
  email,
  username,
  has_paid_onboarding,
  onboarding_payment_id,
  created_at
FROM profiles
WHERE id = '5f6e1aa9-619c-4348-b2b4-96737d8b7caf';

-- If has_paid_onboarding is false, fix it:
UPDATE profiles
SET 
  has_paid_onboarding = true,
  onboarding_payment_id = 'cs_live_a1RuMdwmDKQabU00owc2uhjlZ3Ug0l0hojNcIxgdu95AEd22skka7kNNzc'
WHERE id = '5f6e1aa9-619c-4348-b2b4-96737d8b7caf';

-- Check all users from recent webhook events
-- Get user IDs from all the webhook responses and check them:
SELECT 
  id,
  email,
  username,
  has_paid_onboarding,
  onboarding_payment_id,
  created_at
FROM profiles
WHERE id IN (
  '5f6e1aa9-619c-4348-b2b4-96737d8b7caf',
  -- Add other user IDs from webhook responses here
);


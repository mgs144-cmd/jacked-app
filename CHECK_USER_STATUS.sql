-- Check user status for clareamurray2006@icloud.com
-- This will show all relevant information about the user

SELECT 
  id,
  email,
  username,
  full_name,
  has_paid_onboarding,
  onboarding_payment_id,
  created_at,
  updated_at
FROM profiles
WHERE email = 'clareamurray2006@icloud.com';

-- Also check if there's an auth user
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data
FROM auth.users
WHERE email = 'clareamurray2006@icloud.com';

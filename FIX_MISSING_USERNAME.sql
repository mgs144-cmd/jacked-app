-- Fix missing username for clareamurray2006@icloud.com
-- This will set a username based on the email if it's null

UPDATE profiles
SET 
  username = COALESCE(
    username,
    -- Use the part before @ as username, or generate one
    LOWER(SPLIT_PART(email, '@', 1))
  ),
  updated_at = NOW()
WHERE email = 'clareamurray2006@icloud.com'
  AND username IS NULL;

-- Verify the update
SELECT 
  id,
  email,
  username,
  full_name,
  has_paid_onboarding,
  created_at
FROM profiles
WHERE email = 'clareamurray2006@icloud.com';

-- If you want to set a specific username instead, use this:
-- UPDATE profiles
-- SET 
--   username = 'clareamurray2006',  -- Replace with desired username
--   updated_at = NOW()
-- WHERE email = 'clareamurray2006@icloud.com';


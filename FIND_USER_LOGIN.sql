-- Find user login information by email or username
-- Replace the email or username below with the information you have

-- Option 1: Search by email
SELECT 
  id,
  email,
  username,
  full_name,
  created_at,
  has_paid_onboarding
FROM profiles
WHERE email ILIKE '%friend@example.com%'  -- Replace with friend's email (partial match)
   OR email = 'friend@example.com';        -- Or exact match

-- Option 2: Search by username
SELECT 
  id,
  email,
  username,
  full_name,
  created_at,
  has_paid_onboarding
FROM profiles
WHERE username ILIKE '%friendusername%'   -- Replace with friend's username (partial match)
   OR username = 'friendusername';         -- Or exact match

-- Option 3: Search by full name
SELECT 
  id,
  email,
  username,
  full_name,
  created_at,
  has_paid_onboarding
FROM profiles
WHERE full_name ILIKE '%Friend Name%';    -- Replace with friend's name (partial match)

-- Option 4: List all users (to help identify)
SELECT 
  id,
  email,
  username,
  full_name,
  created_at,
  has_paid_onboarding
FROM profiles
ORDER BY created_at DESC
LIMIT 50;

-- Note: Passwords are encrypted and cannot be retrieved
-- You can only find the email/username to help them reset their password
-- Use Supabase Auth → Users to reset password if needed


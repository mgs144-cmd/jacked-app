-- =====================================================
-- DELETE SPECIFIC TEST ACCOUNTS
-- =====================================================

-- First, check what accounts exist
SELECT 
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- To delete specific accounts, uncomment and replace with actual emails:
-- DELETE FROM auth.users WHERE email = 'test1@example.com';
-- DELETE FROM auth.users WHERE email = 'test2@example.com';

-- Or delete ALL users (use carefully!):
-- DELETE FROM auth.users;

-- Note: Deleting from auth.users will CASCADE delete:
-- - Their profile (profiles table)
-- - All their posts
-- - All their likes
-- - All their comments
-- - All their follows/follow requests

-- =====================================================
-- DELETE TEST ACCOUNTS BY USERNAME
-- =====================================================

-- First, see all accounts with their usernames
SELECT 
  au.id,SI
  au.email,
  pr.username,
  pr.full_name,
  au.created_at
FROM auth.users au
LEFT JOIN profiles pr ON pr.id = au.id
ORDER BY au.created_at DESC;

-- To delete specific accounts by username, uncomment and replace:
-- DELETE FROM auth.users 
-- WHERE id IN (
--   SELECT id FROM profiles WHERE username = 'testuser1'
-- );

-- DELETE FROM auth.users 
-- WHERE id IN (
--   SELECT id FROM profiles WHERE username = 'testuser2'
-- );

-- Or delete multiple at once:
-- DELETE FROM auth.users 
-- WHERE id IN (
--   SELECT id FROM profiles WHERE username IN ('testuser1', 'testuser2', 'testuser3')
-- );

-- To delete ALL accounts (careful!):
-- DELETE FROM auth.users;

-- Note: This will CASCADE delete:
-- - Their profile
-- - All their posts, likes, comments
-- - All their follows/follow requests



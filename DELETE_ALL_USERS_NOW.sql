-- =====================================================
-- DELETE ALL USERS RIGHT NOW
-- Just copy/paste and run this entire file
-- WARNING: This deletes ALL accounts and ALL data!
-- =====================================================

DELETE FROM auth.users;

-- Verify deletion
SELECT 
  'Users remaining' as info,
  COUNT(*) as count
FROM auth.users;

SELECT 
  'Profiles remaining' as info,
  COUNT(*) as count
FROM profiles;

SELECT 
  'Posts remaining' as info,
  COUNT(*) as count
FROM posts;



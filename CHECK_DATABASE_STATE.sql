-- Check current database state
SELECT 
  'Auth Users' as table_name,
  COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
  'Profiles' as table_name,
  COUNT(*) as count
FROM profiles
UNION ALL
SELECT 
  'Posts' as table_name,
  COUNT(*) as count
FROM posts
UNION ALL
SELECT 
  'Follows' as table_name,
  COUNT(*) as count
FROM follows;

-- Check which auth users are missing profiles
SELECT 
  au.id,
  au.email,
  CASE WHEN p.id IS NULL THEN '❌ NO PROFILE' ELSE '✅ HAS PROFILE' END as status
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id;

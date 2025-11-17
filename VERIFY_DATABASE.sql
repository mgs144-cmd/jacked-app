-- =====================================================
-- VERIFY DATABASE STATE
-- =====================================================

-- Check how many accounts exist
SELECT 
  'Total Users' as info,
  COUNT(*) as count
FROM auth.users;

-- Show all accounts
SELECT 
  au.email,
  pr.username,
  pr.full_name,
  au.created_at
FROM auth.users au
LEFT JOIN profiles pr ON pr.id = au.id
ORDER BY au.created_at DESC;

-- Check how many posts exist
SELECT 
  'Total Posts' as info,
  COUNT(*) as count
FROM posts;

-- Show all posts
SELECT 
  pr.username as posted_by,
  p.content,
  p.media_type,
  p.created_at
FROM posts p
LEFT JOIN profiles pr ON pr.id = p.user_id
ORDER BY p.created_at DESC;



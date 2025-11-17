-- =====================================================
-- CHECK EVERYTHING IN DATABASE
-- =====================================================

-- 1. Count all users
SELECT 'Total Users' as info, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'Total Profiles' as info, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'Total Posts' as info, COUNT(*) as count FROM posts
UNION ALL
SELECT 'Total Likes' as info, COUNT(*) as count FROM likes
UNION ALL
SELECT 'Total Comments' as info, COUNT(*) as count FROM comments
UNION ALL
SELECT 'Total Follows' as info, COUNT(*) as count FROM follows;

-- 2. Show all users
SELECT 
  'USER' as type,
  au.email,
  pr.username,
  au.created_at
FROM auth.users au
LEFT JOIN profiles pr ON pr.id = au.id
ORDER BY au.created_at DESC;

-- 3. Show all posts (if any)
SELECT 
  'POST' as type,
  pr.username as posted_by,
  LEFT(p.content, 50) as content_preview,
  p.media_type,
  p.created_at
FROM posts p
LEFT JOIN profiles pr ON pr.id = p.user_id
ORDER BY p.created_at DESC;



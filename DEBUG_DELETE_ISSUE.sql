-- =====================================================
-- DEBUG: Why can't user delete their post?
-- =====================================================

-- Check all posts and their owners
SELECT 
  p.id as post_id,
  p.user_id as post_owner_id,
  pr.username as post_owner_username,
  au.email as post_owner_email,
  p.content as post_content,
  p.created_at
FROM posts p
LEFT JOIN profiles pr ON pr.id = p.user_id
LEFT JOIN auth.users au ON au.id = p.user_id
ORDER BY p.created_at DESC;

-- Check RLS policies on posts table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'posts'
ORDER BY policyname;

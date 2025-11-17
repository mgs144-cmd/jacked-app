-- =====================================================
-- CLEANUP DATABASE - DELETE POSTS & TEST ACCOUNTS
-- Make sure you're in the RIGHT Supabase project!
-- Project URL should contain: hksxpquubhwwxagiurdy
-- =====================================================

-- STEP 1: See what you have now
SELECT '=== CURRENT STATE ===' as status;

SELECT 
  'Total Users' as info, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 
  'Total Profiles' as info, COUNT(*) as count FROM profiles
UNION ALL
SELECT 
  'Total Posts' as info, COUNT(*) as count FROM posts
UNION ALL
SELECT 
  'Total Likes' as info, COUNT(*) as count FROM likes
UNION ALL
SELECT 
  'Total Comments' as info, COUNT(*) as count FROM comments
UNION ALL
SELECT 
  'Total Follows' as info, COUNT(*) as count FROM follows;

-- Show all users
SELECT '=== ALL USERS ===' as status;
SELECT 
  au.email,
  pr.username,
  pr.full_name,
  au.created_at
FROM auth.users au
LEFT JOIN profiles pr ON pr.id = au.id
ORDER BY au.created_at DESC;

-- Show all posts
SELECT '=== ALL POSTS ===' as status;
SELECT 
  pr.username as posted_by,
  LEFT(p.content, 100) as content_preview,
  p.media_type,
  p.created_at
FROM posts p
LEFT JOIN profiles pr ON pr.id = p.user_id
ORDER BY p.created_at DESC;

-- =====================================================
-- STEP 2: DELETE ALL POSTS
-- =====================================================

DELETE FROM posts;

-- =====================================================
-- STEP 3: DELETE TEST USERS (OPTIONAL)
-- =====================================================

-- Option A: Delete by USERNAME
-- Uncomment and replace with actual usernames:

-- DELETE FROM auth.users 
-- WHERE id IN (
--   SELECT id FROM profiles WHERE username = 'testuser1'
-- );

-- DELETE FROM auth.users 
-- WHERE id IN (
--   SELECT id FROM profiles WHERE username = 'testuser2'
-- );

-- Option B: Delete MULTIPLE usernames at once (easier!)
-- Uncomment and replace with actual usernames:

-- DELETE FROM auth.users 
-- WHERE id IN (
--   SELECT id FROM profiles WHERE username IN ('testuser1', 'testuser2', 'testuser3')
-- );

-- Option C: Delete by EMAIL
-- Uncomment and replace with actual emails:

-- DELETE FROM auth.users 
-- WHERE email IN ('test1@example.com', 'test2@example.com');

-- Option D: Delete ALL users (careful!)
-- Uncomment the line below to delete EVERYONE:

-- DELETE FROM auth.users;

-- =====================================================
-- STEP 4: VERIFY CLEANUP
-- =====================================================

SELECT '=== AFTER CLEANUP ===' as status;

SELECT 
  'Remaining Users' as info, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 
  'Remaining Profiles' as info, COUNT(*) as count FROM profiles
UNION ALL
SELECT 
  'Remaining Posts' as info, COUNT(*) as count FROM posts
UNION ALL
SELECT 
  'Remaining Likes' as info, COUNT(*) as count FROM likes
UNION ALL
SELECT 
  'Remaining Comments' as info, COUNT(*) as count FROM comments
UNION ALL
SELECT 
  'Remaining Follows' as info, COUNT(*) as count FROM follows;

-- SUCCESS!
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '✅ CLEANUP COMPLETE!';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ All posts deleted';
  RAISE NOTICE '✅ Likes & comments deleted (cascaded)';
  RAISE NOTICE '';
  RAISE NOTICE 'ℹ️  User accounts: Still exist (unless you uncommented the delete line)';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Refresh localhost:3000 to see changes!';
  RAISE NOTICE '';
END $$;


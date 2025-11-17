-- =====================================================
-- CLEAR ALL POSTS AND RELATED DATA
-- =====================================================

-- First, show what will be deleted
SELECT 
  'Posts to delete' as info,
  COUNT(*) as count
FROM posts;

-- Delete all posts (this will CASCADE delete all likes and comments too)
DELETE FROM posts;

-- Verify deletion
SELECT 
  'Remaining Posts' as table_name,
  COUNT(*) as count
FROM posts
UNION ALL
SELECT 
  'Remaining Likes' as table_name,
  COUNT(*) as count
FROM likes
UNION ALL
SELECT 
  'Remaining Comments' as table_name,
  COUNT(*) as count
FROM comments;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '✅ ALL POSTS CLEARED!';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Posts deleted: All';
  RAISE NOTICE '✅ Likes deleted: All (cascaded)';
  RAISE NOTICE '✅ Comments deleted: All (cascaded)';
  RAISE NOTICE '';
  RAISE NOTICE '🆕 Users can start fresh!';
  RAISE NOTICE '';
END $$;

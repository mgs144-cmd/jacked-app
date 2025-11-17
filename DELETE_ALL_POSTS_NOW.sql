-- =====================================================
-- DELETE ALL POSTS RIGHT NOW
-- Just copy/paste and run this entire file
-- =====================================================

DELETE FROM posts;

-- Verify deletion
SELECT 
  'Posts remaining' as info,
  COUNT(*) as count
FROM posts;



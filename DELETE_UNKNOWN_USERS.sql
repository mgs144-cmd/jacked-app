-- =====================================================
-- DELETE "UNKNOWN USER" ACCOUNTS
-- =====================================================

-- First, let's see what accounts match "unknown user"
SELECT id, username, full_name, created_at
FROM profiles
WHERE LOWER(username) LIKE '%unknown%'
   OR LOWER(full_name) LIKE '%unknown%'
   OR username IS NULL
   OR (username = '' AND full_name IS NULL)
ORDER BY created_at;

-- Delete accounts where username or full_name contains "unknown" (case insensitive)
-- This will also cascade delete their posts, likes, comments, follows, etc.
DELETE FROM profiles
WHERE LOWER(username) LIKE '%unknown%'
   OR LOWER(full_name) LIKE '%unknown%'
   OR (username IS NULL AND full_name IS NULL)
   OR (username = '' AND full_name IS NULL);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '✅ DELETED UNKNOWN USER ACCOUNTS!';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '';
END $$;


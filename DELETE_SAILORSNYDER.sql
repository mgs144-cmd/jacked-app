-- =====================================================
-- DELETE USER: SailorSnyder
-- This will delete the user and all associated data
-- =====================================================

-- First, let's see what we're deleting
SELECT id, username, email, created_at, has_paid_onboarding
FROM profiles
WHERE username = 'SailorSnyder';

-- Delete the user from auth.users (this will cascade delete profile and all related data)
-- Note: You need to delete from auth.users first, or use the Supabase dashboard
-- This script deletes from profiles, which will cascade delete posts, likes, comments, etc.

-- Option 1: Delete from profiles (cascades to posts, likes, comments, follows, etc.)
DELETE FROM profiles
WHERE username = 'SailorSnyder';

-- Option 2: If you need to delete from auth.users as well, use Supabase Dashboard:
-- 1. Go to Authentication → Users
-- 2. Find the user by email
-- 3. Click "..." → Delete user

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '✅ DELETED USER: SailorSnyder';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Note: If you want to delete from auth.users too,';
  RAISE NOTICE '    use Supabase Dashboard → Authentication → Users';
  RAISE NOTICE '';
END $$;


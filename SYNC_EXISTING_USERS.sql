-- =====================================================
-- SYNC EXISTING AUTH USERS TO PROFILES
-- Run this if you have existing auth accounts but no profiles
-- =====================================================

-- Create profiles for any auth.users that don't have them yet
INSERT INTO public.profiles (id, username, full_name, avatar_url)
SELECT 
  au.id,
  au.raw_user_meta_data->>'username' AS username,
  au.raw_user_meta_data->>'full_name' AS full_name,
  au.raw_user_meta_data->>'avatar_url' AS avatar_url
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- Success message
DO $$
DECLARE
  synced_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO synced_count
  FROM auth.users au
  WHERE EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = au.id);
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '✅ EXISTING USERS SYNCED!';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Total profiles: %', synced_count;
  RAISE NOTICE '';
  RAISE NOTICE '🚀 You can now use your existing account!';
  RAISE NOTICE '';
END $$;

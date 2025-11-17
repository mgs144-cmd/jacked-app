-- =====================================================
-- ADD PROFILE MUSIC FEATURE
-- Allows users to add a song to their profile
-- =====================================================

-- Add song fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS profile_song_title TEXT,
ADD COLUMN IF NOT EXISTS profile_song_artist TEXT,
ADD COLUMN IF NOT EXISTS profile_song_url TEXT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '✅ PROFILE MUSIC FEATURE ADDED!';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Added profile_song_title, profile_song_artist, profile_song_url';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Users can now add songs to their profiles!';
  RAISE NOTICE '';
END $$;



-- =====================================================
-- ADD SPOTIFY SUPPORT TO MUSIC FEATURES
-- =====================================================

-- Add spotify_id column to posts table (for post songs)
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS song_spotify_id TEXT;

-- Add spotify_id column to profiles table (for profile songs)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS profile_song_spotify_id TEXT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '✅ SPOTIFY SUPPORT ADDED!';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Added song_spotify_id to posts';
  RAISE NOTICE '✅ Added profile_song_spotify_id to profiles';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Users can now search and select songs!';
  RAISE NOTICE '';
END $$;



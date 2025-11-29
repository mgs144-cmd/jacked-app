-- =====================================================
-- ADD SPOTIFY ID TO POSTS TABLE
-- Fixes error: Could not find the 'song_spotify_id' column
-- =====================================================

-- Add song_spotify_id column to posts table if it doesn't exist
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS song_spotify_id TEXT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '✅ ADDED song_spotify_id TO POSTS!';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Posts can now store Spotify song IDs!';
  RAISE NOTICE '';
END $$;


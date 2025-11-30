-- Complete Music Setup (No Spotify Required)
-- Run this in Supabase SQL Editor

-- Step 1: Add music columns to posts table
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS song_title TEXT,
ADD COLUMN IF NOT EXISTS song_artist TEXT,
ADD COLUMN IF NOT EXISTS song_url TEXT,
ADD COLUMN IF NOT EXISTS song_album_art_url TEXT;

-- Step 2: Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND column_name IN ('song_title', 'song_artist', 'song_url', 'song_album_art_url')
ORDER BY column_name;

-- After running this SQL, you also need to:
-- 1. Go to Supabase Dashboard → Storage
-- 2. Create a bucket named "post-songs" (make it PUBLIC)
-- 3. Create a bucket named "profile-songs" (make it PUBLIC)
-- 4. Set up RLS policies to allow authenticated users to upload


-- Simple music columns for posts table (no Spotify required)
-- Run this in Supabase SQL Editor

-- Add music-related columns to posts table if they don't exist
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS song_title TEXT,
ADD COLUMN IF NOT EXISTS song_artist TEXT,
ADD COLUMN IF NOT EXISTS song_url TEXT,
ADD COLUMN IF NOT EXISTS song_album_art_url TEXT;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND column_name IN ('song_title', 'song_artist', 'song_url', 'song_album_art_url')
ORDER BY column_name;


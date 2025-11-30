-- Complete Profile Song Columns Migration
-- Run this in Supabase SQL Editor

-- Add all profile song columns
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS profile_song_title TEXT,
ADD COLUMN IF NOT EXISTS profile_song_artist TEXT,
ADD COLUMN IF NOT EXISTS profile_song_url TEXT,
ADD COLUMN IF NOT EXISTS profile_song_spotify_id TEXT,
ADD COLUMN IF NOT EXISTS profile_song_album_art_url TEXT;

-- Verify all columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name LIKE 'profile_song%'
ORDER BY column_name;

-- Expected output should show:
-- profile_song_album_art_url | text
-- profile_song_artist        | text
-- profile_song_spotify_id    | text
-- profile_song_title         | text
-- profile_song_url           | text


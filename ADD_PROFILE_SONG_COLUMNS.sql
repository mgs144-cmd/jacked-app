-- Add profile song columns to profiles table
-- Run this in Supabase SQL Editor

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS profile_song_title TEXT,
ADD COLUMN IF NOT EXISTS profile_song_artist TEXT,
ADD COLUMN IF NOT EXISTS profile_song_url TEXT,
ADD COLUMN IF NOT EXISTS profile_song_spotify_id TEXT,
ADD COLUMN IF NOT EXISTS profile_song_album_art_url TEXT;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name LIKE 'profile_song%'
ORDER BY column_name;


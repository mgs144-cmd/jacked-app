-- Add start time column for profile songs
-- This allows users to skip to a specific part of the song (e.g., chorus)

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_song_start_time INTEGER DEFAULT NULL;

COMMENT ON COLUMN profiles.profile_song_start_time IS 'Start time in seconds for profile song playback (e.g., 30 to start at 30 seconds)';


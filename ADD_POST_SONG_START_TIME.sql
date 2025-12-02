-- Add start time column for post songs
-- This allows users to skip to a specific part of the song in their posts

ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS song_start_time INTEGER DEFAULT NULL;

COMMENT ON COLUMN posts.song_start_time IS 'Start time in seconds for post song playback (e.g., 30 to start at 30 seconds)';


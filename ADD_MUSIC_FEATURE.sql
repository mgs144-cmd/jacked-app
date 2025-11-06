-- Add Music/Song Feature to Posts and Profiles

-- Add song fields to posts table
ALTER TABLE posts
ADD COLUMN song_title TEXT,
ADD COLUMN song_artist TEXT,
ADD COLUMN song_url TEXT,
ADD COLUMN song_cover_url TEXT;

-- Add song fields to profiles table (profile music)
ALTER TABLE profiles
ADD COLUMN profile_song_title TEXT,
ADD COLUMN profile_song_artist TEXT,
ADD COLUMN profile_song_url TEXT;

-- Create a songs table for better organization (optional but recommended)
CREATE TABLE IF NOT EXISTS songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT,
  cover_url TEXT,
  preview_url TEXT,
  spotify_id TEXT,
  apple_music_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on songs table
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view songs
CREATE POLICY "Anyone can view songs"
ON songs FOR SELECT
TO public
USING (true);

-- Policy: Authenticated users can add songs
CREATE POLICY "Authenticated users can add songs"
ON songs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create an index for faster song searches
CREATE INDEX IF NOT EXISTS idx_songs_title ON songs(title);
CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist);

-- Optional: Create a junction table for post-song relationships (if you want multiple songs per post)
CREATE TABLE IF NOT EXISTS post_songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(post_id, song_id)
);

-- Enable RLS on post_songs
ALTER TABLE post_songs ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view post songs
CREATE POLICY "Anyone can view post songs"
ON post_songs FOR SELECT
TO public
USING (true);

-- Policy: Post owner can add songs to their posts
CREATE POLICY "Post owner can add songs"
ON post_songs FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = post_songs.post_id
    AND posts.user_id = auth.uid()
  )
);

-- Policy: Post owner can remove songs from their posts
CREATE POLICY "Post owner can remove songs"
ON post_songs FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = post_songs.post_id
    AND posts.user_id = auth.uid()
  )
);

COMMENT ON COLUMN posts.song_title IS 'Song title attached to this post';
COMMENT ON COLUMN posts.song_artist IS 'Artist name for the song attached to this post';
COMMENT ON COLUMN posts.song_url IS 'URL to play/preview the song';
COMMENT ON COLUMN posts.song_cover_url IS 'Album/song cover image URL';
COMMENT ON COLUMN profiles.profile_song_title IS 'User profile song/anthem title';
COMMENT ON COLUMN profiles.profile_song_artist IS 'User profile song artist';
COMMENT ON COLUMN profiles.profile_song_url IS 'User profile song preview URL';



-- Add Social Features: Following System and Post Privacy

-- 1. Create follows table
CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(follower_id, following_id),
  -- Prevent self-following
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at);

-- 2. Add post privacy field
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false NOT NULL;

CREATE INDEX IF NOT EXISTS idx_posts_is_private ON posts(is_private);

-- 3. Add follower/following counts to profiles (optional, can be calculated)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- 4. Enable RLS on follows table
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for follows table

-- Policy: Anyone can view follows (to see who follows who)
CREATE POLICY "Anyone can view follows"
ON follows FOR SELECT
TO public
USING (true);

-- Policy: Authenticated users can follow others
CREATE POLICY "Users can follow others"
ON follows FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = follower_id);

-- Policy: Users can unfollow (delete their own follows)
CREATE POLICY "Users can unfollow"
ON follows FOR DELETE
TO authenticated
USING (auth.uid() = follower_id);

-- 6. Update posts RLS policies to respect privacy

-- Drop the old "Anyone can view posts" policy if it exists
DROP POLICY IF EXISTS "Anyone can view posts" ON posts;

-- New policy: Users can view public posts OR private posts from people they follow OR their own posts
CREATE POLICY "Users can view posts based on privacy"
ON posts FOR SELECT
TO public
USING (
  is_private = false  -- Public posts
  OR 
  user_id = auth.uid()  -- Own posts
  OR
  (
    is_private = true 
    AND EXISTS (
      SELECT 1 FROM follows 
      WHERE follows.following_id = posts.user_id 
      AND follows.follower_id = auth.uid()
    )
  )  -- Private posts from followed users
);

-- 7. Create function to update follower counts
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment following count for follower
    UPDATE profiles 
    SET following_count = following_count + 1 
    WHERE id = NEW.follower_id;
    
    -- Increment followers count for followed user
    UPDATE profiles 
    SET followers_count = followers_count + 1 
    WHERE id = NEW.following_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement following count for follower
    UPDATE profiles 
    SET following_count = GREATEST(following_count - 1, 0)
    WHERE id = OLD.follower_id;
    
    -- Decrement followers count for followed user
    UPDATE profiles 
    SET followers_count = GREATEST(followers_count - 1, 0)
    WHERE id = OLD.following_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create trigger to automatically update counts
DROP TRIGGER IF EXISTS update_follower_counts_trigger ON follows;
CREATE TRIGGER update_follower_counts_trigger
AFTER INSERT OR DELETE ON follows
FOR EACH ROW
EXECUTE FUNCTION update_follower_counts();

-- 9. Initialize follower counts for existing users
UPDATE profiles p
SET 
  followers_count = (SELECT COUNT(*) FROM follows WHERE following_id = p.id),
  following_count = (SELECT COUNT(*) FROM follows WHERE follower_id = p.id);

-- 10. Comments on tables and columns
COMMENT ON TABLE follows IS 'User following relationships';
COMMENT ON COLUMN follows.follower_id IS 'User who is following';
COMMENT ON COLUMN follows.following_id IS 'User being followed';
COMMENT ON COLUMN posts.is_private IS 'Whether the post is private (only visible to followers)';
COMMENT ON COLUMN profiles.followers_count IS 'Number of followers this user has';
COMMENT ON COLUMN profiles.following_count IS 'Number of users this user is following';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Social features added successfully!';
  RAISE NOTICE '- follows table created';
  RAISE NOTICE '- Post privacy (is_private) added';
  RAISE NOTICE '- Follower/following counts added to profiles';
  RAISE NOTICE '- RLS policies updated';
END $$;



-- Add is_log_only column for personal logging posts (not shown in anyone's feed)
-- Run this in Supabase SQL Editor

-- 1. Add the column
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS is_log_only BOOLEAN DEFAULT false;

-- 2. Create index for feed queries
CREATE INDEX IF NOT EXISTS idx_posts_is_log_only ON posts(is_log_only);

-- 3. Update RLS - log-only posts visible only to author
DROP POLICY IF EXISTS "Users can view posts based on privacy and account type" ON posts;
CREATE POLICY "Users can view posts based on privacy and account type"
ON posts FOR SELECT
TO public
USING (
  user_id = auth.uid()
  OR
  (
    COALESCE(is_log_only, false) = false
    AND (
      (
        is_private = false 
        AND NOT EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = posts.user_id 
          AND profiles.is_account_private = true
        )
      )
      OR
      EXISTS (
        SELECT 1 FROM follows 
        WHERE follows.following_id = posts.user_id 
        AND follows.follower_id = auth.uid()
      )
    )
  )
);

COMMENT ON COLUMN posts.is_log_only IS 'When true, post is only visible to author - for personal logging, not shown in feeds';

-- Add is_archived column to posts table
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_posts_is_archived ON posts(is_archived);

-- Add comment
COMMENT ON COLUMN posts.is_archived IS 'If true, post is archived and hidden from public view and profile, but visible to owner';


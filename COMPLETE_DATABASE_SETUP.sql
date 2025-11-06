-- =====================================================
-- COMPLETE DATABASE SETUP FOR JACKED APP
-- Run this ONCE in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PART 1: BASE SCHEMA (Original Tables)
-- =====================================================

-- 1. Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_premium BOOLEAN DEFAULT false,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  is_account_private BOOLEAN DEFAULT false,
  hide_follower_count BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video')),
  song_title TEXT,
  song_artist TEXT,
  song_url TEXT,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create likes table
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(post_id, user_id)
);

-- 4. Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create follows table
CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- 6. Create follow_requests table (for private accounts)
CREATE TABLE IF NOT EXISTS follow_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  target_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(requester_id, target_id),
  CHECK (requester_id != target_id)
);

-- =====================================================
-- PART 2: INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follow_requests_requester ON follow_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_follow_requests_target ON follow_requests(target_id);
CREATE INDEX IF NOT EXISTS idx_follow_requests_status ON follow_requests(status);

-- =====================================================
-- PART 3: ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_requests ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Posts RLS Policies
DROP POLICY IF EXISTS "Users can view posts based on privacy and account type" ON posts;
CREATE POLICY "Users can view posts based on privacy and account type"
ON posts FOR SELECT
TO public
USING (
  -- Own posts
  user_id = auth.uid()
  OR
  -- Public posts from public accounts
  (
    is_private = false 
    AND NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = posts.user_id 
      AND profiles.is_account_private = true
    )
  )
  OR
  -- Posts from followed users (public or private posts)
  EXISTS (
    SELECT 1 FROM follows 
    WHERE follows.following_id = posts.user_id 
    AND follows.follower_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can create posts" ON posts;
CREATE POLICY "Users can create posts"
ON posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own posts" ON posts;
CREATE POLICY "Users can update own posts"
ON posts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
CREATE POLICY "Users can delete own posts"
ON posts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Likes RLS Policies
DROP POLICY IF EXISTS "Users can view all likes" ON likes;
CREATE POLICY "Users can view all likes"
ON likes FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Users can create likes" ON likes;
CREATE POLICY "Users can create likes"
ON likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own likes" ON likes;
CREATE POLICY "Users can delete own likes"
ON likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Comments RLS Policies
DROP POLICY IF EXISTS "Users can view all comments" ON comments;
CREATE POLICY "Users can view all comments"
ON comments FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Users can create comments" ON comments;
CREATE POLICY "Users can create comments"
ON comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON comments;
CREATE POLICY "Users can update own comments"
ON comments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
CREATE POLICY "Users can delete own comments"
ON comments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Follows RLS Policies
DROP POLICY IF EXISTS "Users can view all follows" ON follows;
CREATE POLICY "Users can view all follows"
ON follows FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Users can follow others" ON follows;
CREATE POLICY "Users can follow others"
ON follows FOR INSERT
TO authenticated
WITH CHECK (
  follower_id = auth.uid()
  AND (
    -- Can follow if account is public
    NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = follows.following_id 
      AND profiles.is_account_private = true
    )
    OR
    -- Can follow if private account but request is accepted
    EXISTS (
      SELECT 1 FROM follow_requests 
      WHERE follow_requests.requester_id = auth.uid() 
      AND follow_requests.target_id = follows.following_id
      AND follow_requests.status = 'accepted'
    )
  )
);

DROP POLICY IF EXISTS "Users can unfollow" ON follows;
CREATE POLICY "Users can unfollow"
ON follows FOR DELETE
TO authenticated
USING (auth.uid() = follower_id);

-- Follow Requests RLS Policies
DROP POLICY IF EXISTS "Users can view their own follow requests" ON follow_requests;
CREATE POLICY "Users can view their own follow requests"
ON follow_requests FOR SELECT
TO authenticated
USING (
  requester_id = auth.uid() OR target_id = auth.uid()
);

DROP POLICY IF EXISTS "Users can send follow requests" ON follow_requests;
CREATE POLICY "Users can send follow requests"
ON follow_requests FOR INSERT
TO authenticated
WITH CHECK (requester_id = auth.uid());

DROP POLICY IF EXISTS "Target user can update request status" ON follow_requests;
CREATE POLICY "Target user can update request status"
ON follow_requests FOR UPDATE
TO authenticated
USING (target_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own requests" ON follow_requests;
CREATE POLICY "Users can delete their own requests"
ON follow_requests FOR DELETE
TO authenticated
USING (requester_id = auth.uid());

-- =====================================================
-- PART 4: TRIGGERS AND FUNCTIONS
-- =====================================================

-- Function: Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function: Auto-handle follow requests (public = auto-accept)
CREATE OR REPLACE FUNCTION handle_follow_request()
RETURNS TRIGGER AS $$
DECLARE
  target_is_private BOOLEAN;
BEGIN
  -- Check if target account is private
  SELECT is_account_private INTO target_is_private
  FROM profiles
  WHERE id = NEW.target_id;

  -- If account is public, auto-accept and create follow relationship
  IF NOT target_is_private THEN
    NEW.status := 'accepted';
    NEW.updated_at := NOW();
    
    -- Create the follow relationship
    INSERT INTO follows (follower_id, following_id)
    VALUES (NEW.requester_id, NEW.target_id)
    ON CONFLICT (follower_id, following_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auto_accept_follow_request ON follow_requests;
CREATE TRIGGER auto_accept_follow_request
BEFORE INSERT ON follow_requests
FOR EACH ROW
EXECUTE FUNCTION handle_follow_request();

-- Function: Create follow when request is accepted
CREATE OR REPLACE FUNCTION create_follow_on_accept()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changed to accepted, create follow relationship
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    INSERT INTO follows (follower_id, following_id)
    VALUES (NEW.requester_id, NEW.target_id)
    ON CONFLICT (follower_id, following_id) DO NOTHING;
    
    NEW.updated_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS create_follow_on_accept_trigger ON follow_requests;
CREATE TRIGGER create_follow_on_accept_trigger
BEFORE UPDATE ON follow_requests
FOR EACH ROW
EXECUTE FUNCTION create_follow_on_accept();

-- Function: Cleanup follow request when unfollowing
CREATE OR REPLACE FUNCTION cleanup_follow_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete the follow request when unfollowing
  DELETE FROM follow_requests
  WHERE requester_id = OLD.follower_id
  AND target_id = OLD.following_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS cleanup_follow_request_trigger ON follows;
CREATE TRIGGER cleanup_follow_request_trigger
AFTER DELETE ON follows
FOR EACH ROW
EXECUTE FUNCTION cleanup_follow_request();

-- =====================================================
-- PART 5: COMMENTS
-- =====================================================

COMMENT ON TABLE profiles IS 'User profiles extending auth.users';
COMMENT ON TABLE posts IS 'User posts with optional media';
COMMENT ON TABLE likes IS 'Post likes';
COMMENT ON TABLE comments IS 'Post comments';
COMMENT ON TABLE follows IS 'User follow relationships';
COMMENT ON TABLE follow_requests IS 'Follow requests for private accounts';

COMMENT ON COLUMN profiles.is_account_private IS 'Whether the account is private (requires follow approval)';
COMMENT ON COLUMN profiles.hide_follower_count IS 'Whether to hide follower/following counts on profile';
COMMENT ON COLUMN posts.is_private IS 'Whether post is visible only to followers';
COMMENT ON COLUMN follow_requests.status IS 'Status: pending, accepted, or rejected';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '✅ DATABASE SETUP COMPLETE!';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Created tables:';
  RAISE NOTICE '   - profiles (with privacy settings)';
  RAISE NOTICE '   - posts (with music & privacy)';
  RAISE NOTICE '   - likes';
  RAISE NOTICE '   - comments';
  RAISE NOTICE '   - follows';
  RAISE NOTICE '   - follow_requests';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Configured:';
  RAISE NOTICE '   - Row Level Security (RLS)';
  RAISE NOTICE '   - Auto-create profile trigger';
  RAISE NOTICE '   - Auto-accept public follow requests';
  RAISE NOTICE '   - Privacy features';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Ready to use! Refresh your app and try:';
  RAISE NOTICE '   1. Creating a post';
  RAISE NOTICE '   2. Following a user';
  RAISE NOTICE '   3. Setting your account to private';
  RAISE NOTICE '';
END $$;


-- Upgrade Social Features to Instagram-style

-- 1. Add account privacy settings to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_account_private BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS hide_follower_count BOOLEAN DEFAULT false;

-- 2. Create follow_requests table for private accounts
CREATE TABLE IF NOT EXISTS follow_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  target_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(requester_id, target_id),
  -- Prevent self-follow requests
  CONSTRAINT no_self_follow_request CHECK (requester_id != target_id)
);

-- Create indexes for follow_requests
CREATE INDEX IF NOT EXISTS idx_follow_requests_requester ON follow_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_follow_requests_target ON follow_requests(target_id);
CREATE INDEX IF NOT EXISTS idx_follow_requests_status ON follow_requests(status);

-- 3. Enable RLS on follow_requests
ALTER TABLE follow_requests ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for follow_requests

-- Policy: Users can view their own requests (sent and received)
CREATE POLICY "Users can view their own follow requests"
ON follow_requests FOR SELECT
TO authenticated
USING (
  requester_id = auth.uid() OR target_id = auth.uid()
);

-- Policy: Users can create follow requests
CREATE POLICY "Users can send follow requests"
ON follow_requests FOR INSERT
TO authenticated
WITH CHECK (requester_id = auth.uid());

-- Policy: Target user can update request status (accept/reject)
CREATE POLICY "Target user can update request status"
ON follow_requests FOR UPDATE
TO authenticated
USING (target_id = auth.uid());

-- Policy: Users can delete their own sent requests
CREATE POLICY "Users can delete their own requests"
ON follow_requests FOR DELETE
TO authenticated
USING (requester_id = auth.uid());

-- 5. Update follows table RLS to check for private accounts
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

-- 6. Update posts RLS to respect account privacy
DROP POLICY IF EXISTS "Users can view posts based on privacy" ON posts;

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

-- 7. Function to auto-accept follow requests for public accounts
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

-- 8. Trigger for auto-accepting follow requests
DROP TRIGGER IF EXISTS auto_accept_follow_request ON follow_requests;
CREATE TRIGGER auto_accept_follow_request
BEFORE INSERT ON follow_requests
FOR EACH ROW
EXECUTE FUNCTION handle_follow_request();

-- 9. Function to create follow when request is accepted
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

-- 10. Trigger for creating follow on accept
DROP TRIGGER IF EXISTS create_follow_on_accept_trigger ON follow_requests;
CREATE TRIGGER create_follow_on_accept_trigger
BEFORE UPDATE ON follow_requests
FOR EACH ROW
EXECUTE FUNCTION create_follow_on_accept();

-- 11. Function to delete follow request when unfollowing
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

-- 12. Trigger for cleanup
DROP TRIGGER IF EXISTS cleanup_follow_request_trigger ON follows;
CREATE TRIGGER cleanup_follow_request_trigger
AFTER DELETE ON follows
FOR EACH ROW
EXECUTE FUNCTION cleanup_follow_request();

-- Comments
COMMENT ON COLUMN profiles.is_account_private IS 'Whether the account is private (requires follow approval)';
COMMENT ON COLUMN profiles.hide_follower_count IS 'Whether to hide follower/following counts on profile';
COMMENT ON TABLE follow_requests IS 'Follow requests for private accounts';
COMMENT ON COLUMN follow_requests.status IS 'Status: pending, accepted, or rejected';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Social features upgraded successfully!';
  RAISE NOTICE '- Account privacy (public/private) added';
  RAISE NOTICE '- Follow requests system created';
  RAISE NOTICE '- Hide follower count option added';
  RAISE NOTICE '- RLS policies updated for privacy';
END $$;


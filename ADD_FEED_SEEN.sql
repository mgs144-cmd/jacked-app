-- Track which posts a user has seen on the feed (run once in Supabase SQL Editor)

CREATE TABLE IF NOT EXISTS feed_post_views (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_feed_post_views_user_viewed
  ON feed_post_views (user_id, viewed_at DESC);

ALTER TABLE feed_post_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own feed views" ON feed_post_views;
CREATE POLICY "Users read own feed views"
  ON feed_post_views FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own feed views" ON feed_post_views;
CREATE POLICY "Users insert own feed views"
  ON feed_post_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own feed views" ON feed_post_views;
CREATE POLICY "Users update own feed views"
  ON feed_post_views FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE feed_post_views IS 'Per-user feed read state; feed shows recent posts not in this table';

-- Optional structured wearable metrics on posts (Story / feed strain display)
-- Run in Supabase SQL Editor

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS wearable_metrics JSONB;

COMMENT ON COLUMN posts.wearable_metrics IS
  'Attached WHOOP/Oura strain payload: { provider, score, scaleMax, averageHeartRate, maxHeartRate, startedAt, endedAt, zoneDurations, externalId }';

CREATE INDEX IF NOT EXISTS idx_posts_wearable_metrics
  ON posts USING gin (wearable_metrics)
  WHERE wearable_metrics IS NOT NULL;

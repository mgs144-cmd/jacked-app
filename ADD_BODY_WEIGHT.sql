-- Body weight logging + strength comparison prefs (run in Supabase SQL Editor)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS strength_sex TEXT
  CHECK (strength_sex IS NULL OR strength_sex IN ('male', 'female'));

COMMENT ON COLUMN profiles.strength_sex IS 'Used for strength percentile benchmarks (male/female ratio tables)';

CREATE TABLE IF NOT EXISTS body_weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weight_lb NUMERIC NOT NULL CHECK (weight_lb > 0 AND weight_lb < 1500),
  logged_on DATE NOT NULL DEFAULT (CURRENT_DATE),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, logged_on)
);

CREATE INDEX IF NOT EXISTS idx_body_weight_logs_user_date
  ON body_weight_logs(user_id, logged_on DESC);

ALTER TABLE body_weight_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own body weight logs" ON body_weight_logs;
CREATE POLICY "Users manage own body weight logs"
  ON body_weight_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE body_weight_logs IS 'Daily body weight entries for trends and strength ratio percentiles';

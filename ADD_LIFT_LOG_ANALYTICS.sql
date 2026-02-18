-- Lift Log & Analytics (Strava-style for lifting)
-- Run in Supabase SQL Editor

-- 1. Lift logs table - log lifts directly without posting
CREATE TABLE IF NOT EXISTS lift_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  weight NUMERIC NOT NULL,
  reps INTEGER NOT NULL,
  rpe NUMERIC CHECK (rpe >= 5 AND rpe <= 10),
  notes TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lift_logs_user_id ON lift_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_lift_logs_user_exercise ON lift_logs(user_id, exercise_name);
CREATE INDEX IF NOT EXISTS idx_lift_logs_logged_at ON lift_logs(logged_at DESC);

-- 2. Lift goals table
CREATE TABLE IF NOT EXISTS lift_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  target_weight NUMERIC NOT NULL,
  target_reps INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, exercise_name)
);

CREATE INDEX IF NOT EXISTS idx_lift_goals_user_id ON lift_goals(user_id);

-- 3. RLS
ALTER TABLE lift_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lift_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own lift_logs"
  ON lift_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own lift_goals"
  ON lift_goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow viewing other users' logs only if they shared to feed (post_id not null) - for now keep private
-- Lift logs are always private; only shared via post

COMMENT ON TABLE lift_logs IS 'Standalone lift entries for training log - not tied to posts unless shared';
COMMENT ON COLUMN lift_logs.rpe IS 'RPE 5-10, used for e1RM calculation';
COMMENT ON TABLE lift_goals IS 'User goals per exercise (target weight x reps)';

-- 4. Add pr_rpe to posts for RPE-adjusted e1RM display
ALTER TABLE posts ADD COLUMN IF NOT EXISTS pr_rpe NUMERIC;
COMMENT ON COLUMN posts.pr_rpe IS 'RPE for PR post, used for e1RM calculation';

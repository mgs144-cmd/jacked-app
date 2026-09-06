-- Training programs (splits, days, exercises) — run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS training_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT NOT NULL DEFAULT 'hypertrophy' CHECK (goal IN ('strength', 'hypertrophy')),
  program_json JSONB NOT NULL DEFAULT '{"days":[]}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_programs_user ON training_programs(user_id, updated_at DESC);

ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own training_programs" ON training_programs;
CREATE POLICY "Users manage own training_programs"
  ON training_programs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE training_programs IS 'User split programs; program_json holds days and exercises';

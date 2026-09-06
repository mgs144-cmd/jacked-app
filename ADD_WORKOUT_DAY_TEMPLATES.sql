-- Reusable workout template days (e.g. PULL DAY) — run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS workout_day_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  template_json JSONB NOT NULL DEFAULT '{"exercises":[]}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_day_templates_user
  ON workout_day_templates(user_id, updated_at DESC);

ALTER TABLE workout_day_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own workout_day_templates" ON workout_day_templates;
CREATE POLICY "Users manage own workout_day_templates"
  ON workout_day_templates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE workout_day_templates IS 'Named template days with exercise lists; used when starting a workout';

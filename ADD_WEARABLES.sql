-- Wearable OAuth connections + per-workout strain scores
-- Run in Supabase SQL Editor

-- 1. OAuth tokens per user per provider (Whoop, Oura, future)
CREATE TABLE IF NOT EXISTS wearable_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('whoop', 'oura')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT NOT NULL DEFAULT 'bearer',
  scope TEXT,
  expires_at TIMESTAMPTZ,
  provider_user_id TEXT,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_wearable_connections_user
  ON wearable_connections (user_id);

ALTER TABLE wearable_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own wearable_connections" ON wearable_connections;
CREATE POLICY "Users manage own wearable_connections"
  ON wearable_connections FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE wearable_connections IS 'OAuth tokens for wearable providers (Whoop, Oura). Prefer service-role writes from API routes.';

-- 2. Strain scores tied to a Jacked workout session (time window)
CREATE TABLE IF NOT EXISTS workout_strain (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('whoop', 'oura', 'healthkit', 'manual')),
  strain_score NUMERIC NOT NULL,
  strain_scale_max NUMERIC NOT NULL DEFAULT 21,
  average_heart_rate INTEGER,
  max_heart_rate INTEGER,
  external_id TEXT,
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_workout_strain_user_provider_external
  ON workout_strain (user_id, provider, external_id)
  WHERE external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workout_strain_user_date
  ON workout_strain (user_id, session_date DESC);

CREATE INDEX IF NOT EXISTS idx_workout_strain_user_window
  ON workout_strain (user_id, started_at, ended_at);

ALTER TABLE workout_strain ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own workout_strain" ON workout_strain;
CREATE POLICY "Users manage own workout_strain"
  ON workout_strain FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE workout_strain IS 'Normalized strain scores for Story templates; source-agnostic (Whoop / Oura / HealthKit).';
COMMENT ON COLUMN workout_strain.strain_score IS 'Provider strain on that provider scale (Whoop ~0-21).';
COMMENT ON COLUMN workout_strain.strain_scale_max IS 'Max of the provider scale (21 Whoop, 10 mapped Oura, etc).';

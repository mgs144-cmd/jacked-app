-- Group challenges: types (first-to weight, combined team PR, per-member targets), progress metadata, activity.
-- Run in Supabase SQL Editor after ADD_COACH_COMMUNITY.sql

-- === group_challenges: structured goals ===
ALTER TABLE group_challenges
  ADD COLUMN IF NOT EXISTS challenge_type TEXT NOT NULL DEFAULT 'freeform';

ALTER TABLE group_challenges DROP CONSTRAINT IF EXISTS group_challenges_challenge_type_check;
ALTER TABLE group_challenges ADD CONSTRAINT group_challenges_challenge_type_check
  CHECK (challenge_type IN ('freeform', 'first_to_weight', 'combined_pr', 'individual_targets', 'peak_day'));

ALTER TABLE group_challenges ADD COLUMN IF NOT EXISTS peak_date DATE;

ALTER TABLE group_challenges ADD COLUMN IF NOT EXISTS exercise_name TEXT;
ALTER TABLE group_challenges ADD COLUMN IF NOT EXISTS target_weight NUMERIC;
ALTER TABLE group_challenges ADD COLUMN IF NOT EXISTS combined_target NUMERIC;
ALTER TABLE group_challenges ADD COLUMN IF NOT EXISTS config_json JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE group_challenges ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

ALTER TABLE group_challenges DROP CONSTRAINT IF EXISTS group_challenges_status_check;
ALTER TABLE group_challenges ADD CONSTRAINT group_challenges_status_check
  CHECK (status IN ('active', 'completed', 'archived'));

COMMENT ON COLUMN group_challenges.challenge_type IS 'freeform; first_to_weight; combined_pr; individual_targets; peak_day = heaviest lift on peak_date';
COMMENT ON COLUMN group_challenges.peak_date IS 'For peak_day: calendar date when official max weight is scored';
COMMENT ON COLUMN group_challenges.config_json IS 'For individual_targets: {"targets":{"<user_uuid>":225,...}}';

-- === challenge_updates: optional reps, linked post, activity kind ===
ALTER TABLE challenge_updates ADD COLUMN IF NOT EXISTS reps INTEGER;
ALTER TABLE challenge_updates ADD COLUMN IF NOT EXISTS post_id UUID;
ALTER TABLE challenge_updates ADD COLUMN IF NOT EXISTS activity_kind TEXT NOT NULL DEFAULT 'manual';

ALTER TABLE challenge_updates DROP CONSTRAINT IF EXISTS challenge_updates_activity_kind_check;
ALTER TABLE challenge_updates ADD CONSTRAINT challenge_updates_activity_kind_check
  CHECK (activity_kind IN ('manual', 'linked_post', 'workout'));

DO $$
BEGIN
  ALTER TABLE challenge_updates
    ADD CONSTRAINT challenge_updates_post_id_fkey
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_challenge_updates_post ON challenge_updates(post_id) WHERE post_id IS NOT NULL;

COMMENT ON COLUMN challenge_updates.activity_kind IS 'manual = typed update; linked_post = tied to a feed post; workout = logged session';

-- Peak-day challenge: heaviest lift on a fixed calendar date + optional peer lift visibility for training feed.
-- Run after ADD_COACH_COMMUNITY.sql and ADD_GROUP_CHALLENGE_ENHANCEMENTS.sql
-- Requires lift_logs table (ADD_LIFT_LOG_ANALYTICS.sql) for the peer-read policy.

ALTER TABLE group_challenges ADD COLUMN IF NOT EXISTS peak_date DATE;

ALTER TABLE group_challenges DROP CONSTRAINT IF EXISTS group_challenges_challenge_type_check;
ALTER TABLE group_challenges ADD CONSTRAINT group_challenges_challenge_type_check
  CHECK (challenge_type IN ('freeform', 'first_to_weight', 'combined_pr', 'individual_targets', 'peak_day'));

COMMENT ON COLUMN group_challenges.peak_date IS 'For challenge_type peak_day: calendar date when heaviest single (exercise_name) counts';

DO $$
BEGIN
  IF to_regclass('public.lift_logs') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Group peers read lift_logs" ON lift_logs;
    CREATE POLICY "Group peers read lift_logs"
      ON lift_logs FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM lifting_group_members m1
          INNER JOIN lifting_group_members m2
            ON m1.group_id = m2.group_id
           AND m1.user_id = auth.uid()
           AND m2.user_id = lift_logs.user_id
        )
      );
  END IF;
END $$;

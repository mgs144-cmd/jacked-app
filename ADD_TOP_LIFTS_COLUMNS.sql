-- Add columns for user's top 3 lifts display
-- These will be shown on their profile

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS top_lift_1 JSONB,
ADD COLUMN IF NOT EXISTS top_lift_2 JSONB,
ADD COLUMN IF NOT EXISTS top_lift_3 JSONB;

-- JSONB structure for each lift:
-- {
--   "exercise": "Deadlift",
--   "weight": 405,
--   "reps": 3
-- }

-- Example update (after running this, users can set via settings page):
-- UPDATE profiles
-- SET 
--   top_lift_1 = '{"exercise": "Deadlift", "weight": 405, "reps": 3}'::jsonb,
--   top_lift_2 = '{"exercise": "Squat", "weight": 315, "reps": 5}'::jsonb,
--   top_lift_3 = '{"exercise": "Bench Press", "weight": 225, "reps": 8}'::jsonb
-- WHERE id = auth.uid();

COMMENT ON COLUMN profiles.top_lift_1 IS 'First top lift to display on profile (JSONB: {exercise, weight, reps})';
COMMENT ON COLUMN profiles.top_lift_2 IS 'Second top lift to display on profile (JSONB: {exercise, weight, reps})';
COMMENT ON COLUMN profiles.top_lift_3 IS 'Third top lift to display on profile (JSONB: {exercise, weight, reps})';


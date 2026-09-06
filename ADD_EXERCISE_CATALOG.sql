-- Exercise catalog: built-in + user-added exercises (run in Supabase SQL Editor)

CREATE TABLE IF NOT EXISTS exercise_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  logging_mode TEXT NOT NULL DEFAULT 'standard'
    CHECK (logging_mode IN ('standard', 'prime_range')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_exercise_catalog_global_name
  ON exercise_catalog (lower(trim(name)))
  WHERE user_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_exercise_catalog_user_name
  ON exercise_catalog (user_id, lower(trim(name)))
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_exercise_catalog_user_id ON exercise_catalog(user_id);

ALTER TABLE exercise_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read global exercises" ON exercise_catalog;
CREATE POLICY "Anyone can read global exercises"
  ON exercise_catalog FOR SELECT
  USING (user_id IS NULL);

DROP POLICY IF EXISTS "Users read own exercises" ON exercise_catalog;
CREATE POLICY "Users read own exercises"
  ON exercise_catalog FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own exercises" ON exercise_catalog;
CREATE POLICY "Users insert own exercises"
  ON exercise_catalog FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Prime machines: log weight at beginning / middle / end range per set
ALTER TABLE lift_logs ADD COLUMN IF NOT EXISTS range_spot TEXT
  CHECK (range_spot IS NULL OR range_spot IN ('beginning', 'middle', 'end'));

COMMENT ON TABLE exercise_catalog IS 'Built-in (user_id NULL) and user-created exercise names for autocomplete';
COMMENT ON COLUMN exercise_catalog.logging_mode IS 'prime_range = Leg/Chest Prime machines with 3 stack positions';
COMMENT ON COLUMN lift_logs.range_spot IS 'For prime_range exercises: beginning, middle, or end stack weight';

-- Built-in list (idempotent)
INSERT INTO exercise_catalog (name, user_id, logging_mode)
SELECT v.name, NULL, v.mode
FROM (
  VALUES
    ('Bench Press', 'standard'),
    ('Incline Bench Press', 'standard'),
    ('Decline Bench Press', 'standard'),
    ('Squat', 'standard'),
    ('Back Squat', 'standard'),
    ('Front Squat', 'standard'),
    ('Deadlift', 'standard'),
    ('Romanian Deadlift', 'standard'),
    ('Overhead Press', 'standard'),
    ('Leg Press', 'standard'),
    ('Leg Curl', 'standard'),
    ('Leg Extension', 'standard'),
    ('Leg Extension (Prime)', 'prime_range'),
    ('Chest-Supported Row (Prime)', 'prime_range'),
    ('Lat Pulldown', 'standard'),
    ('Barbell Row', 'standard'),
    ('Pull-up', 'standard'),
    ('Dumbbell Press', 'standard'),
    ('Lateral Raise', 'standard'),
    ('Calf Raise', 'standard')
) AS v(name, mode)
WHERE NOT EXISTS (
  SELECT 1 FROM exercise_catalog e
  WHERE e.user_id IS NULL AND lower(trim(e.name)) = lower(trim(v.name))
);

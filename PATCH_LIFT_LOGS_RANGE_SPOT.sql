-- Optional: Prime machine logging (beginning / middle / end stack weights)
-- Run in Supabase SQL Editor if you use Leg Prime / Chest Prime style exercises.
-- Standard bench/squat/deadlift logging works without this migration.

ALTER TABLE lift_logs ADD COLUMN IF NOT EXISTS range_spot TEXT
  CHECK (range_spot IS NULL OR range_spot IN ('beginning', 'middle', 'end'));

COMMENT ON COLUMN lift_logs.range_spot IS 'For prime_range exercises: beginning, middle, or end stack weight';

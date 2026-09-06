-- Run once in Supabase SQL Editor if coach_plans already exists with NOT NULL target_date.
-- Makes target_date optional so goals can omit a test/meet date until the user sets one (or Coach suggests).

ALTER TABLE coach_plans ALTER COLUMN target_date DROP NOT NULL;

COMMENT ON COLUMN coach_plans.target_date IS 'Optional meet or max-test date; NULL means user or Coach will set later';


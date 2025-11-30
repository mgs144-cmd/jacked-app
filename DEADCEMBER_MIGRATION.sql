-- =====================================================
-- DEADCEMBER CHALLENGE MIGRATION
-- December deadlift/RDL volume challenge
-- =====================================================

-- 1. Deadcember Entries Table
CREATE TABLE IF NOT EXISTS deadcember_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_type TEXT NOT NULL CHECK (exercise_type IN ('deadlift', 'rdl')),
  weight NUMERIC NOT NULL,
  reps INTEGER NOT NULL,
  sets INTEGER NOT NULL,
  volume NUMERIC GENERATED ALWAYS AS (weight * reps * sets) STORED,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deadcember_user_id ON deadcember_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_deadcember_date ON deadcember_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_deadcember_post_id ON deadcember_entries(post_id);

-- 2. Deadcember PRs Table
CREATE TABLE IF NOT EXISTS deadcember_prs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  starting_pr NUMERIC,
  ending_pr NUMERIC,
  progress NUMERIC GENERATED ALWAYS AS (
    CASE 
      WHEN ending_pr IS NOT NULL AND starting_pr IS NOT NULL 
      THEN ending_pr - starting_pr 
      ELSE NULL 
    END
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year)
);

CREATE INDEX IF NOT EXISTS idx_deadcember_prs_user_id ON deadcember_prs(user_id);
CREATE INDEX IF NOT EXISTS idx_deadcember_prs_year ON deadcember_prs(year);

-- 3. Add Deadcember columns to posts table
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS is_deadcember_post BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deadcember_volume NUMERIC,
ADD COLUMN IF NOT EXISTS deadcember_personal_total NUMERIC;

-- 4. RLS Policies for Deadcember tables

-- Deadcember Entries
ALTER TABLE deadcember_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deadcember entries are viewable by everyone"
  ON deadcember_entries FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own Deadcember entries"
  ON deadcember_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Deadcember entries"
  ON deadcember_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Deadcember entries"
  ON deadcember_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Deadcember PRs
ALTER TABLE deadcember_prs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deadcember PRs are viewable by everyone"
  ON deadcember_prs FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own Deadcember PRs"
  ON deadcember_prs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Deadcember PRs"
  ON deadcember_prs FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. Function to get user's Deadcember total
CREATE OR REPLACE FUNCTION get_user_deadcember_total(p_user_id UUID, p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE))
RETURNS NUMERIC AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(volume) 
     FROM deadcember_entries 
     WHERE user_id = p_user_id 
       AND EXTRACT(YEAR FROM date) = p_year
       AND EXTRACT(MONTH FROM date) = 12),
    0
  );
END;
$$ LANGUAGE plpgsql;

-- 6. Function to get global Deadcember total
CREATE OR REPLACE FUNCTION get_global_deadcember_total(p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE))
RETURNS NUMERIC AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(volume) 
     FROM deadcember_entries 
     WHERE EXTRACT(YEAR FROM date) = p_year
       AND EXTRACT(MONTH FROM date) = 12),
    0
  );
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '✅ DEADCEMBER MIGRATION COMPLETE!';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Created deadcember_entries table';
  RAISE NOTICE '✅ Created deadcember_prs table';
  RAISE NOTICE '✅ Added Deadcember columns to posts';
  RAISE NOTICE '✅ Created RLS policies';
  RAISE NOTICE '✅ Created helper functions';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Ready to implement Deadcember features!';
  RAISE NOTICE '';
END $$;


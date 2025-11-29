-- =====================================================
-- COMPLETE FEATURES MIGRATION
-- Adds all new features: PRs, badges, workout details, etc.
-- =====================================================

-- 1. Personal Records Table
CREATE TABLE IF NOT EXISTS personal_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  weight NUMERIC,
  reps INTEGER,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  video_url TEXT,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prs_user_id ON personal_records(user_id);
CREATE INDEX IF NOT EXISTS idx_prs_date ON personal_records(date DESC);

-- 2. Badges Table
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  season TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. User Badges Junction Table
CREATE TABLE IF NOT EXISTS user_badges (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);

-- 4. Workout Exercises Table
CREATE TABLE IF NOT EXISTS workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  sets INTEGER,
  reps INTEGER,
  weight NUMERIC,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_exercises_post_id ON workout_exercises(post_id);

-- 5. Add columns to posts table
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS is_pr_post BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pr_exercise TEXT,
ADD COLUMN IF NOT EXISTS pr_weight NUMERIC,
ADD COLUMN IF NOT EXISTS pr_reps INTEGER,
ADD COLUMN IF NOT EXISTS song_album_art_url TEXT,
ADD COLUMN IF NOT EXISTS song_spotify_id TEXT;

-- 6. Add columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS has_paid_onboarding BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_payment_id TEXT,
ADD COLUMN IF NOT EXISTS fitness_goal TEXT CHECK (fitness_goal IN ('bulk', 'cut', 'maintenance'));

-- 7. RLS Policies for new tables

-- Personal Records
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "PRs are viewable by everyone"
  ON personal_records FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own PRs"
  ON personal_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PRs"
  ON personal_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own PRs"
  ON personal_records FOR DELETE
  USING (auth.uid() = user_id);

-- Badges (read-only for users, admin can manage)
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges are viewable by everyone"
  ON badges FOR SELECT
  USING (true);

-- User Badges
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User badges are viewable by everyone"
  ON user_badges FOR SELECT
  USING (true);

-- Workout Exercises
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workout exercises are viewable by everyone"
  ON workout_exercises FOR SELECT
  USING (true);

CREATE POLICY "Users can create workout exercises for their posts"
  ON workout_exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = workout_exercises.post_id
      AND posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update workout exercises for their posts"
  ON workout_exercises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = workout_exercises.post_id
      AND posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete workout exercises for their posts"
  ON workout_exercises FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = workout_exercises.post_id
      AND posts.user_id = auth.uid()
    )
  );

-- 8. Insert example badge (Deadcember)
INSERT INTO badges (name, description, season)
VALUES ('Deadcember', 'Completed Deadcember challenge - 31 days of deadlifts', 'winter')
ON CONFLICT (name) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '✅ ALL FEATURES MIGRATION COMPLETE!';
  RAISE NOTICE '✅ ========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Created personal_records table';
  RAISE NOTICE '✅ Created badges and user_badges tables';
  RAISE NOTICE '✅ Created workout_exercises table';
  RAISE NOTICE '✅ Added PR columns to posts';
  RAISE NOTICE '✅ Added album art column to posts';
  RAISE NOTICE '✅ Added onboarding payment columns to profiles';
  RAISE NOTICE '✅ Added fitness_goal to profiles';
  RAISE NOTICE '✅ Created all RLS policies';
  RAISE NOTICE '✅ Inserted Deadcember badge';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Ready to implement UI features!';
  RAISE NOTICE '';
END $$;


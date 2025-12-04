-- Fix Database RLS Policies Only
-- Run this in Supabase SQL Editor
-- (Storage bucket policies must be set up via Dashboard - see instructions below)

-- ============================================
-- PART 1: Add banner_url column
-- ============================================

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- ============================================
-- PART 2: Fix Database RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies (including duplicates)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Recreate policies correctly
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- PART 3: Verify Database Policies
-- ============================================

SELECT 
  'Database Policies' as check_type,
  COUNT(*) as count
FROM pg_policies 
WHERE tablename = 'profiles';

-- Show all policies
SELECT 
  policyname,
  cmd,
  qual as "USING Expression",
  with_check as "WITH CHECK Expression"
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;


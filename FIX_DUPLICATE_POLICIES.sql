-- Fix duplicate RLS policies on profiles table
-- Run this in Supabase SQL Editor

-- Step 1: Add banner_url column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Step 2: Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop ALL existing policies on profiles table (including duplicates)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Step 4: Recreate policies with unique names and proper syntax
-- SELECT policy (viewable by everyone)
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- INSERT policy (users can create their own profile)
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- UPDATE policy (users can update their own profile) - MUST have WITH CHECK
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 5: Verify only one of each policy type exists
SELECT 
  policyname,
  cmd,
  qual as "USING Expression",
  with_check as "WITH CHECK Expression"
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- Step 6: Count policies to ensure no duplicates
SELECT 
  cmd,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'profiles'
GROUP BY cmd
ORDER BY cmd;


-- Complete RLS Fix for Banner Upload
-- Run this in Supabase SQL Editor to fix the "new row violates row-level security policy" error

-- Step 1: Add banner_url column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Step 2: Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop and recreate UPDATE policy with proper WITH CHECK clause
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 4: Ensure INSERT policy exists (in case profile doesn't exist)
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Step 5: Verify everything is set up correctly
SELECT 
  'banner_url column' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'profiles' 
      AND column_name = 'banner_url'
    ) THEN 'EXISTS ✓' 
    ELSE 'MISSING ✗' 
  END as status

UNION ALL

SELECT 
  'RLS Enabled' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE tablename = 'profiles' 
      AND rowsecurity = true
    ) THEN 'ENABLED ✓' 
    ELSE 'DISABLED ✗' 
  END as status

UNION ALL

SELECT 
  'UPDATE policy' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'profiles' 
      AND policyname = 'Users can update their own profile'
      AND cmd = 'UPDATE'
      AND with_check IS NOT NULL
    ) THEN 'EXISTS WITH CHECK ✓' 
    ELSE 'MISSING OR INCOMPLETE ✗' 
  END as status

UNION ALL

SELECT 
  'INSERT policy' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'profiles' 
      AND policyname = 'Users can insert their own profile'
      AND cmd = 'INSERT'
    ) THEN 'EXISTS ✓' 
    ELSE 'MISSING ✗' 
  END as status;


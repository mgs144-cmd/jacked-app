-- Complete setup for banner images
-- Run this in Supabase SQL Editor

-- Step 1: Add banner_url column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Step 2: Ensure UPDATE policy allows all profile updates
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 3: Verify everything is set up correctly
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
  'UPDATE policy' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'profiles' 
      AND policyname = 'Users can update their own profile'
      AND cmd = 'UPDATE'
    ) THEN 'EXISTS ✓' 
    ELSE 'MISSING ✗' 
  END as status;


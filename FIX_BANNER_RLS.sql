-- Fix RLS policy for banner_url updates
-- Run this in Supabase SQL Editor

-- First, make sure the banner_url column exists
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Verify the UPDATE policy exists and allows updating banner_url
-- The existing policy should work, but let's verify it
SELECT 
  policyname,
  cmd,
  qual as "USING Expression",
  with_check as "WITH CHECK Expression"
FROM pg_policies 
WHERE tablename = 'profiles' 
AND cmd = 'UPDATE';

-- If the UPDATE policy doesn't exist or is too restrictive, recreate it:
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Verify it was created
SELECT 
  'Policy Status' as check_type,
  CASE WHEN COUNT(*) > 0 THEN 'EXISTS ✓' ELSE 'MISSING ✗' END as status
FROM pg_policies 
WHERE tablename = 'profiles' 
AND policyname = 'Users can update their own profile'
AND cmd = 'UPDATE';


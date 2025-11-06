-- Complete Verification Script
-- Run this in Supabase SQL Editor to check everything

-- 1. Check if RLS is enabled
SELECT 
  tablename, 
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename = 'profiles';

-- 2. List all policies on profiles table
SELECT 
  policyname as "Policy Name",
  cmd as "Command",
  permissive as "Type",
  roles as "Roles",
  qual as "USING Expression",
  with_check as "WITH CHECK Expression"
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- 3. Check if the trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles';

-- 4. If INSERT policy is missing, create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can insert their own profile'
  ) THEN
    CREATE POLICY "Users can insert their own profile"
      ON profiles FOR INSERT
      WITH CHECK (auth.uid() = id);
    RAISE NOTICE 'INSERT policy created successfully';
  ELSE
    RAISE NOTICE 'INSERT policy already exists';
  END IF;
END $$;

-- 5. Verify RLS is enabled (enable if not)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 6. Show final status
SELECT 
  'RLS Status' as check_type,
  CASE WHEN rowsecurity THEN 'ENABLED ✓' ELSE 'DISABLED ✗' END as status
FROM pg_tables 
WHERE tablename = 'profiles'

UNION ALL

SELECT 
  'INSERT Policy' as check_type,
  CASE WHEN COUNT(*) > 0 THEN 'EXISTS ✓' ELSE 'MISSING ✗' END as status
FROM pg_policies 
WHERE tablename = 'profiles' 
AND policyname = 'Users can insert their own profile';


-- Fix for "new row violates row-level security policy" error
-- Run this in Supabase SQL Editor

-- First, check if the policy exists and drop it if needed
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Create the INSERT policy for profiles table
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Verify the policy was created
SELECT * FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert their own profile';


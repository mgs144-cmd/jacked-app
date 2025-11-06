-- Fix for Row Level Security Policy Issue
-- Run this in your Supabase SQL Editor to fix the signup error

-- Add INSERT policy for profiles table
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- If the policy already exists, you'll get an error. That's okay!
-- You can drop and recreate it if needed:
-- DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
-- CREATE POLICY "Users can insert their own profile"
--   ON profiles FOR INSERT
--   WITH CHECK (auth.uid() = id);


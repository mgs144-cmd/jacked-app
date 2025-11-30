-- Add email column to profiles table for admin dashboard
-- Run this in your Supabase SQL Editor

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Update existing profiles with emails from auth.users
-- Note: This requires admin access. You may need to run this manually or use Supabase admin API
-- For new signups, email will be stored automatically

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);


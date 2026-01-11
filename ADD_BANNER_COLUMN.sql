-- Add banner_url column to profiles table
-- Run this in Supabase SQL Editor

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS banner_url TEXT;

COMMENT ON COLUMN profiles.banner_url IS 'Banner/cover image URL for user profile (like YouTube/LinkedIn)';



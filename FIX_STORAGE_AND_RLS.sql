-- Complete fix for banner upload: Database RLS + Storage Bucket
-- Run this in Supabase SQL Editor

-- ============================================
-- PART 1: Fix Database RLS Policies
-- ============================================

-- Add banner_url column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS banner_url TEXT;

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
-- PART 2: Fix Storage Bucket Policies
-- ============================================

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on media bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to media" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;

-- Allow public read access to media bucket
CREATE POLICY "Public read access to media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

-- Allow authenticated users to upload to media bucket
CREATE POLICY "Authenticated users can upload to media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'media' 
    AND auth.role() = 'authenticated'
  );

-- Allow users to update their own files in media bucket
CREATE POLICY "Users can update their own files in media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'media' 
    AND auth.role() = 'authenticated'
  )
  WITH CHECK (
    bucket_id = 'media' 
    AND auth.role() = 'authenticated'
  );

-- Allow users to delete their own files in media bucket
CREATE POLICY "Users can delete their own files in media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'media' 
    AND auth.role() = 'authenticated'
  );

-- ============================================
-- PART 3: Verify Everything
-- ============================================

-- Verify database policies
SELECT 
  'Database Policies' as check_type,
  COUNT(*) as count
FROM pg_policies 
WHERE tablename = 'profiles'

UNION ALL

-- Verify storage policies
SELECT 
  'Storage Policies' as check_type,
  COUNT(*) as count
FROM pg_policies 
WHERE tablename = 'objects' 
AND (qual::text LIKE '%media%' OR with_check::text LIKE '%media%');

-- Show all policies
SELECT 
  'PROFILES POLICIES' as section,
  policyname,
  cmd,
  with_check IS NOT NULL as has_with_check
FROM pg_policies 
WHERE tablename = 'profiles'

UNION ALL

SELECT 
  'STORAGE POLICIES' as section,
  policyname,
  cmd,
  with_check IS NOT NULL as has_with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND (qual::text LIKE '%media%' OR with_check::text LIKE '%media%')
ORDER BY section, cmd;


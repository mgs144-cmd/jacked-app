-- Verify Deadcember setup
-- Run this to check if Deadcember tables and functions exist

-- 1. Check if deadcember_entries table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'deadcember_entries'
) as deadcember_entries_exists;

-- 2. Check if deadcember_prs table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'deadcember_prs'
) as deadcember_prs_exists;

-- 3. Check if posts table has is_deadcember_post column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND column_name IN ('is_deadcember_post', 'deadcember_volume', 'personal_deadcember_total', 'global_deadcember_total');

-- 4. Check if profiles table has deadcember_total_volume column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'deadcember_total_volume';

-- 5. Check if RPC functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_user_deadcember_total', 'get_global_deadcember_total');

-- If any of these are missing, run DEADCEMBER_MIGRATION.sql


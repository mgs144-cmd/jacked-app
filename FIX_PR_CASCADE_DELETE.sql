-- Fix PR deletion when posts are deleted
-- Change personal_records.post_id to CASCADE delete instead of SET NULL

-- First, drop the existing foreign key constraint
ALTER TABLE personal_records
DROP CONSTRAINT IF EXISTS personal_records_post_id_fkey;

-- Re-add the foreign key with CASCADE delete
ALTER TABLE personal_records
ADD CONSTRAINT personal_records_post_id_fkey
FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

-- Verify the constraint
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'personal_records'::regclass
  AND conname = 'personal_records_post_id_fkey';


-- Create RPC function to get Deadcember community total
-- This bypasses RLS to ensure ALL Deadcember posts are counted

-- Drop the function if it exists
DROP FUNCTION IF EXISTS get_deadcember_total();

-- Create function to calculate total Deadcember volume
-- This runs with SECURITY DEFINER so it bypasses RLS
CREATE OR REPLACE FUNCTION get_deadcember_total()
RETURNS NUMERIC
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(SUM(deadcember_volume), 0)
  FROM posts
  WHERE is_deadcember_post = true
    AND (is_archived IS NULL OR is_archived = false)
    AND deadcember_volume IS NOT NULL;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_deadcember_total() TO authenticated;

-- Test the function
SELECT get_deadcember_total();


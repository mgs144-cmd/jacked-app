-- Fix group RLS: removes infinite recursion (42P17) between lifting_groups and lifting_group_members.
-- Run once in Supabase SQL Editor (replaces the earlier non-recursion-safe version).

-- Helper: membership check without triggering RLS recursion (runs as definer).
CREATE OR REPLACE FUNCTION public.jacked_auth_is_group_member(p_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_group_id IS NULL THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1
    FROM public.lifting_group_members m
    WHERE m.group_id = p_group_id
      AND m.user_id = auth.uid()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.jacked_auth_is_group_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.jacked_auth_is_group_member(uuid) TO authenticated;
COMMENT ON FUNCTION public.jacked_auth_is_group_member(uuid) IS 'True if auth.uid() is in lifting_group_members for p_group_id; used by RLS to avoid policy recursion';

DROP POLICY IF EXISTS "Members see lifting_groups" ON lifting_groups;
CREATE POLICY "Members see lifting_groups"
  ON lifting_groups FOR SELECT
  USING (
    creator_id = auth.uid()
    OR public.jacked_auth_is_group_member(id)
  );

DROP POLICY IF EXISTS "Select lifting_group_members" ON lifting_group_members;
CREATE POLICY "Select lifting_group_members"
  ON lifting_group_members FOR SELECT
  USING (public.jacked_auth_is_group_member(group_id));

-- Inserts/updates are not implied by SELECT-only fixes; without INSERT policy, create group fails (42501).
DROP POLICY IF EXISTS "Authenticated create lifting_groups" ON lifting_groups;
CREATE POLICY "Authenticated create lifting_groups"
  ON lifting_groups FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Creator update lifting_groups" ON lifting_groups;
CREATE POLICY "Creator update lifting_groups"
  ON lifting_groups FOR UPDATE
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- After INSERT, trg_lifting_groups_creator_member inserts the creator row; must be allowed for the group owner.
DROP POLICY IF EXISTS "Creator adds lifting_group_members" ON lifting_group_members;
CREATE POLICY "Creator adds lifting_group_members"
  ON lifting_group_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lifting_groups g
      WHERE g.id = group_id AND g.creator_id = auth.uid()
    )
  );

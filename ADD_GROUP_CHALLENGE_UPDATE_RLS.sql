-- Allow group members to update challenges (e.g. status = completed) in their groups.
-- Run in Supabase SQL Editor after ADD_COACH_COMMUNITY / group challenges exist.

DROP POLICY IF EXISTS "Members update group_challenges" ON group_challenges;
CREATE POLICY "Members update group_challenges"
  ON group_challenges FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM lifting_group_members m
      WHERE m.group_id = group_challenges.group_id AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM lifting_group_members m
      WHERE m.group_id = group_challenges.group_id AND m.user_id = auth.uid()
    )
  );

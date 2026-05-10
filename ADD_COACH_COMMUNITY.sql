-- AI Coach plans + Community groups/challenges — run in Supabase SQL Editor
-- Depends on profiles(id), Supabase Auth

-- === Coach ===
CREATE TABLE IF NOT EXISTS coach_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  target_weight NUMERIC NOT NULL CHECK (target_weight > 0),
  target_reps INTEGER NOT NULL DEFAULT 1 CHECK (target_reps > 0),
  target_date DATE NOT NULL,
  program_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coach_plans_user ON coach_plans(user_id);

CREATE TABLE IF NOT EXISTS coach_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES coach_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coach_chat_plan ON coach_chat_messages(plan_id, created_at);

ALTER TABLE coach_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own coach_plans" ON coach_plans;
CREATE POLICY "Users manage own coach_plans"
  ON coach_plans FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own coach chats" ON coach_chat_messages;
CREATE POLICY "Users read own coach chats"
  ON coach_chat_messages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM coach_plans p WHERE p.id = plan_id AND p.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users insert own coach chats" ON coach_chat_messages;
CREATE POLICY "Users insert own coach chats"
  ON coach_chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM coach_plans p WHERE p.id = plan_id AND p.user_id = auth.uid())
  );

-- === Groups ===
CREATE TABLE IF NOT EXISTS lifting_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  invite_code TEXT NOT NULL UNIQUE DEFAULT upper(substring(replace(gen_random_uuid()::text, '-', '') FROM 1 FOR 8)),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lifting_group_members (
  group_id UUID NOT NULL REFERENCES lifting_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_lifting_group_members_user ON lifting_group_members(user_id);

CREATE TABLE IF NOT EXISTS group_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES lifting_groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  metric_hint TEXT,
  ends_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_challenges_group ON group_challenges(group_id);

CREATE TABLE IF NOT EXISTS challenge_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES group_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  value_numeric NUMERIC,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challenge_updates_challenge ON challenge_updates(challenge_id, created_at DESC);

CREATE TABLE IF NOT EXISTS group_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES lifting_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (length(trim(body)) > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_chat_group ON group_chat_messages(group_id, created_at);

ALTER TABLE lifting_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifting_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chat_messages ENABLE ROW LEVEL SECURITY;

-- lifting_groups visible to members; creation by authenticated user as creator
DROP POLICY IF EXISTS "Members see lifting_groups" ON lifting_groups;
CREATE POLICY "Members see lifting_groups"
  ON lifting_groups FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM lifting_group_members m WHERE m.group_id = lifting_groups.id AND m.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Authenticated create lifting_groups" ON lifting_groups;
CREATE POLICY "Authenticated create lifting_groups"
  ON lifting_groups FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Creator update lifting_groups" ON lifting_groups;
CREATE POLICY "Creator update lifting_groups"
  ON lifting_groups FOR UPDATE
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- Members
DROP POLICY IF EXISTS "Select lifting_group_members" ON lifting_group_members;
CREATE POLICY "Select lifting_group_members"
  ON lifting_group_members FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM lifting_group_members m WHERE m.group_id = lifting_group_members.group_id AND m.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Creator adds lifting_group_members" ON lifting_group_members;
CREATE POLICY "Creator adds lifting_group_members"
  ON lifting_group_members FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM lifting_groups g WHERE g.id = group_id AND g.creator_id = auth.uid())
  );

-- Join by invite code (bypass RLS insert via security definer)
CREATE OR REPLACE FUNCTION public.join_lifting_group_by_code(code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  gid uuid;
BEGIN
  SELECT id INTO gid FROM lifting_groups WHERE upper(trim(invite_code)) = upper(trim(code)) LIMIT 1;
  IF gid IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;
  INSERT INTO lifting_group_members (group_id, user_id) VALUES (gid, auth.uid())
  ON CONFLICT DO NOTHING;
  RETURN gid;
END;
$$;

REVOKE ALL ON FUNCTION public.join_lifting_group_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_lifting_group_by_code(text) TO authenticated;

-- Challenges
DROP POLICY IF EXISTS "Members read group_challenges" ON group_challenges;
CREATE POLICY "Members read group_challenges"
  ON group_challenges FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM lifting_group_members m WHERE m.group_id = group_challenges.group_id AND m.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Members create group_challenges" ON group_challenges;
CREATE POLICY "Members create group_challenges"
  ON group_challenges FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (SELECT 1 FROM lifting_group_members m WHERE m.group_id = group_id AND m.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Challenge updates select" ON challenge_updates;
CREATE POLICY "Challenge updates select"
  ON challenge_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_challenges c
      INNER JOIN lifting_group_members m ON m.group_id = c.group_id AND m.user_id = auth.uid()
      WHERE c.id = challenge_updates.challenge_id
    )
  );

DROP POLICY IF EXISTS "Challenge updates insert" ON challenge_updates;
CREATE POLICY "Challenge updates insert"
  ON challenge_updates FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM group_challenges c
      INNER JOIN lifting_group_members m ON m.group_id = c.group_id AND m.user_id = auth.uid()
      WHERE c.id = challenge_id
    )
  );

DROP POLICY IF EXISTS "Group chat read" ON group_chat_messages;
CREATE POLICY "Group chat read"
  ON group_chat_messages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM lifting_group_members m WHERE m.group_id = group_chat_messages.group_id AND m.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Group chat insert" ON group_chat_messages;
CREATE POLICY "Group chat insert"
  ON group_chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM lifting_group_members m WHERE m.group_id = group_id AND m.user_id = auth.uid())
  );

CREATE OR REPLACE FUNCTION public.add_creator_as_group_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO lifting_group_members (group_id, user_id) VALUES (NEW.id, NEW.creator_id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_lifting_groups_creator_member ON lifting_groups;
CREATE TRIGGER trg_lifting_groups_creator_member
  AFTER INSERT ON lifting_groups
  FOR EACH ROW EXECUTE PROCEDURE public.add_creator_as_group_member();

COMMENT ON TABLE coach_plans IS 'Goal-based lifting plan + JSON program for AI coach';
COMMENT ON TABLE lifting_groups IS 'Training groups — challenges & chat';


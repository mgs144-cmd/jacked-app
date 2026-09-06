-- Insights chat history + long-term coach memory — run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS coach_user_memory (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  notes TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coach_insights_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coach_insights_user_created ON coach_insights_messages(user_id, created_at DESC);

ALTER TABLE coach_user_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_insights_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Own coach_user_memory" ON coach_user_memory;
CREATE POLICY "Own coach_user_memory"
  ON coach_user_memory FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Own coach_insights_messages" ON coach_insights_messages;
CREATE POLICY "Own coach_insights_messages"
  ON coach_insights_messages FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE coach_user_memory IS 'Rolling notes the AI coach uses to remember training context';
COMMENT ON TABLE coach_insights_messages IS 'Chat thread for Log > Insights tab';


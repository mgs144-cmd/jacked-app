-- Create Deadcember group chat table
CREATE TABLE IF NOT EXISTS deadcember_chat (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_deadcember_chat_created_at ON deadcember_chat(created_at DESC);

-- Enable RLS
ALTER TABLE deadcember_chat ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Everyone can read Deadcember chat messages
CREATE POLICY "Deadcember chat messages are viewable by everyone"
  ON deadcember_chat FOR SELECT
  USING (true);

-- Authenticated users can send messages
CREATE POLICY "Users can send Deadcember chat messages"
  ON deadcember_chat FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete their own Deadcember chat messages"
  ON deadcember_chat FOR DELETE
  USING (auth.uid() = user_id);


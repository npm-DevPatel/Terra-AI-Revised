-- ═══════════════════════════════════════════════════════════════
-- Terra Workflow — Supabase Migration
-- Run this in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. project_mock_members — fake team members for demo purposes
CREATE TABLE IF NOT EXISTS project_mock_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  role_title TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE project_mock_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage mock members for their projects"
  ON project_mock_members FOR ALL
  USING (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()));

-- 2. workspace_channels — Slack-style channels per project
CREATE TABLE IF NOT EXISTS workspace_channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  topic TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE workspace_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage workspace channels for their projects"
  ON workspace_channels FOR ALL
  USING (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()));

-- 3. workspace_messages — messages in channels and DMs
CREATE TABLE IF NOT EXISTS workspace_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES workspace_channels(id) ON DELETE CASCADE,
  dm_with_id UUID REFERENCES project_mock_members(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'mock_member', 'ai')),
  sender_name TEXT NOT NULL,
  sender_avatar TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE workspace_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage workspace messages for their projects"
  ON workspace_messages FOR ALL
  USING (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()));

-- Enable realtime for workspace_messages
ALTER PUBLICATION supabase_realtime ADD TABLE workspace_messages;

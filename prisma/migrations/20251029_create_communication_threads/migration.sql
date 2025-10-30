-- Migration: Create communication thread tables
-- Created: October 29, 2025
-- Purpose: Track conversations and messages about entities (orders, tasks, QC inspections, etc.)

-- Communication Threads (conversations about entities)
CREATE TABLE IF NOT EXISTS communication_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Thread context
  entity_type VARCHAR(100) NOT NULL, -- 'order', 'production_order', 'task', 'qc_inspection', etc.
  entity_id UUID NOT NULL,

  -- Thread info
  subject VARCHAR(500),
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'closed', 'archived'

  -- Participants
  participant_ids UUID[] DEFAULT '{}',

  -- Metadata
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE
);

-- Thread Messages
CREATE TABLE IF NOT EXISTS thread_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES communication_threads(id) ON DELETE CASCADE NOT NULL,

  -- Message content
  message TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text', -- 'text', 'system', 'file', 'status_update'

  -- Attachments
  attachments JSONB DEFAULT '[]', -- [{file_name, file_url, file_size}, ...]

  -- Metadata
  sent_by UUID REFERENCES user_profiles(id),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Read tracking
  read_by UUID[] DEFAULT '{}',

  -- Editing
  edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE
);

-- Thread Participants (explicit tracking)
CREATE TABLE IF NOT EXISTS thread_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES communication_threads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) NOT NULL,

  -- Participation info
  role VARCHAR(50), -- 'owner', 'participant', 'observer'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE,

  -- Notifications
  muted BOOLEAN DEFAULT false,

  -- Metadata
  added_by UUID REFERENCES user_profiles(id),

  UNIQUE(thread_id, user_id)
);

-- Indexes for communication_threads
CREATE INDEX IF NOT EXISTS idx_communication_threads_entity ON communication_threads(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_communication_threads_status ON communication_threads(status);
CREATE INDEX IF NOT EXISTS idx_communication_threads_created ON communication_threads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_communication_threads_last_message ON communication_threads(last_message_at DESC);

-- Indexes for thread_messages
CREATE INDEX IF NOT EXISTS idx_thread_messages_thread ON thread_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_messages_sent_by ON thread_messages(sent_by);
CREATE INDEX IF NOT EXISTS idx_thread_messages_sent_at ON thread_messages(sent_at DESC);

-- Indexes for thread_participants
CREATE INDEX IF NOT EXISTS idx_thread_participants_thread ON thread_participants(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_participants_user ON thread_participants(user_id);

-- RLS Policies
ALTER TABLE communication_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_participants ENABLE ROW LEVEL SECURITY;

-- Users can view threads they're participants in
CREATE POLICY "Users can view threads they participate in"
  ON communication_threads FOR SELECT
  USING (
    created_by::text = auth.uid()::text
    OR auth.uid()::text = ANY(participant_ids::text[])
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id::text = auth.uid()::text
      AND user_type IN ('super_admin', 'admin')
    )
  );

-- Users can create threads
CREATE POLICY "Users can create threads"
  ON communication_threads FOR INSERT
  WITH CHECK (created_by::text = auth.uid()::text);

-- Users can update their own threads
CREATE POLICY "Users can update their threads"
  ON communication_threads FOR UPDATE
  USING (
    created_by::text = auth.uid()::text
    OR auth.uid()::text = ANY(participant_ids::text[])
  );

-- Users can view messages in threads they participate in
CREATE POLICY "Users can view messages in their threads"
  ON thread_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM communication_threads
      WHERE id = thread_messages.thread_id
      AND (
        created_by::text = auth.uid()::text
        OR auth.uid()::text = ANY(participant_ids::text[])
        OR EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id::text = auth.uid()::text
          AND user_type IN ('super_admin', 'admin')
        )
      )
    )
  );

-- Users can send messages in their threads
CREATE POLICY "Users can send messages in their threads"
  ON thread_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM communication_threads
      WHERE id = thread_messages.thread_id
      AND (
        created_by::text = auth.uid()::text
        OR auth.uid()::text = ANY(participant_ids::text[])
      )
    )
  );

-- Users can edit their own messages
CREATE POLICY "Users can edit their own messages"
  ON thread_messages FOR UPDATE
  USING (sent_by::text = auth.uid()::text);

-- Users can view their own participation records
CREATE POLICY "Users can view their own participation"
  ON thread_participants FOR SELECT
  USING (user_id::text = auth.uid()::text);

-- Thread owners can add participants
CREATE POLICY "Thread owners can add participants"
  ON thread_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM communication_threads
      WHERE id = thread_participants.thread_id
      AND created_by::text = auth.uid()::text
    )
  );

-- Comments
COMMENT ON TABLE communication_threads IS 'Conversations and discussions about entities (orders, tasks, QC, etc.)';
COMMENT ON TABLE thread_messages IS 'Individual messages within communication threads';
COMMENT ON TABLE thread_participants IS 'Explicit tracking of thread participants with roles and notification preferences';


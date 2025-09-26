-- Migration: Enhance Tasks Schema for Phase 1
-- Description: Add new tables and fields for enhanced task management

-- 1. Add new fields to existing tasks table
ALTER TABLE tasks ADD COLUMN reporter_id UUID;
ALTER TABLE tasks ADD COLUMN resolution TEXT;
ALTER TABLE tasks ADD COLUMN archived_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN archived_by UUID;
ALTER TABLE tasks ADD COLUMN last_activity_at TIMESTAMPTZ DEFAULT now();

-- 2. Update existing data
UPDATE tasks SET reporter_id = created_by WHERE reporter_id IS NULL;
UPDATE tasks SET last_activity_at = updated_at WHERE last_activity_at IS NULL;

-- 3. Create task_attachments table
CREATE TABLE task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100),
  thumbnail_path TEXT,
  uploaded_by UUID NOT NULL,
  can_move_to_system BOOLEAN DEFAULT true,
  moved_to_entity_type VARCHAR(50),
  moved_to_entity_id UUID,
  moved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create task_activities table
CREATE TABLE task_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  activity_type VARCHAR(50) NOT NULL,
  content TEXT,
  old_value JSONB,
  new_value JSONB,
  mentioned_users UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Create task_entity_links table
CREATE TABLE task_entity_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  entity_name VARCHAR(255),
  link_type VARCHAR(20) DEFAULT 'related',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Create indexes for performance
CREATE INDEX idx_task_attachments_task_id ON task_attachments(task_id);
CREATE INDEX idx_task_attachments_uploaded_by ON task_attachments(uploaded_by);
CREATE INDEX idx_task_activities_task_id ON task_activities(task_id);
CREATE INDEX idx_task_activities_user_id ON task_activities(user_id);
CREATE INDEX idx_task_activities_type ON task_activities(activity_type);
CREATE INDEX idx_task_entity_links_task_id ON task_entity_links(task_id);
CREATE INDEX idx_task_entity_links_entity ON task_entity_links(entity_type, entity_id);
CREATE INDEX idx_tasks_reporter_id ON tasks(reporter_id);
CREATE INDEX idx_tasks_archived_at ON tasks(archived_at);
CREATE INDEX idx_tasks_last_activity ON tasks(last_activity_at);

-- 7. Add unique constraints
ALTER TABLE task_entity_links ADD CONSTRAINT unique_task_entity_link
  UNIQUE(task_id, entity_type, entity_id);

-- 8. Create initial activities for existing tasks
INSERT INTO task_activities (task_id, user_id, activity_type, content, created_at)
SELECT id, created_by, 'task_created', 'Task created', created_at
FROM tasks
WHERE NOT EXISTS (
  SELECT 1 FROM task_activities WHERE task_id = tasks.id AND activity_type = 'task_created'
);
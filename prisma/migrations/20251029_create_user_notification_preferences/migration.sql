-- Migration: Create user_notification_preferences table
-- Created: October 29, 2025
-- Purpose: Store user-specific notification preferences for channels and categories

CREATE TABLE user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Channel preferences (in_app, email, google_chat)
  channels JSONB NOT NULL DEFAULT '{"in_app": true, "email": true, "google_chat": false}',

  -- Category-specific preferences (system, order, production, shipping, payment, task, message, alert)
  categories JSONB NOT NULL DEFAULT '{
    "system": {"in_app": true, "email": true},
    "order": {"in_app": true, "email": true},
    "production": {"in_app": true, "email": false},
    "shipping": {"in_app": true, "email": true},
    "payment": {"in_app": true, "email": true},
    "task": {"in_app": true, "email": true},
    "message": {"in_app": true, "email": false},
    "alert": {"in_app": true, "email": true, "google_chat": true}
  }',

  -- Quiet hours (UTC timezone)
  -- Format: {"enabled": true, "start": "22:00", "end": "08:00", "timezone": "America/Los_Angeles"}
  quiet_hours JSONB DEFAULT NULL,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);

-- RLS Policies
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view their own preferences"
  ON user_notification_preferences FOR SELECT
  USING (user_id::text = auth.uid()::text);

-- Users can update their own preferences
CREATE POLICY "Users can update their own preferences"
  ON user_notification_preferences FOR UPDATE
  USING (user_id::text = auth.uid()::text);

-- Users can insert their own preferences
CREATE POLICY "Users can insert their own preferences"
  ON user_notification_preferences FOR INSERT
  WITH CHECK (user_id::text = auth.uid()::text);

-- Users can delete their own preferences (reset to defaults)
CREATE POLICY "Users can delete their own preferences"
  ON user_notification_preferences FOR DELETE
  USING (user_id::text = auth.uid()::text);

-- Comment on table
COMMENT ON TABLE user_notification_preferences IS 'Stores user-specific notification preferences for channels (in_app, email, google_chat) and categories (system, order, production, etc.)';

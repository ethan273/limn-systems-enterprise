-- Migration: Add notification enhancements for bell icon functionality
-- Date: 2025-10-04
-- Purpose: Add link and entity tracking fields to notifications table

-- Add link field for notification navigation
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS link TEXT;

-- Add entity tracking fields for notification context
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS entity_type TEXT,
ADD COLUMN IF NOT EXISTS entity_id UUID;

-- Add index for user notifications query optimization
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read_at
ON public.notifications(user_id, read_at)
WHERE read_at IS NULL;

-- Add index for entity lookups
CREATE INDEX IF NOT EXISTS idx_notifications_entity
ON public.notifications(entity_type, entity_id);

-- Comment fields
COMMENT ON COLUMN public.notifications.link IS 'URL to navigate to when clicking notification (e.g., /tasks/123)';
COMMENT ON COLUMN public.notifications.entity_type IS 'Type of entity the notification refers to (e.g., task, order, production_order)';
COMMENT ON COLUMN public.notifications.entity_id IS 'ID of the entity the notification refers to';

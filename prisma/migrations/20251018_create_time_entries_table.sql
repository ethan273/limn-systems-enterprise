-- Migration: Create time_entries table
-- Date: 2025-10-18
-- Purpose: Track time spent on tasks by users
-- Impact: Enables time tracking functionality for tasks

-- Create time_entries table
CREATE TABLE IF NOT EXISTS public.time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration INTEGER, -- Duration in seconds
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Foreign key constraint to tasks
  CONSTRAINT fk_time_entries_task
    FOREIGN KEY (task_id)
    REFERENCES public.tasks(id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_entries_task_id
  ON public.time_entries(task_id);

CREATE INDEX IF NOT EXISTS idx_time_entries_user_id
  ON public.time_entries(user_id);

CREATE INDEX IF NOT EXISTS idx_time_entries_start_time
  ON public.time_entries(start_time);

CREATE INDEX IF NOT EXISTS idx_time_entries_end_time
  ON public.time_entries(end_time);

CREATE INDEX IF NOT EXISTS idx_time_entries_created_at
  ON public.time_entries(created_at);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_time_entries_task_user
  ON public.time_entries(task_id, user_id);

-- Add column comments for documentation
COMMENT ON TABLE public.time_entries IS 'Tracks time spent by users on specific tasks';
COMMENT ON COLUMN public.time_entries.task_id IS 'Foreign key to tasks table';
COMMENT ON COLUMN public.time_entries.user_id IS 'ID of user who logged this time';
COMMENT ON COLUMN public.time_entries.description IS 'Optional description of work performed';
COMMENT ON COLUMN public.time_entries.start_time IS 'When the time tracking started';
COMMENT ON COLUMN public.time_entries.end_time IS 'When the time tracking ended (null if still running)';
COMMENT ON COLUMN public.time_entries.duration IS 'Total duration in seconds (can be calculated from start_time and end_time)';

-- Enable Row Level Security (RLS) for Supabase
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Service role can manage all time entries
CREATE POLICY "Service role can manage time entries"
  ON public.time_entries
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can view their own time entries
CREATE POLICY "Users can view their own time entries"
  ON public.time_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Authenticated users can insert their own time entries
CREATE POLICY "Users can insert their own time entries"
  ON public.time_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

-- Authenticated users can update their own time entries
CREATE POLICY "Users can update their own time entries"
  ON public.time_entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Authenticated users can delete their own time entries
CREATE POLICY "Users can delete their own time entries"
  ON public.time_entries
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Task managers and admins can view all time entries for their tasks
CREATE POLICY "Task owners and admins can view time entries"
  ON public.time_entries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = time_entries.task_id
      AND (
        tasks.assigned_to::text = auth.uid()::text
        OR tasks.created_by::text = auth.uid()::text
      )
    )
  );

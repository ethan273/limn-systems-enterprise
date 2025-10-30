-- Migration: Add RLS policies to workflow tables in DEV
-- Created: October 29, 2025
-- Purpose: Enable RLS on workflow_step_executions and workflow_execution_logs in DEV

-- Enable RLS (if not already enabled)
ALTER TABLE workflow_step_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_execution_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view workflow step executions" ON workflow_step_executions;
DROP POLICY IF EXISTS "Users can view workflow logs" ON workflow_execution_logs;

-- RLS Policies for workflow_step_executions
CREATE POLICY "Users can view workflow step executions"
  ON workflow_step_executions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workflow_executions
      WHERE id = workflow_step_executions.execution_id
    )
  );

-- RLS Policies for workflow_execution_logs
CREATE POLICY "Users can view workflow logs"
  ON workflow_execution_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workflow_executions
      WHERE id = workflow_execution_logs.execution_id
    )
  );

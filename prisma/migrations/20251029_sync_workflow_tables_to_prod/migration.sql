-- Migration: Sync workflow tables from DEV to PROD
-- Created: October 29, 2025
-- Purpose: Add missing workflow tables to PROD and enable RLS policies

-- Workflow Step Executions (individual step tracking) - MISSING IN PROD
CREATE TABLE IF NOT EXISTS workflow_step_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES workflow_executions(id) ON DELETE CASCADE NOT NULL,

  -- Step info
  step_id VARCHAR(255) NOT NULL,
  step_type VARCHAR(50) NOT NULL, -- 'task', 'notification', 'approval', 'condition', 'wait'
  step_name VARCHAR(255),

  -- State
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'skipped'

  -- Data
  input_data JSONB,
  output_data JSONB,

  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Timing
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow Execution Logs (audit trail) - MISSING IN PROD
CREATE TABLE IF NOT EXISTS workflow_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID REFERENCES workflow_executions(id) ON DELETE CASCADE NOT NULL,
  step_execution_id UUID REFERENCES workflow_step_executions(id) ON DELETE CASCADE,

  -- Log entry
  level VARCHAR(20) NOT NULL, -- 'info', 'warning', 'error', 'debug'
  message TEXT NOT NULL,
  data JSONB,

  -- Timing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task Automation Rules - MISSING IN PROD
CREATE TABLE IF NOT EXISTS task_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Trigger configuration
  trigger_event VARCHAR(100) NOT NULL, -- 'order.created', 'production_order.status_change', etc.
  trigger_conditions JSONB DEFAULT '{}',

  -- Task creation config
  task_template_id UUID REFERENCES task_templates(id),
  task_config JSONB NOT NULL, -- {title, description, priority, assigned_to, due_date_offset, ...}

  -- Auto-assignment rules
  assignment_rule VARCHAR(50), -- 'round_robin', 'least_loaded', 'specific_user', 'by_department'
  assignment_config JSONB,

  -- Dependency rules
  depends_on_tasks JSONB DEFAULT '[]', -- [{"task_type": "design_approval", "status": "completed"}, ...]

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for workflow_step_executions
CREATE INDEX IF NOT EXISTS idx_workflow_step_executions_execution ON workflow_step_executions(execution_id);
CREATE INDEX IF NOT EXISTS idx_workflow_step_executions_status ON workflow_step_executions(status);

-- Indexes for task_automation_rules
CREATE INDEX IF NOT EXISTS idx_task_automation_rules_event ON task_automation_rules(trigger_event);
CREATE INDEX IF NOT EXISTS idx_task_automation_rules_active ON task_automation_rules(is_active);

-- Indexes for workflow_execution_logs
CREATE INDEX IF NOT EXISTS idx_workflow_execution_logs_execution ON workflow_execution_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_workflow_execution_logs_created ON workflow_execution_logs(created_at DESC);

-- Enable RLS on new tables
ALTER TABLE workflow_step_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_automation_rules ENABLE ROW LEVEL SECURITY;

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

-- RLS Policies for task_automation_rules
CREATE POLICY "Admins can manage task automation rules"
  ON task_automation_rules FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id::text = auth.uid()::text
    AND user_type IN ('super_admin', 'admin')
  ));

-- Comments
COMMENT ON TABLE workflow_step_executions IS 'Individual step execution tracking within workflows';
COMMENT ON TABLE workflow_execution_logs IS 'Audit trail for workflow execution events';
COMMENT ON TABLE task_automation_rules IS 'Rules for automatic task creation based on events';

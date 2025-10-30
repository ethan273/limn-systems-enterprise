-- Migration: Create workflow execution tables
-- Created: October 29, 2025
-- Purpose: Enable workflow automation, task automation, and execution tracking

-- Workflow Templates (reusable workflow definitions)
CREATE TABLE workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  category VARCHAR(100) NOT NULL, -- 'order', 'production', 'qc', 'shipping', 'payment'

  -- Workflow definition (JSON array of steps)
  steps JSONB NOT NULL, -- [{"id": "step1", "type": "task", "config": {...}}, ...]

  -- Triggers (when to auto-start this workflow)
  triggers JSONB DEFAULT '[]', -- [{"event": "order.created", "conditions": {...}}, ...]

  -- Status
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,

  -- Metadata
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow Executions (runtime instances)
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES workflow_templates(id) NOT NULL,

  -- Context
  entity_type VARCHAR(100) NOT NULL, -- 'order', 'production_order', 'shipment', etc.
  entity_id UUID NOT NULL,

  -- State
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'cancelled'
  current_step_id VARCHAR(255),

  -- Progress tracking
  steps_completed INTEGER DEFAULT 0,
  steps_total INTEGER NOT NULL,
  progress_percentage DECIMAL(5,2) DEFAULT 0,

  -- Execution data
  input_data JSONB,
  output_data JSONB,

  -- Error handling
  error_message TEXT,
  error_step_id VARCHAR(255),
  retry_count INTEGER DEFAULT 0,

  -- Timing
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Metadata
  triggered_by VARCHAR(100), -- 'manual', 'auto', 'event'
  triggered_by_user_id UUID REFERENCES user_profiles(id)
);

-- Workflow Step Executions (individual step tracking)
CREATE TABLE workflow_step_executions (
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

-- Task Automation Rules
CREATE TABLE task_automation_rules (
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

-- Workflow Execution Logs (audit trail)
CREATE TABLE workflow_execution_logs (
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

-- Indexes for workflow_templates
CREATE INDEX idx_workflow_templates_category ON workflow_templates(category);
CREATE INDEX idx_workflow_templates_active ON workflow_templates(is_active);

-- Indexes for workflow_executions
CREATE INDEX idx_workflow_executions_template ON workflow_executions(template_id);
CREATE INDEX idx_workflow_executions_entity ON workflow_executions(entity_type, entity_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX idx_workflow_executions_created ON workflow_executions(created_at DESC);

-- Indexes for workflow_step_executions
CREATE INDEX idx_workflow_step_executions_execution ON workflow_step_executions(execution_id);
CREATE INDEX idx_workflow_step_executions_status ON workflow_step_executions(status);

-- Indexes for task_automation_rules
CREATE INDEX idx_task_automation_rules_event ON task_automation_rules(trigger_event);
CREATE INDEX idx_task_automation_rules_active ON task_automation_rules(is_active);

-- Indexes for workflow_execution_logs
CREATE INDEX idx_workflow_execution_logs_execution ON workflow_execution_logs(execution_id);
CREATE INDEX idx_workflow_execution_logs_created ON workflow_execution_logs(created_at DESC);

-- RLS Policies
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_step_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_execution_logs ENABLE ROW LEVEL SECURITY;

-- Templates: Admins only
CREATE POLICY "Admins can manage workflow templates"
  ON workflow_templates FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id::text = auth.uid()::text
    AND user_type IN ('super_admin', 'admin')
  ));

-- Executions: Users can view executions they triggered or admins can view all
CREATE POLICY "Users can view workflow executions"
  ON workflow_executions FOR SELECT
  USING (
    triggered_by_user_id::text = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id::text = auth.uid()::text
      AND user_type IN ('super_admin', 'admin')
    )
  );

-- Step executions: Same as executions
CREATE POLICY "Users can view workflow step executions"
  ON workflow_step_executions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workflow_executions
      WHERE id = workflow_step_executions.execution_id
      AND (
        triggered_by_user_id::text = auth.uid()::text
        OR EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id::text = auth.uid()::text
          AND user_type IN ('super_admin', 'admin')
        )
      )
    )
  );

-- Automation rules: Admins only
CREATE POLICY "Admins can manage task automation rules"
  ON task_automation_rules FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id::text = auth.uid()::text
    AND user_type IN ('super_admin', 'admin')
  ));

-- Logs: Same as executions
CREATE POLICY "Users can view workflow logs"
  ON workflow_execution_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workflow_executions
      WHERE id = workflow_execution_logs.execution_id
      AND (
        triggered_by_user_id::text = auth.uid()::text
        OR EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id::text = auth.uid()::text
          AND user_type IN ('super_admin', 'admin')
        )
      )
    )
  );

-- Comments
COMMENT ON TABLE workflow_templates IS 'Reusable workflow definitions with steps and triggers';
COMMENT ON TABLE workflow_executions IS 'Runtime instances of workflow executions';
COMMENT ON TABLE workflow_step_executions IS 'Individual step execution tracking within workflows';
COMMENT ON TABLE task_automation_rules IS 'Rules for automatic task creation based on events';
COMMENT ON TABLE workflow_execution_logs IS 'Audit trail for workflow execution events';

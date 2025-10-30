-- Migration: Create automation_workflows table
-- Purpose: Store workflow definitions with nodes and edges for visual workflow builder
-- Date: 2025-10-29

-- Create automation_workflows table
CREATE TABLE IF NOT EXISTS automation_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    workflow_type VARCHAR(50), -- 'approval', 'notification', 'task_creation', 'custom'
    entity_type VARCHAR(100), -- 'shop_drawing', 'production_order', 'project', 'task'
    entity_id UUID,

    -- Workflow definition (nodes and edges)
    nodes JSONB DEFAULT '[]'::jsonb,
    edges JSONB DEFAULT '[]'::jsonb,

    -- Configuration
    config JSONB DEFAULT '{}'::jsonb,

    -- Status and execution
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'active', 'paused', 'archived'
    version INT DEFAULT 1,
    is_template BOOLEAN DEFAULT false,

    -- Metadata
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_automation_workflows_entity ON automation_workflows(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_automation_workflows_status ON automation_workflows(status);
CREATE INDEX IF NOT EXISTS idx_automation_workflows_created_by ON automation_workflows(created_by);
CREATE INDEX IF NOT EXISTS idx_automation_workflows_created_at ON automation_workflows(created_at);
CREATE INDEX IF NOT EXISTS idx_automation_workflows_updated_at ON automation_workflows(updated_at);
CREATE INDEX IF NOT EXISTS idx_automation_workflows_type ON automation_workflows(workflow_type);
CREATE INDEX IF NOT EXISTS idx_automation_workflows_is_template ON automation_workflows(is_template);

-- Create composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_automation_workflows_entity_status
ON automation_workflows(entity_type, entity_id, status);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_automation_workflows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER automation_workflows_updated_at
    BEFORE UPDATE ON automation_workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_automation_workflows_updated_at();

-- Add comment
COMMENT ON TABLE automation_workflows IS 'Stores workflow definitions with visual nodes and edges for automation';

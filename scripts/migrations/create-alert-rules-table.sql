-- Migration: Create alert_rules table
-- Purpose: Store alert rule definitions for workflow monitoring
-- Date: 2025-10-29

-- Create alert_rules table
CREATE TABLE IF NOT EXISTS alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Rule identification
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Metric configuration
    metric VARCHAR(100) NOT NULL, -- 'execution_time', 'failure_rate', 'queue_size', 'resource_usage', 'custom'
    metric_source VARCHAR(100), -- 'workflow', 'automation_rule', 'system', 'custom'
    entity_id UUID, -- Optional: specific workflow or rule to monitor

    -- Threshold configuration
    threshold_type VARCHAR(50) NOT NULL, -- 'above', 'below', 'equals', 'percentage'
    threshold_value NUMERIC(10, 2) NOT NULL,
    threshold_unit VARCHAR(50), -- 'ms', 'count', 'percent', 'mb', etc.

    -- Time window for metric evaluation
    evaluation_window_minutes INT DEFAULT 5,
    evaluation_frequency_minutes INT DEFAULT 1,

    -- Alert channels
    alert_channels TEXT[] NOT NULL, -- ['email', 'in_app', 'google_chat', 'sms']

    -- Recipients
    recipient_user_ids UUID[],
    recipient_emails TEXT[],
    recipient_roles TEXT[], -- ['admin', 'manager', 'developer']

    -- Alert message template
    alert_title_template TEXT,
    alert_message_template TEXT,

    -- Configuration
    severity VARCHAR(50) DEFAULT 'warning', -- 'info', 'warning', 'error', 'critical'
    is_active BOOLEAN DEFAULT true,
    send_resolved_notification BOOLEAN DEFAULT true,

    -- Cooldown to prevent alert spam
    cooldown_minutes INT DEFAULT 15,
    last_triggered_at TIMESTAMPTZ,
    trigger_count INT DEFAULT 0,

    -- Metadata
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create alert_triggers table (tracks when alerts are triggered)
CREATE TABLE IF NOT EXISTS alert_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Alert reference
    alert_rule_id UUID NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,

    -- Trigger details
    metric_value NUMERIC(10, 2),
    threshold_value NUMERIC(10, 2),
    threshold_exceeded BOOLEAN,

    -- Alert status
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'acknowledged', 'resolved', 'expired'
    severity VARCHAR(50),

    -- Message sent
    alert_title TEXT,
    alert_message TEXT,
    channels_notified TEXT[],

    -- Recipients who received alert
    notified_user_ids UUID[],
    notified_emails TEXT[],

    -- Acknowledgment
    acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMPTZ,
    acknowledgment_notes TEXT,

    -- Resolution
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,

    -- Timestamps
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for alert_rules
CREATE INDEX IF NOT EXISTS idx_alert_rules_metric ON alert_rules(metric);
CREATE INDEX IF NOT EXISTS idx_alert_rules_is_active ON alert_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_alert_rules_severity ON alert_rules(severity);
CREATE INDEX IF NOT EXISTS idx_alert_rules_created_by ON alert_rules(created_by);
CREATE INDEX IF NOT EXISTS idx_alert_rules_created_at ON alert_rules(created_at);
CREATE INDEX IF NOT EXISTS idx_alert_rules_entity_id ON alert_rules(entity_id);

-- GIN indexes for array fields
CREATE INDEX IF NOT EXISTS idx_alert_rules_recipient_user_ids ON alert_rules USING GIN(recipient_user_ids);
CREATE INDEX IF NOT EXISTS idx_alert_rules_recipient_roles ON alert_rules USING GIN(recipient_roles);

-- Composite index for active alerts ready to evaluate
CREATE INDEX IF NOT EXISTS idx_alert_rules_active_evaluation
ON alert_rules(is_active, last_triggered_at)
WHERE is_active = true;

-- Create indexes for alert_triggers
CREATE INDEX IF NOT EXISTS idx_alert_triggers_rule_id ON alert_triggers(alert_rule_id);
CREATE INDEX IF NOT EXISTS idx_alert_triggers_status ON alert_triggers(status);
CREATE INDEX IF NOT EXISTS idx_alert_triggers_triggered_at ON alert_triggers(triggered_at);
CREATE INDEX IF NOT EXISTS idx_alert_triggers_acknowledged_by ON alert_triggers(acknowledged_by);
CREATE INDEX IF NOT EXISTS idx_alert_triggers_resolved_by ON alert_triggers(resolved_by);

-- Composite index for active/unresolved alerts
CREATE INDEX IF NOT EXISTS idx_alert_triggers_active
ON alert_triggers(status, triggered_at)
WHERE status IN ('active', 'acknowledged');

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_alert_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER alert_rules_updated_at
    BEFORE UPDATE ON alert_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_alert_rules_updated_at();

CREATE OR REPLACE FUNCTION update_alert_triggers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER alert_triggers_updated_at
    BEFORE UPDATE ON alert_triggers
    FOR EACH ROW
    EXECUTE FUNCTION update_alert_triggers_updated_at();

-- Add function to check if alert is in cooldown period
CREATE OR REPLACE FUNCTION is_alert_in_cooldown(rule_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    rule_record RECORD;
BEGIN
    SELECT last_triggered_at, cooldown_minutes
    INTO rule_record
    FROM alert_rules
    WHERE id = rule_id;

    IF rule_record.last_triggered_at IS NULL THEN
        RETURN false;
    END IF;

    IF rule_record.cooldown_minutes IS NULL OR rule_record.cooldown_minutes = 0 THEN
        RETURN false;
    END IF;

    RETURN (NOW() - rule_record.last_triggered_at) < (rule_record.cooldown_minutes || ' minutes')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE alert_rules IS 'Stores alert rule definitions for workflow and system monitoring';
COMMENT ON TABLE alert_triggers IS 'Tracks when alerts are triggered, acknowledged, and resolved';
COMMENT ON FUNCTION is_alert_in_cooldown(UUID) IS 'Checks if an alert rule is currently in cooldown period';

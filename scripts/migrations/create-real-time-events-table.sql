-- Migration: Create real_time_events table
-- Purpose: Store and track real-time events for WebSocket/SSE distribution
-- Date: 2025-10-29

-- Create real_time_events table
CREATE TABLE IF NOT EXISTS real_time_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Event identification
    event_type VARCHAR(100) NOT NULL, -- 'message', 'notification', 'status_change', 'workflow_update'
    event_name VARCHAR(255),

    -- Entity tracking
    entity_type VARCHAR(100) NOT NULL, -- 'order', 'project', 'task', 'shop_drawing', etc.
    entity_id UUID NOT NULL,

    -- Event data
    event_data JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Delivery tracking
    recipient_user_ids UUID[], -- Array of user IDs who should receive this event
    delivered_to UUID[] DEFAULT ARRAY[]::UUID[], -- Array of users who have received the event

    -- Priority and lifecycle
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'delivered', 'expired'
    expires_at TIMESTAMPTZ, -- Events can expire if not delivered

    -- Source tracking
    triggered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    source_ip VARCHAR(45),
    user_agent TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_real_time_events_entity ON real_time_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_real_time_events_event_type ON real_time_events(event_type);
CREATE INDEX IF NOT EXISTS idx_real_time_events_status ON real_time_events(status);
CREATE INDEX IF NOT EXISTS idx_real_time_events_priority ON real_time_events(priority);
CREATE INDEX IF NOT EXISTS idx_real_time_events_created_at ON real_time_events(created_at);
CREATE INDEX IF NOT EXISTS idx_real_time_events_expires_at ON real_time_events(expires_at);
CREATE INDEX IF NOT EXISTS idx_real_time_events_triggered_by ON real_time_events(triggered_by);

-- GIN index for JSONB fields for efficient querying
CREATE INDEX IF NOT EXISTS idx_real_time_events_event_data ON real_time_events USING GIN(event_data);
CREATE INDEX IF NOT EXISTS idx_real_time_events_metadata ON real_time_events USING GIN(metadata);

-- Index for recipient lookup
CREATE INDEX IF NOT EXISTS idx_real_time_events_recipients ON real_time_events USING GIN(recipient_user_ids);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_real_time_events_pending_delivery
ON real_time_events(status, created_at)
WHERE status = 'pending';

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_real_time_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER real_time_events_updated_at
    BEFORE UPDATE ON real_time_events
    FOR EACH ROW
    EXECUTE FUNCTION update_real_time_events_updated_at();

-- Add function to clean up expired events (run as scheduled job)
CREATE OR REPLACE FUNCTION cleanup_expired_real_time_events()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM real_time_events
    WHERE status = 'expired'
    OR (expires_at IS NOT NULL AND expires_at < NOW())
    OR (status = 'delivered' AND delivered_at < NOW() - INTERVAL '7 days');

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON TABLE real_time_events IS 'Stores real-time events for WebSocket/SSE distribution to clients';
COMMENT ON FUNCTION cleanup_expired_real_time_events() IS 'Cleans up expired and old delivered events (should be run as scheduled job)';

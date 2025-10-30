-- Migration: Sync portal activity tracking tables to PROD
-- Created: October 29, 2025
-- Purpose: Add missing portal_activity_logs and portal_access_audit tables to PROD

-- Portal Activity Logs (detailed activity tracking) - MISSING IN PROD
CREATE TABLE IF NOT EXISTS portal_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES portal_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  portal_type VARCHAR(50) NOT NULL,

  -- Activity details
  activity_type VARCHAR(100) NOT NULL, -- 'view_order', 'download_invoice', 'upload_file', 'submit_report', etc.
  entity_type VARCHAR(100), -- 'order', 'invoice', 'document', 'report', etc.
  entity_id UUID,

  -- Additional data
  metadata JSONB,

  -- Timing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Portal Access Audit (track permission checks) - MISSING IN PROD
CREATE TABLE IF NOT EXISTS portal_access_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  portal_type VARCHAR(50) NOT NULL,

  -- Access attempt
  resource_type VARCHAR(100) NOT NULL,
  resource_id UUID,
  action VARCHAR(50) NOT NULL, -- 'view', 'edit', 'delete', 'download'

  -- Result
  access_granted BOOLEAN NOT NULL,
  denial_reason VARCHAR(255),

  -- Context
  ip_address INET,
  user_agent TEXT,

  -- Timing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for portal_activity_logs
CREATE INDEX IF NOT EXISTS idx_portal_activity_logs_session ON portal_activity_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_portal_activity_logs_user ON portal_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_portal_activity_logs_portal_type ON portal_activity_logs(portal_type);
CREATE INDEX IF NOT EXISTS idx_portal_activity_logs_activity_type ON portal_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_portal_activity_logs_entity ON portal_activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_portal_activity_logs_created ON portal_activity_logs(created_at DESC);

-- Indexes for portal_access_audit
CREATE INDEX IF NOT EXISTS idx_portal_access_audit_user ON portal_access_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_portal_access_audit_portal_type ON portal_access_audit(portal_type);
CREATE INDEX IF NOT EXISTS idx_portal_access_audit_resource ON portal_access_audit(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_portal_access_audit_access_granted ON portal_access_audit(access_granted);
CREATE INDEX IF NOT EXISTS idx_portal_access_audit_created ON portal_access_audit(created_at DESC);

-- RLS Policies
ALTER TABLE portal_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_access_audit ENABLE ROW LEVEL SECURITY;

-- Users can view their own activity logs
CREATE POLICY "Users can view their own activity logs"
  ON portal_activity_logs FOR SELECT
  USING (user_id::text = auth.uid()::text);

-- Admins can view all activity logs
CREATE POLICY "Admins can view all activity logs"
  ON portal_activity_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id::text = auth.uid()::text
    AND user_type IN ('super_admin', 'admin')
  ));

-- System can insert activity logs
CREATE POLICY "System can insert activity logs"
  ON portal_activity_logs FOR INSERT
  WITH CHECK (true);

-- Users can view their own access audit logs
CREATE POLICY "Users can view their own access audit"
  ON portal_access_audit FOR SELECT
  USING (user_id::text = auth.uid()::text);

-- Admins can view all access audit logs
CREATE POLICY "Admins can view all access audit"
  ON portal_access_audit FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id::text = auth.uid()::text
    AND user_type IN ('super_admin', 'admin')
  ));

-- System can insert access audit
CREATE POLICY "System can insert access audit"
  ON portal_access_audit FOR INSERT
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE portal_activity_logs IS 'Detailed activity tracking for portal actions (view, download, upload, submit)';
COMMENT ON TABLE portal_access_audit IS 'Audit trail for permission checks and access attempts';

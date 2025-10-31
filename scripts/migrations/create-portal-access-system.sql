-- Migration: Create Universal Portal Access Control System
-- Date: 2025-10-31
-- Purpose: Enable granular portal and module-level access control for users
-- Impact: Replaces customer_portal_access with universal portal_access table
--         Adds approval workflow fields to pending_user_requests
--
-- IMPORTANT: Apply to BOTH dev and prod databases
--
-- Related Tables:
--   - portal_access (NEW)
--   - pending_user_requests (MODIFIED)
--
-- Usage:
--   psql $DEV_DB_URL < scripts/migrations/create-portal-access-system.sql
--   psql $PROD_DB_URL < scripts/migrations/create-portal-access-system.sql

-- ============================================================
-- PART 1: CREATE portal_access TABLE
-- ============================================================

-- Create the universal portal_access table
CREATE TABLE IF NOT EXISTS portal_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  portal_type VARCHAR(50) NOT NULL CHECK (portal_type IN ('customer', 'designer', 'factory', 'qc')),
  allowed_modules JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Optional linking to organizations/companies
  customer_id UUID NULL,
  partner_id UUID NULL,

  -- Access control
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Audit fields
  granted_by UUID NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ NULL,
  revoked_by UUID NULL,
  last_accessed_at TIMESTAMPTZ NULL,

  -- Metadata for future extensibility
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Foreign keys
  CONSTRAINT fk_portal_access_user
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_portal_access_customer
    FOREIGN KEY (customer_id)
    REFERENCES customers(id)
    ON DELETE SET NULL,

  CONSTRAINT fk_portal_access_partner
    FOREIGN KEY (partner_id)
    REFERENCES partners(id)
    ON DELETE SET NULL,

  CONSTRAINT fk_portal_access_granted_by
    FOREIGN KEY (granted_by)
    REFERENCES auth.users(id)
    ON DELETE SET NULL,

  CONSTRAINT fk_portal_access_revoked_by
    FOREIGN KEY (revoked_by)
    REFERENCES auth.users(id)
    ON DELETE SET NULL
);

-- Create indexes for portal_access table
CREATE INDEX IF NOT EXISTS idx_portal_access_user_id
  ON portal_access(user_id);

CREATE INDEX IF NOT EXISTS idx_portal_access_portal_type
  ON portal_access(portal_type);

CREATE INDEX IF NOT EXISTS idx_portal_access_is_active
  ON portal_access(is_active);

CREATE INDEX IF NOT EXISTS idx_portal_access_customer_id
  ON portal_access(customer_id)
  WHERE customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_portal_access_partner_id
  ON portal_access(partner_id)
  WHERE partner_id IS NOT NULL;

-- Composite index for common query pattern: active portals per user
CREATE INDEX IF NOT EXISTS idx_portal_access_user_active
  ON portal_access(user_id, is_active, portal_type)
  WHERE is_active = true;

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_portal_access_granted_at
  ON portal_access(granted_at DESC);

-- Index for cleanup/archival queries
CREATE INDEX IF NOT EXISTS idx_portal_access_revoked
  ON portal_access(revoked_at DESC)
  WHERE revoked_at IS NOT NULL;

-- Add comment to table
COMMENT ON TABLE portal_access IS 'Universal portal access control - determines which portals and modules users can access';
COMMENT ON COLUMN portal_access.portal_type IS 'Type of portal: customer, designer, factory, or qc';
COMMENT ON COLUMN portal_access.allowed_modules IS 'JSON array of module names user can access within this portal';
COMMENT ON COLUMN portal_access.customer_id IS 'Optional link to customer record for customer portal users';
COMMENT ON COLUMN portal_access.partner_id IS 'Optional link to partner record for designer/factory users';

-- ============================================================
-- PART 2: ADD APPROVAL FIELDS TO pending_user_requests
-- ============================================================

-- Add portal access approval fields to pending_user_requests
ALTER TABLE pending_user_requests
  ADD COLUMN IF NOT EXISTS approved_portal_type VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS approved_modules JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS linked_organization_id UUID NULL,
  ADD COLUMN IF NOT EXISTS organization_type VARCHAR(50) NULL CHECK (organization_type IN ('customer', 'partner', NULL));

-- Add index for filtering by approved portal type
CREATE INDEX IF NOT EXISTS idx_pending_user_requests_approved_portal_type
  ON pending_user_requests(approved_portal_type)
  WHERE approved_portal_type IS NOT NULL;

-- Add comments
COMMENT ON COLUMN pending_user_requests.approved_portal_type IS 'Portal type selected by admin during approval (customer, designer, factory, qc)';
COMMENT ON COLUMN pending_user_requests.approved_modules IS 'Modules selected by admin during approval - stored for audit trail';
COMMENT ON COLUMN pending_user_requests.linked_organization_id IS 'ID of customer or partner this user is linked to';
COMMENT ON COLUMN pending_user_requests.organization_type IS 'Type of organization: customer or partner';

-- ============================================================
-- PART 3: CREATE HELPER FUNCTIONS
-- ============================================================

-- Function to check if user has access to a specific portal module
CREATE OR REPLACE FUNCTION has_portal_module_access(
  p_user_id UUID,
  p_portal_type VARCHAR(50),
  p_module_name VARCHAR(100)
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM portal_access
    WHERE user_id = p_user_id
      AND portal_type = p_portal_type
      AND is_active = true
      AND allowed_modules ? p_module_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all active portal accesses for a user
CREATE OR REPLACE FUNCTION get_user_portal_accesses(p_user_id UUID)
RETURNS TABLE (
  portal_type VARCHAR(50),
  allowed_modules JSONB,
  customer_id UUID,
  partner_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pa.portal_type,
    pa.allowed_modules,
    pa.customer_id,
    pa.partner_id
  FROM portal_access pa
  WHERE pa.user_id = p_user_id
    AND pa.is_active = true
  ORDER BY pa.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update last_accessed_at timestamp
CREATE OR REPLACE FUNCTION update_portal_access_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER trg_portal_access_updated_at
  BEFORE UPDATE ON portal_access
  FOR EACH ROW
  EXECUTE FUNCTION update_portal_access_timestamp();

-- ============================================================
-- PART 4: ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on portal_access table
ALTER TABLE portal_access ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own portal access
CREATE POLICY portal_access_select_own
  ON portal_access
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admins can view all portal access
CREATE POLICY portal_access_select_admin
  ON portal_access
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND user_type IN ('employee', 'admin')
    )
  );

-- Policy: Only admins can insert portal access
CREATE POLICY portal_access_insert_admin
  ON portal_access
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND user_type IN ('employee', 'admin')
    )
  );

-- Policy: Only admins can update portal access
CREATE POLICY portal_access_update_admin
  ON portal_access
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND user_type IN ('employee', 'admin')
    )
  );

-- Policy: Only admins can delete portal access
CREATE POLICY portal_access_delete_admin
  ON portal_access
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
        AND user_type IN ('employee', 'admin')
    )
  );

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
-- Run these to verify the migration was successful:
--
-- 1. Verify table was created:
-- SELECT table_name, table_type FROM information_schema.tables
-- WHERE table_name = 'portal_access';
--
-- 2. Verify indexes were created:
-- SELECT indexname, tablename FROM pg_indexes
-- WHERE tablename = 'portal_access';
--
-- 3. Verify new columns in pending_user_requests:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'pending_user_requests'
--   AND column_name IN ('approved_portal_type', 'approved_modules', 'linked_organization_id', 'organization_type');
--
-- 4. Verify RLS is enabled:
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables
-- WHERE tablename = 'portal_access';
--
-- 5. Test helper function:
-- SELECT * FROM get_user_portal_accesses('your-user-id-here');

-- ============================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================
-- DO NOT RUN THESE UNLESS YOU NEED TO ROLLBACK
--
-- DROP TABLE IF EXISTS portal_access CASCADE;
-- ALTER TABLE pending_user_requests DROP COLUMN IF EXISTS approved_portal_type;
-- ALTER TABLE pending_user_requests DROP COLUMN IF EXISTS approved_modules;
-- ALTER TABLE pending_user_requests DROP COLUMN IF EXISTS linked_organization_id;
-- ALTER TABLE pending_user_requests DROP COLUMN IF EXISTS organization_type;
-- DROP FUNCTION IF EXISTS has_portal_module_access(UUID, VARCHAR, VARCHAR);
-- DROP FUNCTION IF EXISTS get_user_portal_accesses(UUID);
-- DROP FUNCTION IF EXISTS update_portal_access_timestamp();

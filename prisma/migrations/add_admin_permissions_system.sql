-- Admin Portal Permissions System Migration
-- Date: 2025-01-05
-- Description: Enhance user_permissions table and create default_permissions system

-- ============================================
-- STEP 1: Enhance user_permissions table
-- ============================================

-- Add granular permission columns to user_permissions
ALTER TABLE user_permissions
  ADD COLUMN IF NOT EXISTS can_create BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_delete BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_approve BOOLEAN DEFAULT false;

-- Update updated_at trigger to include new columns
COMMENT ON COLUMN user_permissions.can_create IS 'Permission to create new records in this module';
COMMENT ON COLUMN user_permissions.can_delete IS 'Permission to delete records in this module';
COMMENT ON COLUMN user_permissions.can_approve IS 'Permission to approve/QC records in this module (Design, Production, Finance)';

-- ============================================
-- STEP 2: Create default_permissions table
-- ============================================

CREATE TABLE IF NOT EXISTS default_permissions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_type  user_type_enum NOT NULL,
  module     VARCHAR(50) NOT NULL,
  can_view   BOOLEAN DEFAULT false,
  can_create BOOLEAN DEFAULT false,
  can_edit   BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_approve BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_type, module)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_default_permissions_user_type ON default_permissions(user_type);

COMMENT ON TABLE default_permissions IS 'Default permission templates for each user type/role';

-- ============================================
-- STEP 3: Seed default permissions by user type
-- ============================================

-- Note: We're using INSERT...ON CONFLICT DO NOTHING to make this migration idempotent

-- ====================
-- 1. EMPLOYEE (Full Access to most modules)
-- ====================
INSERT INTO default_permissions (user_type, module, can_view, can_create, can_edit, can_delete, can_approve)
VALUES
  ('employee', 'dashboards', true, false, false, false, false),
  ('employee', 'tasks', true, true, true, true, false),
  ('employee', 'crm', true, true, true, true, false),
  ('employee', 'partners', true, true, true, true, false),
  ('employee', 'design', true, true, true, true, false),
  ('employee', 'products', true, true, true, true, false),
  ('employee', 'production', true, true, true, true, false),
  ('employee', 'shipping', true, true, true, true, false),
  ('employee', 'finance', true, true, true, true, false),
  ('employee', 'documents', true, true, true, true, false),
  ('employee', 'admin', false, false, false, false, false)
ON CONFLICT (user_type, module) DO NOTHING;

-- ====================
-- 2. CONTRACTOR (Limited Access)
-- ====================
INSERT INTO default_permissions (user_type, module, can_view, can_create, can_edit, can_delete, can_approve)
VALUES
  ('contractor', 'dashboards', true, false, false, false, false),
  ('contractor', 'tasks', true, false, true, false, false), -- Can only edit assigned tasks
  ('contractor', 'production', true, false, true, false, false), -- Can only edit assigned production
  ('contractor', 'design', true, false, false, false, false), -- View only
  ('contractor', 'documents', true, false, false, false, false), -- View only
  ('contractor', 'admin', false, false, false, false, false)
ON CONFLICT (user_type, module) DO NOTHING;

-- ====================
-- 3. DESIGNER (Design-Focused)
-- ====================
INSERT INTO default_permissions (user_type, module, can_view, can_create, can_edit, can_delete, can_approve)
VALUES
  ('designer', 'dashboards', true, false, false, false, false),
  ('designer', 'tasks', true, true, true, false, false),
  ('designer', 'crm', true, false, false, false, false), -- View only
  ('designer', 'design', true, true, true, true, true), -- Full design access + approve
  ('designer', 'products', true, true, true, false, false),
  ('designer', 'documents', true, true, true, false, false),
  ('designer', 'admin', false, false, false, false, false)
ON CONFLICT (user_type, module) DO NOTHING;

-- ====================
-- 4. MANUFACTURER (Production-Focused)
-- ====================
INSERT INTO default_permissions (user_type, module, can_view, can_create, can_edit, can_delete, can_approve)
VALUES
  ('manufacturer', 'dashboards', true, false, false, false, false),
  ('manufacturer', 'tasks', true, false, true, false, false), -- Can edit assigned tasks
  ('manufacturer', 'production', true, true, true, true, true), -- Full production + QC approval
  ('manufacturer', 'products', true, false, false, false, false), -- View only
  ('manufacturer', 'shipping', true, true, true, false, false),
  ('manufacturer', 'documents', true, false, false, false, false), -- View only
  ('manufacturer', 'admin', false, false, false, false, false)
ON CONFLICT (user_type, module) DO NOTHING;

-- ====================
-- 5. FINANCE (Finance-Focused)
-- ====================
INSERT INTO default_permissions (user_type, module, can_view, can_create, can_edit, can_delete, can_approve)
VALUES
  ('finance', 'dashboards', true, false, false, false, false),
  ('finance', 'crm', true, false, true, false, false), -- Can edit customer payment info
  ('finance', 'finance', true, true, true, true, true), -- Full finance access + approve
  ('finance', 'documents', true, true, true, false, false),
  ('finance', 'admin', false, false, false, false, false)
ON CONFLICT (user_type, module) DO NOTHING;

-- ====================
-- 6. SUPER ADMIN (Full Access to Everything)
-- ====================
INSERT INTO default_permissions (user_type, module, can_view, can_create, can_edit, can_delete, can_approve)
VALUES
  ('super_admin', 'dashboards', true, false, false, false, false),
  ('super_admin', 'tasks', true, true, true, true, true),
  ('super_admin', 'crm', true, true, true, true, true),
  ('super_admin', 'partners', true, true, true, true, true),
  ('super_admin', 'design', true, true, true, true, true),
  ('super_admin', 'products', true, true, true, true, true),
  ('super_admin', 'production', true, true, true, true, true),
  ('super_admin', 'shipping', true, true, true, true, true),
  ('super_admin', 'finance', true, true, true, true, true),
  ('super_admin', 'documents', true, true, true, true, true),
  ('super_admin', 'admin', true, true, true, true, true) -- Full admin portal access
ON CONFLICT (user_type, module) DO NOTHING;

-- ============================================
-- STEP 4: Create helper function for permission checks
-- ============================================

-- Function to get effective permissions (user override or default by type)
CREATE OR REPLACE FUNCTION get_effective_permissions(p_user_id UUID, p_module VARCHAR(50))
RETURNS TABLE (
  can_view BOOLEAN,
  can_create BOOLEAN,
  can_edit BOOLEAN,
  can_delete BOOLEAN,
  can_approve BOOLEAN
) AS $$
BEGIN
  -- First, try to get user-specific permission
  RETURN QUERY
  SELECT
    up.can_view,
    up.can_create,
    up.can_edit,
    up.can_delete,
    up.can_approve
  FROM user_permissions up
  WHERE up.user_id = p_user_id AND up.module = p_module;

  -- If no user-specific permission exists, fall back to default by user type
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT
      dp.can_view,
      dp.can_create,
      dp.can_edit,
      dp.can_delete,
      dp.can_approve
    FROM default_permissions dp
    JOIN user_profiles up ON up.user_type = dp.user_type
    WHERE up.id = p_user_id AND dp.module = p_module;
  END IF;

  -- If still not found, deny all permissions (fail-safe)
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, false, false, false, false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_effective_permissions IS 'Returns effective permissions for a user in a module (checks user override first, then defaults)';

-- ============================================
-- STEP 5: Update updated_at triggers
-- ============================================

-- Create or replace function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for default_permissions
DROP TRIGGER IF EXISTS update_default_permissions_updated_at ON default_permissions;
CREATE TRIGGER update_default_permissions_updated_at
    BEFORE UPDATE ON default_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Verification queries (commented out - run manually if needed):
-- SELECT user_type, COUNT(*) as module_count FROM default_permissions GROUP BY user_type;
-- SELECT * FROM default_permissions WHERE user_type = 'employee';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_permissions';

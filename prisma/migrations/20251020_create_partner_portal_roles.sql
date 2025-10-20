-- Migration: Create Partner Portal Roles System
-- Description: Defines available portal roles and their default module permissions for all partner types
-- Date: 2025-10-20

-- Create partner_portal_roles table
CREATE TABLE IF NOT EXISTS partner_portal_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_type VARCHAR(50) NOT NULL,
  role_key VARCHAR(50) NOT NULL,
  role_label VARCHAR(100) NOT NULL,
  description TEXT,
  default_modules TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_role_per_type UNIQUE(partner_type, role_key)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_portal_roles_partner_type ON partner_portal_roles(partner_type);
CREATE INDEX IF NOT EXISTS idx_portal_roles_key ON partner_portal_roles(role_key);
CREATE INDEX IF NOT EXISTS idx_portal_roles_system ON partner_portal_roles(is_system_role) WHERE is_system_role = true;

-- Add comments
COMMENT ON TABLE partner_portal_roles IS 'Defines portal roles and their permissions for partner employees';
COMMENT ON COLUMN partner_portal_roles.partner_type IS 'Partner type this role applies to: factory, sourcing, designer, or all';
COMMENT ON COLUMN partner_portal_roles.role_key IS 'Unique role identifier (e.g., qc_inspector, production_manager)';
COMMENT ON COLUMN partner_portal_roles.role_label IS 'Human-readable role name';
COMMENT ON COLUMN partner_portal_roles.default_modules IS 'Array of portal module keys this role can access by default';
COMMENT ON COLUMN partner_portal_roles.is_system_role IS 'System roles cannot be deleted by users';

-- Seed default portal roles

-- Universal roles (apply to all partner types)
INSERT INTO partner_portal_roles (partner_type, role_key, role_label, description, default_modules, is_system_role)
VALUES
  ('all', 'admin', 'Administrator', 'Full access to all portal modules and settings',
   ARRAY['dashboard', 'orders', 'production', 'qc', 'shipping', 'documents', 'settings'], true),

  ('all', 'viewer', 'Viewer', 'Read-only access to basic information',
   ARRAY['dashboard', 'orders', 'documents'], true)
ON CONFLICT (partner_type, role_key) DO NOTHING;

-- Factory-specific roles
INSERT INTO partner_portal_roles (partner_type, role_key, role_label, description, default_modules, is_system_role)
VALUES
  ('factory', 'production_manager', 'Production Manager', 'Manage production schedules and orders',
   ARRAY['dashboard', 'orders', 'production', 'documents'], true),

  ('factory', 'qc_inspector', 'QC Inspector', 'Perform quality control inspections',
   ARRAY['qc', 'documents'], true),

  ('factory', 'shipping_coordinator', 'Shipping Coordinator', 'Manage shipping and logistics',
   ARRAY['orders', 'shipping', 'documents'], true),

  ('factory', 'production_worker', 'Production Worker', 'View assigned production tasks',
   ARRAY['production', 'documents'], true)
ON CONFLICT (partner_type, role_key) DO NOTHING;

-- Sourcing-specific roles
INSERT INTO partner_portal_roles (partner_type, role_key, role_label, description, default_modules, is_system_role)
VALUES
  ('sourcing', 'qc_tester', 'QC Tester', 'Perform mobile QC inspections and submit reports',
   ARRAY['qc', 'inspections', 'history', 'documents'], true),

  ('sourcing', 'qc_supervisor', 'QC Supervisor', 'Oversee QC team and review inspection reports',
   ARRAY['dashboard', 'qc', 'inspections', 'history', 'documents', 'settings'], true)
ON CONFLICT (partner_type, role_key) DO NOTHING;

-- Designer-specific roles (for future use)
INSERT INTO partner_portal_roles (partner_type, role_key, role_label, description, default_modules, is_system_role)
VALUES
  ('designer', 'lead_designer', 'Lead Designer', 'Manage design projects and review submissions',
   ARRAY['dashboard', 'projects', 'documents', 'settings'], true),

  ('designer', 'designer', 'Designer', 'Work on assigned design projects',
   ARRAY['projects', 'documents'], true)
ON CONFLICT (partner_type, role_key) DO NOTHING;

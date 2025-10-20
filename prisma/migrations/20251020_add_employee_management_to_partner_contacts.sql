-- Migration: Add Employee Management Fields to partner_contacts
-- Description: Adds portal access, employment tracking, and role-based permissions to partner contacts
-- Date: 2025-10-20

-- Add employee management and portal access fields to partner_contacts
ALTER TABLE partner_contacts
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS portal_role VARCHAR(50) DEFAULT 'viewer',
  ADD COLUMN IF NOT EXISTS portal_access_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS portal_modules_allowed TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS department VARCHAR(100),
  ADD COLUMN IF NOT EXISTS employment_status VARCHAR(20) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS employment_start_date DATE,
  ADD COLUMN IF NOT EXISTS employment_end_date DATE,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS qc_specializations TEXT[],
  ADD COLUMN IF NOT EXISTS certifications TEXT[];

-- Create unique constraint for employee_id per partner (only when employee_id is not null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_contacts_employee_id
  ON partner_contacts(partner_id, employee_id)
  WHERE employee_id IS NOT NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_partner_contacts_user_id ON partner_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_contacts_portal_access ON partner_contacts(portal_access_enabled)
  WHERE portal_access_enabled = true;
CREATE INDEX IF NOT EXISTS idx_partner_contacts_employment_status ON partner_contacts(employment_status);
CREATE INDEX IF NOT EXISTS idx_partner_contacts_qc ON partner_contacts(is_qc)
  WHERE is_qc = true;

-- Add comments for documentation
COMMENT ON COLUMN partner_contacts.user_id IS 'Link to auth.users for portal login access';
COMMENT ON COLUMN partner_contacts.portal_role IS 'Portal role key (e.g., admin, qc_inspector, viewer)';
COMMENT ON COLUMN partner_contacts.portal_access_enabled IS 'Whether this employee has active portal access';
COMMENT ON COLUMN partner_contacts.portal_modules_allowed IS 'Array of allowed portal module keys (overrides role defaults)';
COMMENT ON COLUMN partner_contacts.employee_id IS 'Company-specific employee identifier';
COMMENT ON COLUMN partner_contacts.department IS 'Department or team (e.g., Production, QC, Shipping)';
COMMENT ON COLUMN partner_contacts.employment_status IS 'Employment status: active, inactive, on_leave, terminated';
COMMENT ON COLUMN partner_contacts.employment_start_date IS 'Date employee started';
COMMENT ON COLUMN partner_contacts.employment_end_date IS 'Date employee left (if applicable)';
COMMENT ON COLUMN partner_contacts.last_login_at IS 'Timestamp of last portal login';
COMMENT ON COLUMN partner_contacts.qc_specializations IS 'QC tester specializations (e.g., textiles, furniture, electronics)';
COMMENT ON COLUMN partner_contacts.certifications IS 'Professional certifications (e.g., ISO 9001, Six Sigma)';

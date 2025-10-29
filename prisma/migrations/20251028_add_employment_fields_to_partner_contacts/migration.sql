-- Add employment tracking fields to partner_contacts table
-- Migration: 20251028_add_employment_fields_to_partner_contacts

-- Add employment fields
ALTER TABLE partner_contacts
  ADD COLUMN IF NOT EXISTS employee_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS department VARCHAR(100),
  ADD COLUMN IF NOT EXISTS employment_status VARCHAR(50) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS employment_start_date TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS employment_end_date TIMESTAMPTZ(6);

-- Add indexes for filtering and performance
CREATE INDEX IF NOT EXISTS idx_partner_contacts_employment_status ON partner_contacts(employment_status);
CREATE INDEX IF NOT EXISTS idx_partner_contacts_department ON partner_contacts(department);
CREATE INDEX IF NOT EXISTS idx_partner_contacts_employee_id ON partner_contacts(employee_id);

-- Add comments for documentation
COMMENT ON COLUMN partner_contacts.employee_id IS 'Internal employee ID for partner employee tracking';
COMMENT ON COLUMN partner_contacts.department IS 'Department or division within partner organization';
COMMENT ON COLUMN partner_contacts.employment_status IS 'Employment status: active, inactive, terminated, suspended, on_leave';
COMMENT ON COLUMN partner_contacts.employment_start_date IS 'Date employee started with partner organization';
COMMENT ON COLUMN partner_contacts.employment_end_date IS 'Date employment ended (for terminated employees)';

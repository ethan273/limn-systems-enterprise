-- Migration: Add employment-related columns to partner_contacts table
-- Date: October 29, 2025
-- Purpose: Sync production schema with development schema

-- Add employment columns to partner_contacts table
ALTER TABLE partner_contacts
ADD COLUMN IF NOT EXISTS department VARCHAR(255),
ADD COLUMN IF NOT EXISTS employee_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS employment_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS employment_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS employment_status VARCHAR(50);

-- Add comments for documentation
COMMENT ON COLUMN partner_contacts.department IS 'Department or division within the organization';
COMMENT ON COLUMN partner_contacts.employee_id IS 'Employee identifier for tracking';
COMMENT ON COLUMN partner_contacts.employment_end_date IS 'Date employment ended (if applicable)';
COMMENT ON COLUMN partner_contacts.employment_start_date IS 'Date employment started';
COMMENT ON COLUMN partner_contacts.employment_status IS 'Employment status (active, inactive, terminated, etc.)';

-- Verify columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'partner_contacts'
AND column_name IN ('department', 'employee_id', 'employment_end_date', 'employment_start_date', 'employment_status')
ORDER BY column_name;

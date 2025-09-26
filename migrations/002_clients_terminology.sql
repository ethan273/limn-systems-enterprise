-- Migration: Update terminology and add missing fields
-- Date: September 24, 2025
-- Purpose: Align with "clients" terminology and add prospect tracking

-- Create clients view for backward compatibility
-- This allows us to use "clients" everywhere without breaking existing code
CREATE OR REPLACE VIEW clients AS 
SELECT 
  id,
  name,
  email,
  phone,
  company,
  address,
  type,
  status,
  billing_address,
  shipping_address,
  credit_limit,
  payment_terms,
  tax_id,
  notes,
  tags,
  portal_access_enabled,
  portal_password_hash,
  portal_last_login,
  created_at,
  updated_at,
  created_by,
  tenant_id,
  user_id,
  is_active,
  customer_code,
  contact_person,
  contact_title,
  industry,
  annual_revenue,
  employee_count,
  website,
  social_media,
  preferred_contact_method,
  preferred_language,
  timezone
FROM customers;

-- Add prospect_status to leads table for CRM pipeline tracking
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS prospect_status VARCHAR(50) 
CHECK (prospect_status IN ('cold', 'warm', 'hot'));

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_leads_prospect_status ON leads(prospect_status);

-- Add lead conversion tracking to contacts
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS lead_conversion_date TIMESTAMP WITH TIME ZONE;

-- Update any existing NULL values to sensible defaults
UPDATE leads 
SET prospect_status = 'warm' 
WHERE prospect_status IS NULL 
AND status IN ('contacted', 'qualified');

UPDATE leads 
SET prospect_status = 'hot' 
WHERE prospect_status IS NULL 
AND status IN ('proposal', 'negotiation');

UPDATE leads 
SET prospect_status = 'cold' 
WHERE prospect_status IS NULL;

-- Comments for documentation
COMMENT ON VIEW clients IS 'Unified view for client data - maps to customers table for compatibility';
COMMENT ON COLUMN leads.prospect_status IS 'Temperature of the lead: cold, warm, or hot';
COMMENT ON COLUMN contacts.lead_conversion_date IS 'Timestamp when contact was converted to a lead';

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON clients TO authenticated;
GRANT SELECT ON clients TO anon;

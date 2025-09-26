-- Add prospect_status to leads table for CRM pipeline enhancement
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS prospect_status VARCHAR(50) 
CHECK (prospect_status IN ('cold', 'warm', 'hot'));

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_leads_prospect_status ON leads(prospect_status);

-- Create view to map customers to clients terminology
DROP VIEW IF EXISTS clients CASCADE;
CREATE VIEW clients AS
SELECT 
  id,
  name,
  email,
  phone,
  company,
  company_name,
  type,
  status,
  address,
  city,
  state,
  zip,
  country,
  billing_address_line1,
  billing_address_line2,
  billing_city,
  billing_state,
  billing_zip,
  billing_country,
  shipping_same_as_billing,
  credit_limit,
  notes,
  tags,
  portal_access,
  portal_password,
  last_portal_login,
  portal_access_granted_at,
  portal_access_granted_by,
  portal_created_at,
  portal_created_by,
  last_password_reset,
  created_at,
  updated_at,
  created_by,
  user_id
FROM customers;

COMMENT ON VIEW clients IS 'Maps customers table to preferred "clients" terminology';

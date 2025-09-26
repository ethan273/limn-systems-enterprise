-- Add prospect_status to leads table ONLY
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS prospect_status VARCHAR(50) 
CHECK (prospect_status IN ('cold', 'warm', 'hot'));

-- Add conversion tracking to contacts
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS lead_conversion_date TIMESTAMP WITH TIME ZONE;

-- Create a VIEW for clients that maps to customers table
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
  notes,
  tags,
  created_by,
  created_at,
  updated_at,
  portal_access,
  portal_password,
  last_portal_login,
  portal_access_granted_at,
  portal_access_granted_by,
  user_id,
  company_name,
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
  portal_created_at,
  portal_created_by,
  last_password_reset
FROM customers;

COMMENT ON VIEW clients IS 'Maps to customers table for consistent "clients" terminology';

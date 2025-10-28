-- Migration: Add first_name and last_name fields to partner_contacts
-- Date: 2025-10-28
-- Purpose: Align partner_contacts with CRM contacts pattern (first_name + last_name instead of just name)

-- Add first_name and last_name columns
ALTER TABLE public.partner_contacts
ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);

-- Migrate existing 'name' data to first_name (split on first space)
-- This handles existing data by putting full name in first_name if last_name would be empty
UPDATE public.partner_contacts
SET
  first_name = CASE
    WHEN name IS NOT NULL AND position(' ' IN name) > 0
    THEN split_part(name, ' ', 1)
    ELSE name
  END,
  last_name = CASE
    WHEN name IS NOT NULL AND position(' ' IN name) > 0
    THEN substring(name FROM position(' ' IN name) + 1)
    ELSE NULL
  END
WHERE first_name IS NULL;

-- Add comment to explain the field usage
COMMENT ON COLUMN public.partner_contacts.first_name IS 'Contact first name - aligns with CRM contacts schema';
COMMENT ON COLUMN public.partner_contacts.last_name IS 'Contact last name - aligns with CRM contacts schema';
COMMENT ON COLUMN public.partner_contacts.name IS 'Full name - kept for backward compatibility, should be populated from first_name + last_name';

-- Migration: Add Portal Access Fields to Partner Contacts
-- Date: October 22, 2025
-- Phase: 1.2 - Portal Access Feature
-- Description: Add fields to enable partner portal access for contacts

-- Add portal access columns to partner_contacts
ALTER TABLE public.partner_contacts
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS portal_role VARCHAR(50),
  ADD COLUMN IF NOT EXISTS portal_access_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS portal_modules_allowed JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Add foreign key constraint to users table
ALTER TABLE public.partner_contacts
  ADD CONSTRAINT fk_partner_contacts_user
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE SET NULL;

-- Create indexes for portal access queries
CREATE INDEX IF NOT EXISTS idx_partner_contacts_user_id
  ON public.partner_contacts(user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_partner_contacts_portal_access
  ON public.partner_contacts(portal_access_enabled)
  WHERE portal_access_enabled = true;

CREATE INDEX IF NOT EXISTS idx_partner_contacts_portal_role
  ON public.partner_contacts(portal_role)
  WHERE portal_role IS NOT NULL;

-- Add column comments for documentation
COMMENT ON COLUMN public.partner_contacts.user_id IS 'Reference to auth.users for portal login';
COMMENT ON COLUMN public.partner_contacts.portal_role IS 'Portal role: viewer, editor, admin';
COMMENT ON COLUMN public.partner_contacts.portal_access_enabled IS 'Whether contact has active portal access';
COMMENT ON COLUMN public.partner_contacts.portal_modules_allowed IS 'JSON array of allowed module names';
COMMENT ON COLUMN public.partner_contacts.last_login_at IS 'Timestamp of last successful portal login';

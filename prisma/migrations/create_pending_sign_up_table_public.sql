-- Migration: Create pending_sign_up table in public schema
-- Date: 2025-10-18
-- Description: Creates pending_sign_up table for email verification workflow
--              NOTE: Created in public schema due to Supabase auth schema permissions

-- Create pending_sign_up table in public schema (not auth due to Supabase permissions)
CREATE TABLE IF NOT EXISTS public.pending_sign_up (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  verification_token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  user_type VARCHAR(50) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pending_sign_up_email ON public.pending_sign_up(email);
CREATE INDEX IF NOT EXISTS idx_pending_sign_up_token ON public.pending_sign_up(verification_token);
CREATE INDEX IF NOT EXISTS idx_pending_sign_up_expires_at ON public.pending_sign_up(expires_at);

-- Add Row Level Security (RLS)
ALTER TABLE public.pending_sign_up ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access
CREATE POLICY "Service role can manage pending signups"
ON public.pending_sign_up
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Allow anon to insert their own pending signup
CREATE POLICY "Users can create their own pending signup"
ON public.pending_sign_up
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE public.pending_sign_up IS 'Stores pending user signups awaiting email verification. NOTE: In public schema due to Supabase auth schema write restrictions.';
COMMENT ON COLUMN public.pending_sign_up.verification_token IS 'Unique token sent in verification email';
COMMENT ON COLUMN public.pending_sign_up.expires_at IS 'Token expiration timestamp (typically 24-48 hours)';
COMMENT ON COLUMN public.pending_sign_up.user_type IS 'Type of user account (customer, designer, factory, etc.)';
COMMENT ON COLUMN public.pending_sign_up.metadata IS 'Additional signup data (name, company, etc.)';

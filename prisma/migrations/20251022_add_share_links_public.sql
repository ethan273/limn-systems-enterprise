-- Migration: Add flipbook share links and tracking (PUBLIC SCHEMA)
-- Date: October 22, 2025
-- Phase: 9 - Unique Tracking Links
-- Description: Create tables for shareable flipbook links with view tracking
-- NOTE: Using public schema (not flipbook schema) to match Prisma expectations

-- Create flipbook_share_links table
CREATE TABLE IF NOT EXISTS public.flipbook_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flipbook_id UUID NOT NULL,
  created_by_id UUID NOT NULL,
  token VARCHAR(64) UNIQUE NOT NULL,
  vanity_slug VARCHAR(100) UNIQUE,
  label VARCHAR(255),
  view_count INTEGER NOT NULL DEFAULT 0,
  unique_view_count INTEGER NOT NULL DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  settings JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT fk_share_links_flipbook
    FOREIGN KEY (flipbook_id)
    REFERENCES public.flipbooks(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_share_links_creator
    FOREIGN KEY (created_by_id)
    REFERENCES public.user_profiles(id)
    ON DELETE NO ACTION
);

-- Create indexes for flipbook_share_links
CREATE INDEX IF NOT EXISTS idx_share_links_flipbook
  ON public.flipbook_share_links(flipbook_id);

CREATE INDEX IF NOT EXISTS idx_share_links_creator
  ON public.flipbook_share_links(created_by_id);

CREATE INDEX IF NOT EXISTS idx_share_links_token
  ON public.flipbook_share_links(token);

CREATE INDEX IF NOT EXISTS idx_share_links_vanity
  ON public.flipbook_share_links(vanity_slug)
  WHERE vanity_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_share_links_expiry
  ON public.flipbook_share_links(expires_at)
  WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_share_links_active
  ON public.flipbook_share_links(is_active)
  WHERE is_active = true;

-- Add comments
COMMENT ON TABLE public.flipbook_share_links IS 'Shareable links for flipbooks with tracking capabilities';
COMMENT ON COLUMN public.flipbook_share_links.token IS 'Unique random token for share URL (e.g., /s/{token})';
COMMENT ON COLUMN public.flipbook_share_links.vanity_slug IS 'Optional custom vanity URL slug';
COMMENT ON COLUMN public.flipbook_share_links.view_count IS 'Total number of views (includes repeat views)';
COMMENT ON COLUMN public.flipbook_share_links.unique_view_count IS 'Number of unique viewers (based on IP + user agent)';
COMMENT ON COLUMN public.flipbook_share_links.settings IS 'JSON settings for the share link (theme, page, controls, etc.)';

-- Migration: Add flipbook share links and tracking
-- Date: October 20, 2025
-- Phase: 9 - Unique Tracking Links
-- Description: Create tables for shareable flipbook links with view tracking

-- Create flipbook_share_links table
CREATE TABLE IF NOT EXISTS flipbook.flipbook_share_links (
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
    REFERENCES flipbook.flipbooks(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_share_links_creator
    FOREIGN KEY (created_by_id)
    REFERENCES public.user_profiles(id)
    ON DELETE NO ACTION
);

-- Create share_link_views table
CREATE TABLE IF NOT EXISTS flipbook.share_link_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_link_id UUID NOT NULL,
  viewer_ip VARCHAR(45),
  viewer_user_agent TEXT,
  viewer_country VARCHAR(2),
  viewer_city VARCHAR(100),
  referrer TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id UUID,

  -- Foreign key
  CONSTRAINT fk_share_views_link
    FOREIGN KEY (share_link_id)
    REFERENCES flipbook.flipbook_share_links(id)
    ON DELETE CASCADE
);

-- Create indexes for flipbook_share_links
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_share_links_flipbook
  ON flipbook.flipbook_share_links(flipbook_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_share_links_creator
  ON flipbook.flipbook_share_links(created_by_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_share_links_token
  ON flipbook.flipbook_share_links(token);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_share_links_vanity
  ON flipbook.flipbook_share_links(vanity_slug)
  WHERE vanity_slug IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_share_links_expiry
  ON flipbook.flipbook_share_links(expires_at)
  WHERE expires_at IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_share_links_active
  ON flipbook.flipbook_share_links(is_active)
  WHERE is_active = true;

-- Create indexes for share_link_views
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_share_views_link
  ON flipbook.share_link_views(share_link_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_share_views_timestamp
  ON flipbook.share_link_views(viewed_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_share_views_session
  ON flipbook.share_link_views(session_id)
  WHERE session_id IS NOT NULL;

-- Add comments
COMMENT ON TABLE flipbook.flipbook_share_links IS 'Shareable links for flipbooks with tracking capabilities';
COMMENT ON TABLE flipbook.share_link_views IS 'View tracking data for share links';

COMMENT ON COLUMN flipbook.flipbook_share_links.token IS 'Unique random token for share URL (e.g., /s/{token})';
COMMENT ON COLUMN flipbook.flipbook_share_links.vanity_slug IS 'Optional custom vanity URL slug';
COMMENT ON COLUMN flipbook.flipbook_share_links.view_count IS 'Total number of views (includes repeat views)';
COMMENT ON COLUMN flipbook.flipbook_share_links.unique_view_count IS 'Number of unique viewers (based on IP + user agent)';
COMMENT ON COLUMN flipbook.flipbook_share_links.settings IS 'JSON settings for the share link (theme, page, controls, etc.)';

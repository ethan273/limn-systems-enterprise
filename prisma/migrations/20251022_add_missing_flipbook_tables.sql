-- Migration: Add missing flipbook analytics and templates tables
-- Date: October 22, 2025
-- Description: Create tables that were in Prisma schema but missing from database
-- Tables: analytics_events, share_link_views, ai_generation_queue, templates

-- ============================================================================
-- 1. CREATE ENUMS
-- ============================================================================

-- Analytics event type enum
CREATE TYPE public.analytics_event_type AS ENUM (
  'VIEW',
  'PAGE_TURN',
  'HOTSPOT_CLICK',
  'SHARE',
  'DOWNLOAD',
  'ZOOM',
  'SEARCH'
);

-- AI generation status enum
CREATE TYPE public.ai_generation_status AS ENUM (
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED'
);

-- Template category enum
CREATE TYPE public.template_category AS ENUM (
  'PRODUCT_CATALOG',
  'LOOKBOOK',
  'BROCHURE',
  'MENU',
  'PORTFOLIO'
);

-- ============================================================================
-- 2. CREATE ANALYTICS_EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flipbook_id UUID NOT NULL,
  event_type public.analytics_event_type NOT NULL,
  user_id UUID,
  session_id UUID,
  page_number INTEGER,
  hotspot_id UUID,
  duration_seconds INTEGER,
  user_agent TEXT,
  ip_address VARCHAR(45),
  referrer TEXT,
  device_type VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT fk_analytics_events_flipbook
    FOREIGN KEY (flipbook_id)
    REFERENCES public.flipbooks(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_analytics_events_user
    FOREIGN KEY (user_id)
    REFERENCES public.user_profiles(id)
    ON DELETE NO ACTION
);

-- Indexes for analytics_events
CREATE INDEX IF NOT EXISTS idx_analytics_events_flipbook
  ON public.analytics_events(flipbook_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user
  ON public.analytics_events(user_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type
  ON public.analytics_events(event_type);

CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at
  ON public.analytics_events(created_at DESC);

COMMENT ON TABLE public.analytics_events IS 'Analytics event tracking for flipbooks';

-- ============================================================================
-- 3. CREATE SHARE_LINK_VIEWS TABLE (PUBLIC SCHEMA)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.share_link_views (
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
  CONSTRAINT fk_share_link_views_link
    FOREIGN KEY (share_link_id)
    REFERENCES public.flipbook_share_links(id)
    ON DELETE CASCADE
);

-- Indexes for share_link_views
CREATE INDEX IF NOT EXISTS idx_share_views_link
  ON public.share_link_views(share_link_id);

CREATE INDEX IF NOT EXISTS idx_share_views_timestamp
  ON public.share_link_views(viewed_at);

CREATE INDEX IF NOT EXISTS idx_share_views_session
  ON public.share_link_views(session_id)
  WHERE session_id IS NOT NULL;

COMMENT ON TABLE public.share_link_views IS 'View tracking for share links';

-- ============================================================================
-- 4. CREATE AI_GENERATION_QUEUE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  prompt TEXT NOT NULL,
  status public.ai_generation_status NOT NULL DEFAULT 'PENDING',
  flipbook_id UUID,
  generation_config JSONB NOT NULL,
  source_data JSONB,
  result_data JSONB,
  error_message TEXT,
  progress_percent INTEGER NOT NULL DEFAULT 0,
  estimated_completion TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Foreign key
  CONSTRAINT fk_ai_generation_queue_user
    FOREIGN KEY (user_id)
    REFERENCES public.user_profiles(id)
    ON DELETE NO ACTION
);

-- Indexes for ai_generation_queue
CREATE INDEX IF NOT EXISTS idx_ai_generation_queue_user
  ON public.ai_generation_queue(user_id);

CREATE INDEX IF NOT EXISTS idx_ai_generation_queue_status
  ON public.ai_generation_queue(status);

CREATE INDEX IF NOT EXISTS idx_ai_generation_queue_created_at
  ON public.ai_generation_queue(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_generation_queue_updated_at
  ON public.ai_generation_queue(updated_at);

COMMENT ON TABLE public.ai_generation_queue IS 'Queue for AI-generated flipbook content';

-- ============================================================================
-- 5. CREATE TEMPLATES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category public.template_category NOT NULL,
  thumbnail_url TEXT,
  template_config JSONB NOT NULL,
  page_layouts JSONB NOT NULL,
  brand_config JSONB,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_by_id UUID,
  use_count INTEGER NOT NULL DEFAULT 0,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Foreign key
  CONSTRAINT fk_templates_creator
    FOREIGN KEY (created_by_id)
    REFERENCES public.user_profiles(id)
    ON DELETE NO ACTION
);

-- Indexes for templates
CREATE INDEX IF NOT EXISTS idx_templates_category
  ON public.templates(category);

CREATE INDEX IF NOT EXISTS idx_templates_creator
  ON public.templates(created_by_id);

CREATE INDEX IF NOT EXISTS idx_templates_public
  ON public.templates(is_public);

COMMENT ON TABLE public.templates IS 'Flipbook templates for AI generation and user selection';

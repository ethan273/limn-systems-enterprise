-- Flipbook TOC & Thumbnails Enhancement
-- Phase 1: Table of Contents and Thumbnail Navigation
-- Migration created: 2025-01-13

-- ============================================================================
-- 0. ENSURE FLIPBOOK SCHEMA EXISTS
-- ============================================================================

-- Create flipbook schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS flipbook;

-- ============================================================================
-- 1. TOC SYSTEM: Add TOC data to flipbooks table
-- ============================================================================

-- Add TOC metadata columns to flipbooks table (if table exists)
ALTER TABLE IF EXISTS flipbook.flipbooks
ADD COLUMN toc_data JSONB,
ADD COLUMN toc_auto_generated BOOLEAN DEFAULT false,
ADD COLUMN toc_last_updated TIMESTAMPTZ;

-- Create index for TOC queries (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'flipbook' AND table_name = 'flipbooks') THEN
    CREATE INDEX IF NOT EXISTS idx_flipbooks_toc ON flipbook.flipbooks USING GIN (toc_data) WHERE toc_data IS NOT NULL;
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN flipbook.flipbooks.toc_data IS 'Hierarchical table of contents structure in JSON format';
COMMENT ON COLUMN flipbook.flipbooks.toc_auto_generated IS 'Whether TOC was auto-generated from PDF bookmarks';
COMMENT ON COLUMN flipbook.flipbooks.toc_last_updated IS 'Last time TOC was modified';

-- ============================================================================
-- 2. THUMBNAIL SYSTEM: Add thumbnail URLs to pages
-- ============================================================================

-- Add thumbnail columns to flipbook_pages table (if table exists)
ALTER TABLE IF EXISTS flipbook.flipbook_pages
ADD COLUMN thumbnail_url VARCHAR(500),
ADD COLUMN thumbnail_small_url VARCHAR(500),
ADD COLUMN thumbnail_generated_at TIMESTAMPTZ;

-- Create index for thumbnail queries (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'flipbook' AND table_name = 'flipbook_pages') THEN
    CREATE INDEX IF NOT EXISTS idx_flipbook_pages_thumbnail ON flipbook.flipbook_pages (thumbnail_url) WHERE thumbnail_url IS NOT NULL;
  END IF;
END $$;

-- Add comments
COMMENT ON COLUMN flipbook.flipbook_pages.thumbnail_url IS 'Standard thumbnail (200x280) for navigation';
COMMENT ON COLUMN flipbook.flipbook_pages.thumbnail_small_url IS 'Small thumbnail (100x140) for grid view';
COMMENT ON COLUMN flipbook.flipbook_pages.thumbnail_generated_at IS 'Timestamp when thumbnails were generated';

-- ============================================================================
-- 3. TOC SETTINGS: Add display preferences
-- ============================================================================

-- Add TOC and thumbnail display settings to flipbooks (if table exists)
ALTER TABLE IF EXISTS flipbook.flipbooks
ADD COLUMN navigation_settings JSONB DEFAULT '{"toc": {"enabled": true, "position": "left", "defaultExpanded": false}, "thumbnails": {"enabled": true, "position": "bottom", "size": "medium"}}'::jsonb;

-- Create index for settings queries (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'flipbook' AND table_name = 'flipbooks') THEN
    CREATE INDEX IF NOT EXISTS idx_flipbooks_nav_settings ON flipbook.flipbooks USING GIN (navigation_settings);
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN flipbook.flipbooks.navigation_settings IS 'Navigation UI preferences (TOC, thumbnails)';

-- ============================================================================
-- 4. VALIDATION FUNCTIONS
-- ============================================================================

-- Function to validate TOC structure
CREATE OR REPLACE FUNCTION flipbook.validate_toc_structure()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate that toc_data has required structure if present
  IF NEW.toc_data IS NOT NULL THEN
    -- Check for required 'items' array
    IF NOT (NEW.toc_data ? 'items' AND jsonb_typeof(NEW.toc_data->'items') = 'array') THEN
      RAISE EXCEPTION 'toc_data must contain an "items" array';
    END IF;

    -- Update toc_last_updated timestamp
    NEW.toc_last_updated := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for TOC validation
CREATE TRIGGER validate_toc_before_update
  BEFORE INSERT OR UPDATE OF toc_data ON flipbook.flipbooks
  FOR EACH ROW
  EXECUTE FUNCTION flipbook.validate_toc_structure();

-- ============================================================================
-- 5. HELPER FUNCTIONS FOR TOC OPERATIONS
-- ============================================================================

-- Function to get TOC item count
CREATE OR REPLACE FUNCTION flipbook.get_toc_item_count(flipbook_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  item_count INTEGER;
BEGIN
  SELECT
    COALESCE(jsonb_array_length(toc_data->'items'), 0)
  INTO item_count
  FROM flipbook.flipbooks
  WHERE id = flipbook_id_param;

  RETURN COALESCE(item_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to check if page has thumbnail
CREATE OR REPLACE FUNCTION flipbook.has_thumbnail(page_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_thumb BOOLEAN;
BEGIN
  SELECT
    (thumbnail_url IS NOT NULL)
  INTO has_thumb
  FROM flipbook.flipbook_pages
  WHERE id = page_id_param;

  RETURN COALESCE(has_thumb, false);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. MIGRATION DATA
-- ============================================================================

-- Update existing flipbooks with default navigation settings (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'flipbook' AND table_name = 'flipbooks') THEN
    UPDATE flipbook.flipbooks
    SET navigation_settings = '{"toc": {"enabled": false, "position": "left", "defaultExpanded": false}, "thumbnails": {"enabled": false, "position": "bottom", "size": "medium"}}'::jsonb
    WHERE navigation_settings IS NULL;
  END IF;
END $$;

-- Add comment explaining default behavior
COMMENT ON TABLE flipbook.flipbooks IS 'Main flipbook metadata. TOC and thumbnails disabled by default for existing flipbooks to maintain backward compatibility.';

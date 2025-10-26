-- Add width and height columns to flipbook_pages table
-- These store the original PDF page dimensions for aspect ratio preservation

ALTER TABLE public.flipbook_pages
ADD COLUMN IF NOT EXISTS width INTEGER,
ADD COLUMN IF NOT EXISTS height INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN public.flipbook_pages.width IS 'Original page width in pixels (from PDF viewport)';
COMMENT ON COLUMN public.flipbook_pages.height IS 'Original page height in pixels (from PDF viewport)';

-- Create index for querying by aspect ratio (future feature: filter by portrait/landscape)
CREATE INDEX IF NOT EXISTS idx_flipbook_pages_aspect_ratio
ON public.flipbook_pages (width, height)
WHERE width IS NOT NULL AND height IS NOT NULL;

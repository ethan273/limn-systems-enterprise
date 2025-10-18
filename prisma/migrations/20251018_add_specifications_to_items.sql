-- Add specifications column to items table
-- This aligns items with concepts, order_items, and prototypes which already have specifications

ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS specifications JSONB;

COMMENT ON COLUMN public.items.specifications IS 'Product specifications stored as JSON (materials, finishes, construction details, etc.)';


-- QC & Factory Review PWA Enhancement - Migration 8 of 10
-- Add item_metadata JSONB column for conditional logic

ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS item_metadata JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_items_metadata_gin
  ON public.items USING GIN (item_metadata);

-- Example metadata: {"hasUpholstery": true, "finishType": "wood", "hasMetalComponents": false}

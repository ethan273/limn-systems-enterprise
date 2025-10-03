-- Add full_sku column to order_items table
-- Created: October 2, 2025
-- Purpose: Store complete Full SKU (base_sku + material components) for order items

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS full_sku VARCHAR(200);

-- Add comment for documentation
COMMENT ON COLUMN order_items.full_sku IS 'Full SKU combining base_sku with material selections (e.g., CC-CHA-001-FAB-NAV-WOD-OAK)';

-- Create index for performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_order_items_full_sku ON order_items(full_sku);

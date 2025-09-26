-- Migration: Create order_items table for linking orders with items and materials
-- This enables proper SKU generation and order line item management

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id),
  material_id UUID REFERENCES materials(id),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_price DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  sku_generated VARCHAR(255),
  customizations JSONB,
  notes TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_item_id ON order_items(item_id);
CREATE INDEX idx_order_items_material_id ON order_items(material_id);
CREATE INDEX idx_order_items_sku ON order_items(sku_generated);

-- Add prospect_status to leads table for the CRM pipeline
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS prospect_status VARCHAR(50) CHECK (prospect_status IN ('cold', 'warm', 'hot'));

-- Add lead_conversion_date to contacts for tracking
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS lead_conversion_date TIMESTAMP WITH TIME ZONE;

COMMENT ON TABLE order_items IS 'Links orders to items with material selections and custom SKU generation';
COMMENT ON COLUMN order_items.sku_generated IS 'Format: CollectionPrefix-ItemSKU-MaterialCode-ProjectID';
COMMENT ON COLUMN order_items.customizations IS 'JSON object storing any custom specifications for this order item';

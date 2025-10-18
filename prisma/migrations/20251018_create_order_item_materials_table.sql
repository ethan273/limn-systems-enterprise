-- Migration: Create order_item_materials junction table
-- Date: 2025-10-18
-- Purpose: Link order items to materials for production tracking
-- Impact: Enables tracking which materials are used in each order item

-- Create order_item_materials table
CREATE TABLE IF NOT EXISTS public.order_item_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id UUID NOT NULL,
  material_id UUID NOT NULL,
  quantity DECIMAL(10, 2) DEFAULT 1,
  material_type VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255),

  -- Foreign key constraints
  CONSTRAINT fk_order_item_materials_order_item
    FOREIGN KEY (order_item_id)
    REFERENCES public.order_items(id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,

  CONSTRAINT fk_order_item_materials_material
    FOREIGN KEY (material_id)
    REFERENCES public.materials(id)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_item_materials_order_item_id
  ON public.order_item_materials(order_item_id);

CREATE INDEX IF NOT EXISTS idx_order_item_materials_material_id
  ON public.order_item_materials(material_id);

CREATE INDEX IF NOT EXISTS idx_order_item_materials_material_type
  ON public.order_item_materials(material_type);

CREATE INDEX IF NOT EXISTS idx_order_item_materials_created_at
  ON public.order_item_materials(created_at);

-- Prevent duplicate material assignments to same order item
CREATE UNIQUE INDEX IF NOT EXISTS idx_order_item_materials_unique
  ON public.order_item_materials(order_item_id, material_id);

-- Add column comments for documentation
COMMENT ON TABLE public.order_item_materials IS 'Junction table linking order items to materials for production tracking';
COMMENT ON COLUMN public.order_item_materials.order_item_id IS 'Foreign key to order_items table';
COMMENT ON COLUMN public.order_item_materials.material_id IS 'Foreign key to materials table';
COMMENT ON COLUMN public.order_item_materials.quantity IS 'Quantity of material needed for this order item';
COMMENT ON COLUMN public.order_item_materials.material_type IS 'Type of material (wood, fabric, finish, hardware, etc.)';
COMMENT ON COLUMN public.order_item_materials.notes IS 'Additional notes about material usage';

-- Enable Row Level Security (RLS) for Supabase
ALTER TABLE public.order_item_materials ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Service role can manage order item materials"
  ON public.order_item_materials
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view order item materials"
  ON public.order_item_materials
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert order item materials"
  ON public.order_item_materials
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update order item materials"
  ON public.order_item_materials
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete order item materials"
  ON public.order_item_materials
  FOR DELETE
  TO authenticated
  USING (true);

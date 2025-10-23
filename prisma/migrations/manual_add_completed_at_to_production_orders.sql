-- Manual migration: Add completed_at column to production_orders table
-- Date: October 23, 2025
-- Purpose: Fix analytics queries that reference completed_at column

-- Add completed_at column to production_orders
ALTER TABLE public.production_orders
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ(6);

-- Add comment explaining the column
COMMENT ON COLUMN public.production_orders.completed_at IS 'Timestamp when the production order was completed. Used for analytics and efficiency tracking.';

-- Optional: Create index for better query performance on analytics queries
CREATE INDEX IF NOT EXISTS idx_production_orders_completed_at ON public.production_orders(completed_at);

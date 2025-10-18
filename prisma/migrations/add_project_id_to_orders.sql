-- Migration: Add project_id to orders table
-- Date: 2025-10-18
-- Description: Adds project_id column and relation to projects table to enable
--              project-order associations, revenue calculations, and order tracking.

-- Add project_id column to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS project_id UUID;

-- Add foreign key constraint
ALTER TABLE orders
ADD CONSTRAINT orders_project_id_fkey
FOREIGN KEY (project_id)
REFERENCES projects(id)
ON DELETE SET NULL
ON UPDATE NO ACTION;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_orders_project_id ON orders(project_id);

-- Add comment for documentation
COMMENT ON COLUMN orders.project_id IS 'Foreign key to projects table - nullable to allow orders without projects';

-- Migration: Add project_id to orders table
-- Date: 2025-10-18
-- Purpose: Link orders to projects for revenue tracking and analytics
-- Impact: Allows projects to track associated orders and calculate revenue

-- Add project_id column to orders table
ALTER TABLE orders
ADD COLUMN project_id UUID;

-- Add foreign key constraint to projects table
-- ON DELETE SET NULL allows orders to exist without projects
ALTER TABLE orders
ADD CONSTRAINT fk_orders_project
  FOREIGN KEY (project_id)
  REFERENCES projects(id)
  ON DELETE SET NULL;

-- Add index for performance on project_id queries
CREATE INDEX idx_orders_project_id ON orders(project_id);

-- Add column comment for documentation
COMMENT ON COLUMN orders.project_id IS 'Links order to a project for revenue tracking and project analytics';

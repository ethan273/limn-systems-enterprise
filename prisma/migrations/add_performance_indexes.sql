-- ==========================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- ==========================================
-- Created: October 2025
-- Purpose: Add indexes for frequently queried fields
-- Impact: Improves query performance on large datasets
-- ==========================================

-- Production Orders Indexes
-- --------------------------
-- Frequently filtered by status
CREATE INDEX IF NOT EXISTS idx_production_orders_status
ON production_orders(status);

-- Frequently queried by customer (via projects relationship)
CREATE INDEX IF NOT EXISTS idx_production_orders_project_id
ON production_orders(project_id);

-- Composite index for customer + status queries
CREATE INDEX IF NOT EXISTS idx_production_orders_project_status
ON production_orders(project_id, status);

-- Created date for sorting/filtering
CREATE INDEX IF NOT EXISTS idx_production_orders_created_at
ON production_orders(created_at DESC);


-- Tasks Indexes
-- --------------------------
-- Frequently filtered by assigned user
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_user_id
ON tasks(assigned_user_id);

-- Frequently filtered by status
CREATE INDEX IF NOT EXISTS idx_tasks_status
ON tasks(status);

-- Composite index for user + status queries (most common)
CREATE INDEX IF NOT EXISTS idx_tasks_user_status
ON tasks(assigned_user_id, status);

-- Priority filtering
CREATE INDEX IF NOT EXISTS idx_tasks_priority
ON tasks(priority);

-- Due date sorting
CREATE INDEX IF NOT EXISTS idx_tasks_due_date
ON tasks(due_date);


-- Projects Indexes
-- --------------------------
-- Customer relationship (frequently joined)
CREATE INDEX IF NOT EXISTS idx_projects_customer_id
ON projects(customer_id);

-- Status filtering
CREATE INDEX IF NOT EXISTS idx_projects_status
ON projects(status);

-- Composite for customer + status
CREATE INDEX IF NOT EXISTS idx_projects_customer_status
ON projects(customer_id, status);


-- Shipments Indexes
-- --------------------------
-- Tracking number lookups (exact match queries)
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number
ON shipments(tracking_number);

-- Project relationship
CREATE INDEX IF NOT EXISTS idx_shipments_project_id
ON shipments(project_id);

-- Status filtering
CREATE INDEX IF NOT EXISTS idx_shipments_status
ON shipments(status);


-- Documents Indexes
-- --------------------------
-- Customer filtering (portal queries)
CREATE INDEX IF NOT EXISTS idx_documents_customer_id
ON documents(customer_id);

-- Project relationship
CREATE INDEX IF NOT EXISTS idx_documents_project_id
ON documents(project_id);

-- Type filtering
CREATE INDEX IF NOT EXISTS idx_documents_type
ON documents(type);

-- Category filtering
CREATE INDEX IF NOT EXISTS idx_documents_category
ON documents(category);


-- Shop Drawings Indexes
-- --------------------------
-- Status filtering
CREATE INDEX IF NOT EXISTS idx_shop_drawings_status
ON shop_drawings(status);

-- Production order relationship
CREATE INDEX IF NOT EXISTS idx_shop_drawings_production_order_id
ON shop_drawings(production_order_id);


-- QC Inspections Indexes
-- --------------------------
-- Status filtering
CREATE INDEX IF NOT EXISTS idx_qc_inspections_status
ON qc_inspections(status);

-- Production order relationship
CREATE INDEX IF NOT EXISTS idx_qc_inspections_production_order_id
ON qc_inspections(production_order_id);


-- Production Invoices Indexes
-- --------------------------
-- Order relationship
CREATE INDEX IF NOT EXISTS idx_production_invoices_production_order_id
ON production_invoices(production_order_id);

-- Status filtering
CREATE INDEX IF NOT EXISTS idx_production_invoices_status
ON production_invoices(status);

-- Type filtering (deposit vs final)
CREATE INDEX IF NOT EXISTS idx_production_invoices_invoice_type
ON production_invoices(invoice_type);


-- Full-Text Search Indexes (if supported by PostgreSQL)
-- --------------------------
-- Enable pg_trgm extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Order number search
CREATE INDEX IF NOT EXISTS idx_production_orders_order_number_trgm
ON production_orders USING gin(order_number gin_trgm_ops);

-- Item name search
CREATE INDEX IF NOT EXISTS idx_production_orders_item_name_trgm
ON production_orders USING gin(item_name gin_trgm_ops);

-- Project name search
CREATE INDEX IF NOT EXISTS idx_projects_name_trgm
ON projects USING gin(name gin_trgm_ops);

-- ==========================================
-- VERIFY INDEXES CREATED
-- ==========================================
-- Run this query to verify all indexes exist:
--
-- SELECT
--   schemaname,
--   tablename,
--   indexname
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- ORDER BY tablename, indexname;
-- ==========================================

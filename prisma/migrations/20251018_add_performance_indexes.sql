-- Performance Optimization: Add indexes to critical business tables
-- Phase 1 of 6-phase performance optimization plan
-- Created: October 18, 2025
-- IMPORTANT: Uses CREATE INDEX CONCURRENTLY to avoid table locks

-- =============================================================================
-- CUSTOMERS TABLE INDEXES
-- =============================================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_customers_company_name" ON "public"."customers" ("company_name");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_customers_status" ON "public"."customers" ("status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_customers_created_at_desc" ON "public"."customers" ("created_at" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_customers_status_created" ON "public"."customers" ("status", "created_at" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_customers_company_status" ON "public"."customers" ("company_name", "status");

-- =============================================================================
-- INVOICES TABLE INDEXES
-- =============================================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_invoices_created_at_desc" ON "public"."invoices" ("created_at" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_invoices_status_created" ON "public"."invoices" ("status", "created_at" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_invoices_customer_status" ON "public"."invoices" ("customer_id", "status");

-- =============================================================================
-- ORDERS TABLE INDEXES
-- =============================================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_orders_customer_id" ON "public"."orders" ("customer_id");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_orders_status" ON "public"."orders" ("status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_orders_due_date" ON "public"."orders" ("due_date");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_orders_assigned_to" ON "public"."orders" ("assigned_to");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_orders_status_created" ON "public"."orders" ("status", "created_at" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_orders_assigned_status" ON "public"."orders" ("assigned_to", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_orders_customer_status" ON "public"."orders" ("customer_id", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_orders_rush_status" ON "public"."orders" ("rush_order", "status");

-- =============================================================================
-- PRODUCTS TABLE INDEXES
-- =============================================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_products_name" ON "public"."products" ("name");

-- =============================================================================
-- TASKS TABLE INDEXES
-- =============================================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_tasks_status" ON "public"."tasks" ("status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_tasks_due_date" ON "public"."tasks" ("due_date");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_tasks_department" ON "public"."tasks" ("department");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_tasks_status_priority" ON "public"."tasks" ("status", "priority");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_tasks_status_due_date" ON "public"."tasks" ("status", "due_date");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_tasks_project_status" ON "public"."tasks" ("project_id", "status");

-- =============================================================================
-- USER_PROFILES TABLE INDEXES
-- =============================================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_profiles_department" ON "public"."user_profiles" ("department");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_profiles_created_at_desc" ON "public"."user_profiles" ("created_at" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_profiles_type_active" ON "public"."user_profiles" ("user_type", "is_active");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_profiles_dept_active" ON "public"."user_profiles" ("department", "is_active");

-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================
-- Run this to verify all indexes were created:
-- SELECT schemaname, tablename, indexname
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- AND tablename IN ('customers', 'invoices', 'orders', 'products', 'tasks', 'user_profiles')
-- ORDER BY tablename, indexname;

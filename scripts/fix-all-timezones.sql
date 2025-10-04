-- =====================================================
-- COMPREHENSIVE TIMEZONE FIX FOR ALL TIMESTAMP COLUMNS
-- =====================================================
-- This script fixes invalid GMT timezone formats across
-- ALL tables in the database by converting them to UTC
-- =====================================================

-- Fix for commonly used tables in Analytics Dashboard
-- (orders, customers, projects, tasks, production_orders, shipments)

-- ORDERS table
UPDATE orders SET created_at = created_at AT TIME ZONE 'UTC' WHERE created_at IS NOT NULL;
UPDATE orders SET updated_at = updated_at AT TIME ZONE 'UTC' WHERE updated_at IS NOT NULL;
UPDATE orders SET due_date = due_date AT TIME ZONE 'UTC' WHERE due_date IS NOT NULL;
UPDATE orders SET estimated_completion = estimated_completion AT TIME ZONE 'UTC' WHERE estimated_completion IS NOT NULL;
UPDATE orders SET actual_completion = actual_completion AT TIME ZONE 'UTC' WHERE actual_completion IS NOT NULL;

-- CUSTOMERS table
UPDATE customers SET created_at = created_at AT TIME ZONE 'UTC' WHERE created_at IS NOT NULL;
UPDATE customers SET updated_at = updated_at AT TIME ZONE 'UTC' WHERE updated_at IS NOT NULL;
UPDATE customers SET last_activity_date = last_activity_date AT TIME ZONE 'UTC' WHERE last_activity_date IS NOT NULL;
UPDATE customers SET last_password_reset = last_password_reset AT TIME ZONE 'UTC' WHERE last_password_reset IS NOT NULL;
UPDATE customers SET last_portal_login = last_portal_login AT TIME ZONE 'UTC' WHERE last_portal_login IS NOT NULL;
UPDATE customers SET portal_access_granted_at = portal_access_granted_at AT TIME ZONE 'UTC' WHERE portal_access_granted_at IS NOT NULL;
UPDATE customers SET portal_created_at = portal_created_at AT TIME ZONE 'UTC' WHERE portal_created_at IS NOT NULL;

-- PROJECTS table
UPDATE projects SET created_at = created_at AT TIME ZONE 'UTC' WHERE created_at IS NOT NULL;
UPDATE projects SET updated_at = updated_at AT TIME ZONE 'UTC' WHERE updated_at IS NOT NULL;
UPDATE projects SET start_date = start_date AT TIME ZONE 'UTC' WHERE start_date IS NOT NULL;
UPDATE projects SET end_date = end_date AT TIME ZONE 'UTC' WHERE end_date IS NOT NULL;
UPDATE projects SET completed_at = completed_at AT TIME ZONE 'UTC' WHERE completed_at IS NOT NULL;
UPDATE projects SET approved_at = approved_at AT TIME ZONE 'UTC' WHERE approved_at IS NOT NULL;

-- TASKS table
UPDATE tasks SET created_at = created_at AT TIME ZONE 'UTC' WHERE created_at IS NOT NULL;
UPDATE tasks SET updated_at = updated_at AT TIME ZONE 'UTC' WHERE updated_at IS NOT NULL;
UPDATE tasks SET due_date = due_date AT TIME ZONE 'UTC' WHERE due_date IS NOT NULL;
UPDATE tasks SET completed_at = completed_at AT TIME ZONE 'UTC' WHERE completed_at IS NOT NULL;
UPDATE tasks SET start_date = start_date AT TIME ZONE 'UTC' WHERE start_date IS NOT NULL;

-- ORDER_ITEMS table
UPDATE order_items SET created_at = created_at AT TIME ZONE 'UTC' WHERE created_at IS NOT NULL;
UPDATE order_items SET updated_at = updated_at AT TIME ZONE 'UTC' WHERE updated_at IS NOT NULL;
UPDATE order_items SET due_date = due_date AT TIME ZONE 'UTC' WHERE due_date IS NOT NULL;

-- PRODUCTION_ORDERS table
UPDATE production_orders SET created_at = created_at AT TIME ZONE 'UTC' WHERE created_at IS NOT NULL;
UPDATE production_orders SET updated_at = updated_at AT TIME ZONE 'UTC' WHERE updated_at IS NOT NULL;
UPDATE production_orders SET start_date = start_date AT TIME ZONE 'UTC' WHERE start_date IS NOT NULL;
UPDATE production_orders SET target_completion = target_completion AT TIME ZONE 'UTC' WHERE target_completion IS NOT NULL;
UPDATE production_orders SET actual_completion = actual_completion AT TIME ZONE 'UTC' WHERE actual_completion IS NOT NULL;

-- SHIPMENTS table
UPDATE shipments SET created_at = created_at AT TIME ZONE 'UTC' WHERE created_at IS NOT NULL;
UPDATE shipments SET updated_at = updated_at AT TIME ZONE 'UTC' WHERE updated_at IS NOT NULL;
UPDATE shipments SET shipped_date = shipped_date AT TIME ZONE 'UTC' WHERE shipped_date IS NOT NULL;
UPDATE shipments SET expected_delivery = expected_delivery AT TIME ZONE 'UTC' WHERE expected_delivery IS NOT NULL;
UPDATE shipments SET actual_delivery = actual_delivery AT TIME ZONE 'UTC' WHERE actual_delivery IS NOT NULL;
UPDATE shipments SET pickup_date = pickup_date AT TIME ZONE 'UTC' WHERE pickup_date IS NOT NULL;

-- Additional commonly referenced tables
-- CONTACTS table
UPDATE contacts SET created_at = created_at AT TIME ZONE 'UTC' WHERE created_at IS NOT NULL;
UPDATE contacts SET updated_at = updated_at AT TIME ZONE 'UTC' WHERE updated_at IS NOT NULL;
UPDATE contacts SET last_activity_date = last_activity_date AT TIME ZONE 'UTC' WHERE last_activity_date IS NOT NULL;
UPDATE contacts SET last_contacted = last_contacted AT TIME ZONE 'UTC' WHERE last_contacted IS NOT NULL;

-- LEADS table
UPDATE leads SET created_at = created_at AT TIME ZONE 'UTC' WHERE created_at IS NOT NULL;
UPDATE leads SET updated_at = updated_at AT TIME ZONE 'UTC' WHERE updated_at IS NOT NULL;
UPDATE leads SET last_activity_date = last_activity_date AT TIME ZONE 'UTC' WHERE last_activity_date IS NOT NULL;
UPDATE leads SET last_contacted = last_contacted AT TIME ZONE 'UTC' WHERE last_contacted IS NOT NULL;
UPDATE leads SET follow_up_date = follow_up_date AT TIME ZONE 'UTC' WHERE follow_up_date IS NOT NULL;
UPDATE leads SET converted_at = converted_at AT TIME ZONE 'UTC' WHERE converted_at IS NOT NULL;

-- PROSPECTS table
UPDATE prospects SET created_at = created_at AT TIME ZONE 'UTC' WHERE created_at IS NOT NULL;
UPDATE prospects SET updated_at = updated_at AT TIME ZONE 'UTC' WHERE updated_at IS NOT NULL;
UPDATE prospects SET last_activity_date = last_activity_date AT TIME ZONE 'UTC' WHERE last_activity_date IS NOT NULL;
UPDATE prospects SET last_contacted = last_contacted AT TIME ZONE 'UTC' WHERE last_contacted IS NOT NULL;
UPDATE prospects SET follow_up_date = follow_up_date AT TIME ZONE 'UTC' WHERE follow_up_date IS NOT NULL;

-- PRODUCTS table
UPDATE products SET created_at = created_at AT TIME ZONE 'UTC' WHERE created_at IS NOT NULL;
UPDATE products SET updated_at = updated_at AT TIME ZONE 'UTC' WHERE updated_at IS NOT NULL;

-- INVOICES table
UPDATE invoices SET created_at = created_at AT TIME ZONE 'UTC' WHERE created_at IS NOT NULL;
UPDATE invoices SET updated_at = updated_at AT TIME ZONE 'UTC' WHERE updated_at IS NOT NULL;
UPDATE invoices SET pdf_generated_at = pdf_generated_at AT TIME ZONE 'UTC' WHERE pdf_generated_at IS NOT NULL;
UPDATE invoices SET quickbooks_sync_date = quickbooks_sync_date AT TIME ZONE 'UTC' WHERE quickbooks_sync_date IS NOT NULL;

-- PAYMENTS table
UPDATE payments SET created_at = created_at AT TIME ZONE 'UTC' WHERE created_at IS NOT NULL;

-- DOCUMENTS table
UPDATE documents SET created_at = created_at AT TIME ZONE 'UTC' WHERE created_at IS NOT NULL;
UPDATE documents SET updated_at = updated_at AT TIME ZONE 'UTC' WHERE updated_at IS NOT NULL;
UPDATE documents SET approved_at = approved_at AT TIME ZONE 'UTC' WHERE approved_at IS NOT NULL;

-- NOTIFICATIONS table
UPDATE notifications SET created_at = created_at AT TIME ZONE 'UTC' WHERE created_at IS NOT NULL;

-- ACTIVITIES table
UPDATE activities SET created_at = created_at AT TIME ZONE 'UTC' WHERE created_at IS NOT NULL;
UPDATE activities SET updated_at = updated_at AT TIME ZONE 'UTC' WHERE updated_at IS NOT NULL;

-- COLLECTIONS table
UPDATE collections SET created_at = created_at AT TIME ZONE 'UTC' WHERE created_at IS NOT NULL;
UPDATE collections SET updated_at = updated_at AT TIME ZONE 'UTC' WHERE updated_at IS NOT NULL;

-- CONCEPTS table
UPDATE concepts SET created_at = created_at AT TIME ZONE 'UTC' WHERE created_at IS NOT NULL;
UPDATE concepts SET updated_at = updated_at AT TIME ZONE 'UTC' WHERE updated_at IS NOT NULL;

-- PROTOTYPES table
UPDATE prototypes SET created_at = created_at AT TIME ZONE 'UTC' WHERE created_at IS NOT NULL;
UPDATE prototypes SET updated_at = updated_at AT TIME ZONE 'UTC' WHERE updated_at IS NOT NULL;
UPDATE prototypes SET approved_date = approved_date AT TIME ZONE 'UTC' WHERE approved_date IS NOT NULL;

-- PRODUCTION_ITEMS table
UPDATE production_items SET created_at = created_at AT TIME ZONE 'UTC' WHERE created_at IS NOT NULL;
UPDATE production_items SET updated_at = updated_at AT TIME ZONE 'UTC' WHERE updated_at IS NOT NULL;

-- QUALITY_CHECKS table
UPDATE quality_checks SET created_at = created_at AT TIME ZONE 'UTC' WHERE created_at IS NOT NULL;
UPDATE quality_checks SET updated_at = updated_at AT TIME ZONE 'UTC' WHERE updated_at IS NOT NULL;
UPDATE quality_checks SET inspection_date = inspection_date AT TIME ZONE 'UTC' WHERE inspection_date IS NOT NULL;

-- USER_ROLES table
UPDATE user_roles SET created_at = created_at AT TIME ZONE 'UTC' WHERE created_at IS NOT NULL;
UPDATE user_roles SET updated_at = updated_at AT TIME ZONE 'UTC' WHERE updated_at IS NOT NULL;

-- Verify fix by checking for any remaining GMT timezones
-- (This query will return 0 if all fixed successfully)
SELECT
  'orders' as table_name,
  COUNT(*) as gmt_count
FROM orders
WHERE created_at::text LIKE '%gmt%'
   OR updated_at::text LIKE '%gmt%'
   OR due_date::text LIKE '%gmt%'
   OR estimated_completion::text LIKE '%gmt%'
   OR actual_completion::text LIKE '%gmt%'
UNION ALL
SELECT
  'customers' as table_name,
  COUNT(*) as gmt_count
FROM customers
WHERE created_at::text LIKE '%gmt%'
   OR updated_at::text LIKE '%gmt%'
   OR last_activity_date::text LIKE '%gmt%'
UNION ALL
SELECT
  'projects' as table_name,
  COUNT(*) as gmt_count
FROM projects
WHERE created_at::text LIKE '%gmt%'
   OR updated_at::text LIKE '%gmt%'
   OR start_date::text LIKE '%gmt%'
   OR end_date::text LIKE '%gmt%'
UNION ALL
SELECT
  'tasks' as table_name,
  COUNT(*) as gmt_count
FROM tasks
WHERE created_at::text LIKE '%gmt%'
   OR updated_at::text LIKE '%gmt%'
   OR due_date::text LIKE '%gmt%'
UNION ALL
SELECT
  'order_items' as table_name,
  COUNT(*) as gmt_count
FROM order_items
WHERE created_at::text LIKE '%gmt%'
   OR updated_at::text LIKE '%gmt%'
UNION ALL
SELECT
  'production_orders' as table_name,
  COUNT(*) as gmt_count
FROM production_orders
WHERE created_at::text LIKE '%gmt%'
   OR updated_at::text LIKE '%gmt%'
UNION ALL
SELECT
  'shipments' as table_name,
  COUNT(*) as gmt_count
FROM shipments
WHERE created_at::text LIKE '%gmt%'
   OR updated_at::text LIKE '%gmt%';

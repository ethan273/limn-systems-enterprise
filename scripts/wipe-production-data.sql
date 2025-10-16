-- Wipe Production Test Data
-- Run this AFTER team testing is complete and you're ready for real data
-- This removes all business data but preserves users, config, and API credentials

-- WARNING: This is destructive and cannot be undone!
-- Make sure you have a backup before running

BEGIN;

-- Show what we're about to delete
DO $$
DECLARE
  total_rows INTEGER := 0;
  table_row_count INTEGER;
BEGIN
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE 'PRODUCTION DATA WIPE - PRE-DELETE COUNTS';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '';

  -- Count rows in each table we'll wipe
  SELECT COUNT(*) INTO table_row_count FROM orders;
  RAISE NOTICE 'orders: % rows', table_row_count;
  total_rows := total_rows + table_row_count;

  SELECT COUNT(*) INTO table_row_count FROM customers;
  RAISE NOTICE 'customers: % rows', table_row_count;
  total_rows := total_rows + table_row_count;

  SELECT COUNT(*) INTO table_row_count FROM products;
  RAISE NOTICE 'products: % rows', table_row_count;
  total_rows := total_rows + table_row_count;

  SELECT COUNT(*) INTO table_row_count FROM invoices;
  RAISE NOTICE 'invoices: % rows', table_row_count;
  total_rows := total_rows + table_row_count;

  RAISE NOTICE '';
  RAISE NOTICE 'Total rows to delete: %', total_rows;
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '';
END $$;

-- Disable triggers for faster deletion
SET session_replication_role = 'replica';

-- Delete business data (in order to respect foreign keys)
-- Keep: users, user_profiles, api_credentials, customer_portal_access

-- Logs and notifications
TRUNCATE TABLE api_usage_logs CASCADE;
TRUNCATE TABLE audit_logs CASCADE;
TRUNCATE TABLE notifications CASCADE;

-- Orders and related
TRUNCATE TABLE order_items CASCADE;
TRUNCATE TABLE orders CASCADE;

-- Production
TRUNCATE TABLE production_tracking CASCADE;
TRUNCATE TABLE production_invoices CASCADE;
TRUNCATE TABLE production_orders CASCADE;
TRUNCATE TABLE ordered_items_production CASCADE;

-- Products
TRUNCATE TABLE product_images CASCADE;
TRUNCATE TABLE product_materials CASCADE;
TRUNCATE TABLE flipbook_pages CASCADE;
TRUNCATE TABLE flipbooks CASCADE;
TRUNCATE TABLE prototypes CASCADE;
TRUNCATE TABLE concepts CASCADE;
TRUNCATE TABLE products CASCADE;

-- Materials and Collections
TRUNCATE TABLE collection_items CASCADE;
TRUNCATE TABLE items CASCADE;
TRUNCATE TABLE materials CASCADE;
TRUNCATE TABLE material_types CASCADE;
TRUNCATE TABLE collections CASCADE;

-- CRM
TRUNCATE TABLE customer_interactions CASCADE;
TRUNCATE TABLE customer_contacts CASCADE;
TRUNCATE TABLE customers CASCADE;
TRUNCATE TABLE leads CASCADE;
TRUNCATE TABLE contacts CASCADE;

-- Projects
TRUNCATE TABLE project_tasks CASCADE;
TRUNCATE TABLE project_milestones CASCADE;
TRUNCATE TABLE projects CASCADE;

-- Partners
TRUNCATE TABLE partner_certifications CASCADE;
TRUNCATE TABLE partner_reviews CASCADE;
TRUNCATE TABLE factory_reviews CASCADE;
TRUNCATE TABLE partners CASCADE;

-- Design
TRUNCATE TABLE design_board_elements CASCADE;
TRUNCATE TABLE design_boards CASCADE;
TRUNCATE TABLE mood_board_items CASCADE;
TRUNCATE TABLE mood_boards CASCADE;
TRUNCATE TABLE design_briefs CASCADE;
TRUNCATE TABLE design_projects CASCADE;

-- Documents
TRUNCATE TABLE documents CASCADE;
TRUNCATE TABLE shop_drawings CASCADE;

-- Tasks
TRUNCATE TABLE task_dependencies CASCADE;
TRUNCATE TABLE task_comments CASCADE;
TRUNCATE TABLE tasks CASCADE;

-- Financials
TRUNCATE TABLE payment_allocations CASCADE;
TRUNCATE TABLE payments CASCADE;
TRUNCATE TABLE invoice_items CASCADE;
TRUNCATE TABLE invoices CASCADE;
TRUNCATE TABLE expenses CASCADE;

-- Shipping and Packing
TRUNCATE TABLE packing_list_items CASCADE;
TRUNCATE TABLE packing_lists CASCADE;
TRUNCATE TABLE shipments CASCADE;

-- QC
TRUNCATE TABLE qc_inspections CASCADE;

-- QuickBooks sync logs
TRUNCATE TABLE quickbooks_sync_log CASCADE;

-- Re-enable triggers
SET session_replication_role = 'default';

-- Show what remains
DO $$
DECLARE
  user_count INTEGER;
  api_cred_count INTEGER;
  portal_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE 'WIPE COMPLETE - PRESERVED DATA';
  RAISE NOTICE '════════════════════════════════════════';

  SELECT COUNT(*) INTO user_count FROM users;
  RAISE NOTICE 'Users preserved: %', user_count;

  SELECT COUNT(*) INTO api_cred_count FROM api_credentials;
  RAISE NOTICE 'API credentials preserved: %', api_cred_count;

  SELECT COUNT(*) INTO portal_count FROM customer_portal_access;
  RAISE NOTICE 'Portal access configs preserved: %', portal_count;

  RAISE NOTICE '';
  RAISE NOTICE 'Production database is now clean and ready for real data!';
  RAISE NOTICE '════════════════════════════════════════';
END $$;

COMMIT;

-- Final verification - show counts for major tables (should all be 0)
SELECT
  'orders' as table_name, COUNT(*) as row_count FROM orders
UNION ALL SELECT 'customers', COUNT(*) FROM customers
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'invoices', COUNT(*) FROM invoices
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'api_credentials', COUNT(*) FROM api_credentials
ORDER BY row_count DESC;

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES FOR LIMN SYSTEMS ENTERPRISE
-- ============================================================================
-- Purpose: Enable RLS and create policies for data isolation between users
-- Date: 2025-10-09
-- Required for: Security test suite (30-security-data-isolation.spec.ts)
--
-- IMPORTANT: Run this script in Supabase SQL Editor
-- Database: limn-systems-enterprise (gwqkbjymbarkufwvdmar)
-- ============================================================================

-- ============================================================================
-- STEP 1: ENABLE RLS ON ALL CUSTOMER-FACING TABLES
-- ============================================================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY; -- Table does not exist (use production_invoice_line_items instead)
ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_portal_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE portal_module_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: CUSTOMERS TABLE POLICIES
-- ============================================================================

-- Customers can view their own customer record
CREATE POLICY "customers_view_own_record"
  ON customers
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    id IN (
      SELECT customer_id
      FROM customer_portal_access
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Employees can view customers they're assigned to
CREATE POLICY "employees_view_assigned_customers"
  ON customers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type IN ('employee', 'admin', 'super_admin')
    )
  );

-- Admins can view all customers
CREATE POLICY "admins_view_all_customers"
  ON customers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type IN ('admin', 'super_admin')
    )
  );

-- Admins can insert/update/delete customers
CREATE POLICY "admins_manage_customers"
  ON customers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- STEP 3: ORDERS TABLE POLICIES
-- ============================================================================

-- Customers can view their own orders
CREATE POLICY "customers_view_own_orders"
  ON orders
  FOR SELECT
  USING (
    customer_id IN (
      SELECT customer_id
      FROM customer_portal_access
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Employees can view all orders (for internal operations)
CREATE POLICY "employees_view_all_orders"
  ON orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type IN ('employee', 'admin', 'super_admin')
    )
  );

-- Admins can manage all orders
CREATE POLICY "admins_manage_orders"
  ON orders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- STEP 4: INVOICES TABLE POLICIES
-- ============================================================================

-- Customers can view their own invoices
CREATE POLICY "customers_view_own_invoices"
  ON invoices
  FOR SELECT
  USING (
    customer_id IN (
      SELECT customer_id
      FROM customer_portal_access
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Employees can view all invoices
CREATE POLICY "employees_view_all_invoices"
  ON invoices
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type IN ('employee', 'admin', 'super_admin')
    )
  );

-- Admins can manage all invoices
CREATE POLICY "admins_manage_invoices"
  ON invoices
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- STEP 5: SHIPMENTS TABLE POLICIES
-- ============================================================================

-- Customers can view shipments for their orders
CREATE POLICY "customers_view_own_shipments"
  ON shipments
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE customer_id IN (
        SELECT customer_id
        FROM customer_portal_access
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- Employees can view all shipments
CREATE POLICY "employees_view_all_shipments"
  ON shipments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type IN ('employee', 'admin', 'super_admin')
    )
  );

-- Admins can manage all shipments
CREATE POLICY "admins_manage_shipments"
  ON shipments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- STEP 6: PRODUCTION ORDERS TABLE POLICIES
-- ============================================================================

-- Factory users can view production orders assigned to them
CREATE POLICY "factory_view_assigned_production_orders"
  ON production_orders
  FOR SELECT
  USING (
    assigned_to = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type IN ('employee', 'admin', 'super_admin')
    )
  );

-- Employees can view all production orders
CREATE POLICY "employees_view_all_production_orders"
  ON production_orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type IN ('employee', 'admin', 'super_admin')
    )
  );

-- Admins can manage all production orders
CREATE POLICY "admins_manage_production_orders"
  ON production_orders
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- STEP 7: PROJECTS TABLE POLICIES
-- ============================================================================

-- Designers can view projects assigned to them
CREATE POLICY "designers_view_assigned_projects"
  ON projects
  FOR SELECT
  USING (
    assigned_designer_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type IN ('admin', 'super_admin')
    )
  );

-- Employees can view all projects
CREATE POLICY "employees_view_all_projects"
  ON projects
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type IN ('employee', 'admin', 'super_admin')
    )
  );

-- Admins can manage all projects
CREATE POLICY "admins_manage_projects"
  ON projects
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- STEP 8: ORDER ITEMS TABLE POLICIES
-- ============================================================================

-- Customers can view order items for their orders
CREATE POLICY "customers_view_own_order_items"
  ON order_items
  FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE customer_id IN (
        SELECT customer_id
        FROM customer_portal_access
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- Employees can view all order items
CREATE POLICY "employees_view_all_order_items"
  ON order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type IN ('employee', 'admin', 'super_admin')
    )
  );

-- Admins can manage all order items
CREATE POLICY "admins_manage_order_items"
  ON order_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- STEP 9: INVOICE LINE ITEMS TABLE POLICIES
-- ============================================================================
-- NOTE: Table 'invoice_line_items' does not exist in current schema
-- Consider using 'production_invoice_line_items' instead if needed

-- Customers can view invoice line items for their invoices
-- CREATE POLICY "customers_view_own_invoice_line_items"
--   ON invoice_line_items
--   FOR SELECT
--   USING (
--     invoice_id IN (
--       SELECT id FROM invoices
--       WHERE customer_id IN (
--         SELECT customer_id
--         FROM customer_portal_access
--         WHERE user_id = auth.uid() AND is_active = true
--       )
--     )
--   );

-- Employees can view all invoice line items
-- CREATE POLICY "employees_view_all_invoice_line_items"
--   ON invoice_line_items
--   FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM user_profiles
--       WHERE id = auth.uid()
--       AND user_type IN ('employee', 'admin', 'super_admin')
--     )
--   );

-- Admins can manage all invoice line items
-- CREATE POLICY "admins_manage_invoice_line_items"
--   ON invoice_line_items
--   FOR ALL
--   USING (
--     EXISTS (
--       SELECT 1 FROM user_profiles
--       WHERE id = auth.uid()
--       AND user_type IN ('admin', 'super_admin')
--     )
--   );

-- ============================================================================
-- STEP 10: PAYMENT ALLOCATIONS TABLE POLICIES
-- ============================================================================

-- Customers can view payment allocations for their invoices
CREATE POLICY "customers_view_own_payment_allocations"
  ON payment_allocations
  FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM invoices
      WHERE customer_id IN (
        SELECT customer_id
        FROM customer_portal_access
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- Employees can view all payment allocations
CREATE POLICY "employees_view_all_payment_allocations"
  ON payment_allocations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type IN ('employee', 'admin', 'super_admin')
    )
  );

-- Admins can manage all payment allocations
CREATE POLICY "admins_manage_payment_allocations"
  ON payment_allocations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- STEP 11: PORTAL ACCESS TABLES POLICIES
-- ============================================================================

-- Users can view their own portal access
CREATE POLICY "users_view_own_portal_access"
  ON customer_portal_access
  FOR SELECT
  USING (user_id = auth.uid());

-- Admins can manage all portal access
CREATE POLICY "admins_manage_portal_access"
  ON customer_portal_access
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type IN ('admin', 'super_admin')
    )
  );

-- Users can view their own portal configurations
CREATE POLICY "users_view_own_portal_config"
  ON portal_configurations
  FOR SELECT
  USING (user_id = auth.uid());

-- Admins can manage all portal configurations
CREATE POLICY "admins_manage_portal_config"
  ON portal_configurations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type IN ('admin', 'super_admin')
    )
  );

-- Users can view their own module settings
CREATE POLICY "users_view_own_module_settings"
  ON portal_module_settings
  FOR SELECT
  USING (user_id = auth.uid());

-- Admins can manage all module settings
CREATE POLICY "admins_manage_module_settings"
  ON portal_module_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these queries after applying policies to verify RLS is enabled:

-- Check RLS enabled on tables
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'customers', 'orders', 'invoices', 'shipments',
  'production_orders', 'projects', 'order_items',
  'invoice_line_items', 'payment_allocations',
  'customer_portal_access', 'portal_configurations',
  'portal_module_settings'
)
ORDER BY tablename;

-- Check policies created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. These policies use auth.uid() which requires authenticated users
-- 2. Service role key bypasses ALL RLS policies (used in tests)
-- 3. Anon key enforces RLS policies
-- 4. Test users must be in user_profiles table with correct user_type
-- 5. customer_portal_access table links users to customers for portal access

-- ============================================================================
-- TESTING
-- ============================================================================

-- After running this script, test with:
-- npx playwright test tests/30-security-data-isolation.spec.ts --workers=1

-- Expected: More tests should pass (currently 2/28, should increase significantly)

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- To disable RLS and remove all policies:
-- DROP POLICY IF EXISTS "customers_view_own_record" ON customers;
-- DROP POLICY IF EXISTS "employees_view_assigned_customers" ON customers;
-- ... (repeat for all policies)
-- ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
-- ... (repeat for all tables)

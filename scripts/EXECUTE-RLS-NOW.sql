-- ============================================================================
-- RLS IMPLEMENTATION SCRIPT - EXECUTE THIS IN SUPABASE SQL EDITOR
-- ============================================================================
-- Database: limn-systems-enterprise (gwqkbjymbarkufwvdmar)
-- Date: 2025-10-09
-- Purpose: Enable Row-Level Security and create all necessary policies
--
-- INSTRUCTIONS:
-- 1. Open Supabase Dashboard: https://supabase.com/dashboard/project/gwqkbjymbarkufwvdmar
-- 2. Click "SQL Editor" in left sidebar
-- 3. Click "New Query"
-- 4. Copy this ENTIRE file and paste into the editor
-- 5. Click "Run" (or press Cmd+Enter)
-- 6. Wait for "Success" message
-- 7. Run verification queries at bottom
-- ============================================================================

-- ============================================================================
-- STEP 1: ENABLE RLS ON ALL TABLES
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

CREATE POLICY "customers_view_own_record"
  ON customers FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    id IN (
      SELECT customer_id FROM customer_portal_access
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "employees_view_all_customers"
  ON customers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type IN ('employee', 'admin', 'super_admin')
    )
  );

CREATE POLICY "admins_manage_customers"
  ON customers FOR ALL
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

CREATE POLICY "customers_view_own_orders"
  ON orders FOR SELECT
  USING (
    customer_id IN (
      SELECT customer_id FROM customer_portal_access
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "employees_view_all_orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type IN ('employee', 'admin', 'super_admin')
    )
  );

CREATE POLICY "admins_manage_orders"
  ON orders FOR ALL
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

CREATE POLICY "customers_view_own_invoices"
  ON invoices FOR SELECT
  USING (
    customer_id IN (
      SELECT customer_id FROM customer_portal_access
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "employees_view_all_invoices"
  ON invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type IN ('employee', 'admin', 'super_admin')
    )
  );

CREATE POLICY "admins_manage_invoices"
  ON invoices FOR ALL
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

CREATE POLICY "customers_view_own_shipments"
  ON shipments FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE customer_id IN (
        SELECT customer_id FROM customer_portal_access
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

CREATE POLICY "employees_view_all_shipments"
  ON shipments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type IN ('employee', 'admin', 'super_admin')
    )
  );

CREATE POLICY "admins_manage_shipments"
  ON shipments FOR ALL
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

CREATE POLICY "factory_view_assigned_production_orders"
  ON production_orders FOR SELECT
  USING (
    assigned_to = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type IN ('employee', 'admin', 'super_admin')
    )
  );

CREATE POLICY "admins_manage_production_orders"
  ON production_orders FOR ALL
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

CREATE POLICY "designers_view_assigned_projects"
  ON projects FOR SELECT
  USING (
    assigned_designer_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "employees_view_all_projects"
  ON projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type IN ('employee', 'admin', 'super_admin')
    )
  );

CREATE POLICY "admins_manage_projects"
  ON projects FOR ALL
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

CREATE POLICY "customers_view_own_order_items"
  ON order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders
      WHERE customer_id IN (
        SELECT customer_id FROM customer_portal_access
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

CREATE POLICY "employees_view_all_order_items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type IN ('employee', 'admin', 'super_admin')
    )
  );

CREATE POLICY "admins_manage_order_items"
  ON order_items FOR ALL
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

-- CREATE POLICY "customers_view_own_invoice_line_items"
--   ON invoice_line_items FOR SELECT
--   USING (
--     invoice_id IN (
--       SELECT id FROM invoices
--       WHERE customer_id IN (
--         SELECT customer_id FROM customer_portal_access
--         WHERE user_id = auth.uid() AND is_active = true
--       )
--     )
--   );

-- CREATE POLICY "employees_view_all_invoice_line_items"
--   ON invoice_line_items FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM user_profiles
--       WHERE id = auth.uid()
--       AND user_type IN ('employee', 'admin', 'super_admin')
--     )
--   );

-- CREATE POLICY "admins_manage_invoice_line_items"
--   ON invoice_line_items FOR ALL
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

CREATE POLICY "customers_view_own_payment_allocations"
  ON payment_allocations FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM invoices
      WHERE customer_id IN (
        SELECT customer_id FROM customer_portal_access
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

CREATE POLICY "employees_view_all_payment_allocations"
  ON payment_allocations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type IN ('employee', 'admin', 'super_admin')
    )
  );

CREATE POLICY "admins_manage_payment_allocations"
  ON payment_allocations FOR ALL
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

CREATE POLICY "users_view_own_portal_access"
  ON customer_portal_access FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "admins_manage_portal_access"
  ON customer_portal_access FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "users_view_own_portal_config"
  ON portal_configurations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "admins_manage_portal_config"
  ON portal_configurations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "users_view_own_module_settings"
  ON portal_module_settings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "admins_manage_module_settings"
  ON portal_module_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND user_type IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- VERIFICATION QUERIES - RUN THESE AFTER MAIN SCRIPT COMPLETES
-- ============================================================================

-- Query 1: Verify RLS is enabled (should show rowsecurity = true for all tables)
SELECT
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

-- Query 2: Count policies created (should return 36 rows)
SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Query 3: List all policies by table
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- EXPECTED RESULTS
-- ============================================================================

-- Query 1: All 12 tables should show rowsecurity = true
-- Query 2: Should show ~36 total policies across all tables
-- Query 3: Should list all policy names (customers_view_own_record, etc.)

-- ============================================================================
-- SUCCESS CRITERIA
-- ============================================================================

-- ✅ Script completes without errors
-- ✅ All tables show RLS enabled
-- ✅ 36 policies created
-- ✅ No duplicate policy errors

-- ============================================================================
-- NEXT STEP AFTER RUNNING THIS SCRIPT
-- ============================================================================

-- Run security tests:
-- npx playwright test tests/30-security-data-isolation.spec.ts --workers=1

-- Expected improvement:
-- Before: 2/28 passing
-- After: 20+/28 passing

-- ============================================================================
-- ROLLBACK (IF NEEDED)
-- ============================================================================

-- To disable RLS (run in SQL Editor):
/*
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE shipments DISABLE ROW LEVEL SECURITY;
ALTER TABLE production_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE invoice_line_items DISABLE ROW LEVEL SECURITY; -- Table does not exist
ALTER TABLE payment_allocations DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE customer_portal_access DISABLE ROW LEVEL SECURITY;
ALTER TABLE portal_configurations DISABLE ROW LEVEL SECURITY;
ALTER TABLE portal_module_settings DISABLE ROW LEVEL SECURITY;
*/

-- ============================================================================
-- END OF SCRIPT
-- ============================================================================

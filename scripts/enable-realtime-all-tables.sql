-- Enable Realtime for all requested tables
-- This completes the full realtime configuration

-- 1. Add all tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE quality_inspections;
ALTER PUBLICATION supabase_realtime ADD TABLE shipments;
ALTER PUBLICATION supabase_realtime ADD TABLE invoices;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Note: production_orders already added in previous script

-- 2. Ensure RLS is enabled on all tables
ALTER TABLE quality_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for realtime SELECT access

-- Quality Inspections: Access via manufacturer_projects → collections → orders → customer_id
DROP POLICY IF EXISTS "Users can view their quality inspections via realtime" ON quality_inspections;

CREATE POLICY "Users can view their quality inspections via realtime"
ON quality_inspections
FOR SELECT
USING (
  manufacturer_project_id IN (
    SELECT mp.id
    FROM manufacturer_projects mp
    JOIN collections c ON mp.collection_id = c.id
    JOIN orders o ON c.id = o.collection_id
    WHERE o.customer_id::text = auth.uid()::text
  )
  OR
  -- Or if user is the inspector
  inspector_name = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Shipments: Access via order_id → customer_id
DROP POLICY IF EXISTS "Users can view their shipments via realtime" ON shipments;

CREATE POLICY "Users can view their shipments via realtime"
ON shipments
FOR SELECT
USING (
  order_id IN (
    SELECT id FROM orders
    WHERE customer_id::text = auth.uid()::text
  )
  OR
  -- Or if user created the shipment
  created_by::text = auth.uid()::text
);

-- Invoices: Direct access via customer_id
DROP POLICY IF EXISTS "Users can view their invoices via realtime" ON invoices;

CREATE POLICY "Users can view their invoices via realtime"
ON invoices
FOR SELECT
USING (
  customer_id::text = auth.uid()::text
  OR
  -- Or via order
  order_id IN (
    SELECT id FROM orders
    WHERE customer_id::text = auth.uid()::text
  )
);

-- Notifications: Direct access via user_id or customer_id
DROP POLICY IF EXISTS "Users can view their notifications via realtime" ON notifications;

CREATE POLICY "Users can view their notifications via realtime"
ON notifications
FOR SELECT
USING (
  user_id = auth.uid()::text
  OR
  customer_id::text = auth.uid()::text
);

-- 4. Verify all tables are enabled
SELECT
  schemaname,
  tablename,
  pg_publication.pubname
FROM pg_publication_tables
JOIN pg_publication ON pg_publication_tables.pubname = pg_publication.pubname
WHERE tablename IN ('production_orders', 'quality_inspections', 'shipments', 'invoices', 'notifications')
  AND schemaname = 'public'
ORDER BY tablename;

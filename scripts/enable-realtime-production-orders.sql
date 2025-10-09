-- Enable Realtime for production_orders table
-- Fix: Claude Desktop enabled orders instead of production_orders

-- 1. Enable realtime publication for production_orders
ALTER PUBLICATION supabase_realtime ADD TABLE production_orders;

-- 2. Ensure RLS is enabled (should already be, but verify)
ALTER TABLE production_orders ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policy for realtime SELECT access
-- Users can view production_orders for their own orders
DROP POLICY IF EXISTS "Users can view their production orders via realtime" ON production_orders;

CREATE POLICY "Users can view their production orders via realtime"
ON production_orders
FOR SELECT
USING (
  -- Join to orders table to check customer_id
  order_id IN (
    SELECT id FROM orders
    WHERE customer_id::text = auth.uid()::text
  )
  OR
  -- Or if user is the factory
  factory_id::text = auth.uid()::text
  OR
  -- Or if user created the production order
  created_by::text = auth.uid()::text
);

-- 4. Verify realtime is enabled
SELECT
  schemaname,
  tablename,
  pg_publication.pubname
FROM pg_publication_tables
JOIN pg_publication ON pg_publication_tables.pubname = pg_publication.pubname
WHERE tablename = 'production_orders'
  AND schemaname = 'public';

-- Should return: supabase_realtime publication

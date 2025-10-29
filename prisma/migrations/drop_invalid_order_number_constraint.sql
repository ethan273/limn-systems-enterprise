-- Drop the invalid order_number_format constraint
-- This was added in an earlier attempt but doesn't match actual data

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_number_format;

-- Verify it's gone
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'orders_number_format'
  ) THEN
    RAISE EXCEPTION '✗ FAILED: orders_number_format still exists!';
  ELSE
    RAISE NOTICE '✓ SUCCESS: orders_number_format constraint removed';
  END IF;
END $$;

-- Show remaining constraints
SELECT
  'Remaining constraints:' as info,
  constraint_name
FROM information_schema.constraint_column_usage
WHERE constraint_name IN (
  'orders_must_have_customer_or_project',
  'orders_total_amount_positive',
  'production_orders_total_cost_positive',
  'production_orders_deposit_amount_positive'
)
ORDER BY constraint_name;

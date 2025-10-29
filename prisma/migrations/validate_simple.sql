-- Simple Validation Script for Phase 2 Constraints
-- Run this to check if data is ready for constraints

-- CHECK 1: Orders without customer_id or project_id
SELECT
  '1. Orders missing customer/project' as check,
  COUNT(*) as issues
FROM orders
WHERE customer_id IS NULL AND project_id IS NULL;

-- CHECK 2: Invalid order number formats
SELECT
  '2. Invalid order numbers' as check,
  COUNT(*) as issues
FROM orders
WHERE order_number !~ '^ORD-[0-9]{6}$';

-- CHECK 3: Negative amounts in orders
SELECT
  '3. Negative order amounts' as check,
  COUNT(*) as issues
FROM orders
WHERE total_amount < 0;

-- CHECK 4: Negative amounts in production_orders
SELECT
  '4. Negative production amounts' as check,
  COUNT(*) as issues
FROM production_orders
WHERE total_cost < 0 OR deposit_amount < 0;

-- Summary: If all "issues" columns show 0, you're good to proceed!

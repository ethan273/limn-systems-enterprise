-- Pre-Migration Validation Script (Supabase Dashboard Compatible)
-- Phase 2: Database Constraints
-- Purpose: Check if existing data will violate new constraints
-- Date: 2025-10-28

-- ============================================================================
-- RUN THIS SCRIPT FIRST - BEFORE APPLYING CONSTRAINTS
-- ============================================================================

-- CHECK 1: Orders without customer_id or project_id
SELECT
  'CHECK 1: Orders without customer_id or project_id' as check_name,
  COUNT(*) as invalid_count,
  CASE
    WHEN COUNT(*) = 0 THEN 'PASS - No invalid orders'
    ELSE 'FAIL - Found orders without customer_id or project_id'
  END as status
FROM orders
WHERE customer_id IS NULL AND project_id IS NULL;

-- Show details if any found (limit 10)
SELECT
  'Invalid Order Details' as info,
  id,
  order_number,
  customer_id,
  project_id,
  created_at
FROM orders
WHERE customer_id IS NULL AND project_id IS NULL
LIMIT 10;

-- CHECK 2: Invalid order number formats
SELECT
  'CHECK 2: Invalid order number formats (should be ORD-XXXXXX)' as check_name,
  COUNT(*) as invalid_count,
  CASE
    WHEN COUNT(*) = 0 THEN 'PASS - All order numbers valid'
    ELSE 'FAIL - Found invalid order number formats'
  END as status
FROM orders
WHERE order_number !~ '^ORD-[0-9]{6}$';

-- Show details if any found (limit 10)
SELECT
  'Invalid Order Number Details' as info,
  id,
  order_number,
  created_at
FROM orders
WHERE order_number !~ '^ORD-[0-9]{6}$'
ORDER BY created_at DESC
LIMIT 10;

-- CHECK 3: Negative amounts in orders (total_amount)
SELECT
  'CHECK 3a: Negative total_amount in orders' as check_name,
  COUNT(*) as invalid_count,
  CASE
    WHEN COUNT(*) = 0 THEN 'PASS - No negative total_amount'
    ELSE 'FAIL - Found negative total_amount values'
  END as status
FROM orders
WHERE total_amount < 0;

-- CHECK 3b: Negative amounts in orders (deposit_amount)
SELECT
  'CHECK 3b: Negative deposit_amount in orders' as check_name,
  COUNT(*) as invalid_count,
  CASE
    WHEN COUNT(*) = 0 THEN 'PASS - No negative deposit_amount'
    ELSE 'FAIL - Found negative deposit_amount values'
  END as status
FROM orders
WHERE deposit_amount < 0;

-- Show details if any found
SELECT
  'Negative Amount Details' as info,
  id,
  order_number,
  total_amount,
  deposit_amount,
  created_at
FROM orders
WHERE total_amount < 0 OR deposit_amount < 0
LIMIT 10;

-- CHECK 4: Negative amounts in production_orders (total_cost)
SELECT
  'CHECK 4a: Negative total_cost in production_orders' as check_name,
  COUNT(*) as invalid_count,
  CASE
    WHEN COUNT(*) = 0 THEN 'PASS - No negative total_cost'
    ELSE 'FAIL - Found negative total_cost values'
  END as status
FROM production_orders
WHERE total_cost < 0;

-- CHECK 4b: Negative amounts in production_orders (deposit_amount)
SELECT
  'CHECK 4b: Negative deposit_amount in production_orders' as check_name,
  COUNT(*) as invalid_count,
  CASE
    WHEN COUNT(*) = 0 THEN 'PASS - No negative deposit_amount'
    ELSE 'FAIL - Found negative deposit_amount values'
  END as status
FROM production_orders
WHERE deposit_amount < 0;

-- Show details if any found
SELECT
  'Negative Production Amount Details' as info,
  id,
  production_order_number,
  total_cost,
  deposit_amount,
  created_at
FROM production_orders
WHERE total_cost < 0 OR deposit_amount < 0
LIMIT 10;

-- VALIDATION SUMMARY
DO $$
DECLARE
  invalid_orders INTEGER;
  invalid_order_numbers INTEGER;
  negative_order_amounts INTEGER;
  negative_production_amounts INTEGER;
  total_issues INTEGER := 0;
BEGIN
  -- Count all issues
  SELECT COUNT(*) INTO invalid_orders
  FROM orders
  WHERE customer_id IS NULL AND project_id IS NULL;

  SELECT COUNT(*) INTO invalid_order_numbers
  FROM orders
  WHERE order_number !~ '^ORD-[0-9]{6}$';

  SELECT COUNT(*) INTO negative_order_amounts
  FROM orders
  WHERE total_amount < 0 OR deposit_amount < 0;

  SELECT COUNT(*) INTO negative_production_amounts
  FROM production_orders
  WHERE total_cost < 0 OR deposit_amount < 0;

  total_issues := invalid_orders + invalid_order_numbers + negative_order_amounts + negative_production_amounts;

  RAISE NOTICE '';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE '  VALIDATION SUMMARY';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Orders without customer_id/project_id: %', invalid_orders;
  RAISE NOTICE 'Invalid order number formats: %', invalid_order_numbers;
  RAISE NOTICE 'Orders with negative amounts: %', negative_order_amounts;
  RAISE NOTICE 'Production orders with negative amounts: %', negative_production_amounts;
  RAISE NOTICE '';
  RAISE NOTICE 'Total Issues Found: %', total_issues;
  RAISE NOTICE '';

  IF total_issues = 0 THEN
    RAISE NOTICE '✓✓✓ ALL CHECKS PASSED ✓✓✓';
    RAISE NOTICE '';
    RAISE NOTICE 'Database is ready for constraint migration!';
    RAISE NOTICE 'You can safely run: add_order_constraints.sql';
  ELSE
    RAISE NOTICE '✗✗✗ VALIDATION FAILED ✗✗✗';
    RAISE NOTICE '';
    RAISE NOTICE 'You MUST fix the invalid data before applying constraints!';
    RAISE NOTICE 'See the query results above for specific records.';
    RAISE NOTICE '';
    RAISE NOTICE 'DO NOT run add_order_constraints.sql until all issues are resolved.';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '=================================================================';
END $$;

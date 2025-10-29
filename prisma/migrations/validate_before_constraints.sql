-- Pre-Migration Validation Script
-- Phase 2: Database Constraints
-- Purpose: Check if existing data will violate new constraints
-- Date: 2025-10-28

-- ============================================================================
-- RUN THIS SCRIPT FIRST - BEFORE APPLYING CONSTRAINTS
-- ============================================================================

-- Colors/formatting for psql output
\echo ''
\echo '================================================================='
\echo '  Pre-Migration Validation - Checking Existing Data'
\echo '================================================================='
\echo ''

-- ============================================================================
-- CHECK 1: Orders without customer_id or project_id
-- ============================================================================

\echo '-------------------------------------------------------------------'
\echo 'CHECK 1: Orders without customer_id or project_id'
\echo '-------------------------------------------------------------------'

SELECT
  'INVALID ORDERS' as check_type,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) = 0 THEN '✓ PASS - No invalid orders'
    ELSE '✗ FAIL - Found orders without customer_id or project_id'
  END as status
FROM orders
WHERE customer_id IS NULL AND project_id IS NULL;

-- Show details if any found
SELECT
  id,
  order_number,
  customer_id,
  project_id,
  created_at
FROM orders
WHERE customer_id IS NULL AND project_id IS NULL
LIMIT 10;

\echo ''

-- ============================================================================
-- CHECK 2: Invalid order number formats
-- ============================================================================

\echo '-------------------------------------------------------------------'
\echo 'CHECK 2: Invalid order number formats (should be ORD-XXXXXX)'
\echo '-------------------------------------------------------------------'

SELECT
  'INVALID ORDER NUMBERS' as check_type,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) = 0 THEN '✓ PASS - All order numbers valid'
    ELSE '✗ FAIL - Found invalid order number formats'
  END as status
FROM orders
WHERE order_number !~ '^ORD-[0-9]{6}$';

-- Show details if any found
SELECT
  id,
  order_number,
  created_at
FROM orders
WHERE order_number !~ '^ORD-[0-9]{6}$'
ORDER BY created_at DESC
LIMIT 10;

\echo ''

-- ============================================================================
-- CHECK 3: Negative amounts in orders
-- ============================================================================

\echo '-------------------------------------------------------------------'
\echo 'CHECK 3: Negative amounts in orders table'
\echo '-------------------------------------------------------------------'

SELECT
  'NEGATIVE TOTAL_AMOUNT' as check_type,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) = 0 THEN '✓ PASS - No negative total_amount'
    ELSE '✗ FAIL - Found negative total_amount values'
  END as status
FROM orders
WHERE total_amount < 0;

SELECT
  'NEGATIVE DEPOSIT_AMOUNT' as check_type,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) = 0 THEN '✓ PASS - No negative deposit_amount'
    ELSE '✗ FAIL - Found negative deposit_amount values'
  END as status
FROM orders
WHERE deposit_amount < 0;

-- Show details if any found
SELECT
  id,
  order_number,
  total_amount,
  deposit_amount,
  created_at
FROM orders
WHERE total_amount < 0 OR deposit_amount < 0
LIMIT 10;

\echo ''

-- ============================================================================
-- CHECK 4: Negative amounts in production_orders
-- ============================================================================

\echo '-------------------------------------------------------------------'
\echo 'CHECK 4: Negative amounts in production_orders table'
\echo '-------------------------------------------------------------------'

SELECT
  'NEGATIVE TOTAL_COST' as check_type,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) = 0 THEN '✓ PASS - No negative total_cost'
    ELSE '✗ FAIL - Found negative total_cost values'
  END as status
FROM production_orders
WHERE total_cost < 0;

SELECT
  'NEGATIVE DEPOSIT_AMOUNT' as check_type,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) = 0 THEN '✓ PASS - No negative deposit_amount'
    ELSE '✗ FAIL - Found negative deposit_amount values'
  END as status
FROM production_orders
WHERE deposit_amount < 0;

-- Show details if any found
SELECT
  id,
  production_order_number,
  total_cost,
  deposit_amount,
  created_at
FROM production_orders
WHERE total_cost < 0 OR deposit_amount < 0
LIMIT 10;

\echo ''

-- ============================================================================
-- SUMMARY
-- ============================================================================

\echo '================================================================='
\echo '  VALIDATION SUMMARY'
\echo '================================================================='

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
  RAISE NOTICE 'Validation Results:';
  RAISE NOTICE '-------------------';
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
    RAISE NOTICE 'See the detailed output above for specific records.';
    RAISE NOTICE '';
    RAISE NOTICE 'DO NOT run add_order_constraints.sql until all issues are resolved.';
  END IF;

  RAISE NOTICE '';
END $$;

\echo '================================================================='
\echo ''

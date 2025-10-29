-- Migration: Add Database Constraints for Order System
-- Phase: 2 of 9 (Order System 100% Production Ready)
-- Date: 2025-10-28
-- Purpose: Add data integrity constraints at database level

-- ============================================================================
-- CONSTRAINT 1: Require either customer_id OR project_id (not both NULL)
-- ============================================================================

-- Add constraint to orders table
ALTER TABLE orders
ADD CONSTRAINT orders_must_have_customer_or_project
CHECK (customer_id IS NOT NULL OR project_id IS NOT NULL);

-- Verification
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'orders_must_have_customer_or_project'
  ) THEN
    RAISE NOTICE '✓ Constraint added: orders_must_have_customer_or_project';
  ELSE
    RAISE EXCEPTION '✗ FAILED: orders_must_have_customer_or_project constraint not found!';
  END IF;
END $$;

-- ============================================================================
-- CONSTRAINT 2: Order number format validation (ORD-XXXXXX)
-- ============================================================================

-- Add constraint to orders table
ALTER TABLE orders
ADD CONSTRAINT orders_number_format
CHECK (order_number ~ '^ORD-[0-9]{6}$');

-- Verification
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'orders_number_format'
  ) THEN
    RAISE NOTICE '✓ Constraint added: orders_number_format';
  ELSE
    RAISE EXCEPTION '✗ FAILED: orders_number_format constraint not found!';
  END IF;
END $$;

-- ============================================================================
-- CONSTRAINT 3: Positive amount constraints
-- ============================================================================

-- Add constraint to orders table (total_amount must be >= 0)
ALTER TABLE orders
ADD CONSTRAINT orders_total_amount_positive
CHECK (total_amount IS NULL OR total_amount >= 0);

-- Add constraint to orders table (deposit_amount must be >= 0)
ALTER TABLE orders
ADD CONSTRAINT orders_deposit_amount_positive
CHECK (deposit_amount IS NULL OR deposit_amount >= 0);

-- Add constraint to production_orders table (total_cost must be >= 0)
ALTER TABLE production_orders
ADD CONSTRAINT production_orders_total_cost_positive
CHECK (total_cost IS NULL OR total_cost >= 0);

-- Add constraint to production_orders table (deposit_amount must be >= 0)
ALTER TABLE production_orders
ADD CONSTRAINT production_orders_deposit_amount_positive
CHECK (deposit_amount IS NULL OR deposit_amount >= 0);

-- Verification
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'orders_total_amount_positive'
  ) THEN
    RAISE NOTICE '✓ Constraint added: orders_total_amount_positive';
  ELSE
    RAISE EXCEPTION '✗ FAILED: orders_total_amount_positive constraint not found!';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'orders_deposit_amount_positive'
  ) THEN
    RAISE NOTICE '✓ Constraint added: orders_deposit_amount_positive';
  ELSE
    RAISE EXCEPTION '✗ FAILED: orders_deposit_amount_positive constraint not found!';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'production_orders_total_cost_positive'
  ) THEN
    RAISE NOTICE '✓ Constraint added: production_orders_total_cost_positive';
  ELSE
    RAISE EXCEPTION '✗ FAILED: production_orders_total_cost_positive constraint not found!';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'production_orders_deposit_amount_positive'
  ) THEN
    RAISE NOTICE '✓ Constraint added: production_orders_deposit_amount_positive';
  ELSE
    RAISE EXCEPTION '✗ FAILED: production_orders_deposit_amount_positive constraint not found!';
  END IF;
END $$;

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================

DO $$
DECLARE
  constraint_count INTEGER;
BEGIN
  -- Count all new constraints
  SELECT COUNT(*) INTO constraint_count
  FROM information_schema.constraint_column_usage
  WHERE constraint_name IN (
    'orders_must_have_customer_or_project',
    'orders_number_format',
    'orders_total_amount_positive',
    'orders_deposit_amount_positive',
    'production_orders_total_cost_positive',
    'production_orders_deposit_amount_positive'
  );

  IF constraint_count = 6 THEN
    RAISE NOTICE '';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '✓ SUCCESS: All 6 constraints added successfully';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Constraints added:';
    RAISE NOTICE '  1. orders_must_have_customer_or_project';
    RAISE NOTICE '  2. orders_number_format';
    RAISE NOTICE '  3. orders_total_amount_positive';
    RAISE NOTICE '  4. orders_deposit_amount_positive';
    RAISE NOTICE '  5. production_orders_total_cost_positive';
    RAISE NOTICE '  6. production_orders_deposit_amount_positive';
    RAISE NOTICE '';
  ELSE
    RAISE EXCEPTION '✗ FAILED: Expected 6 constraints, found %', constraint_count;
  END IF;
END $$;

-- ============================================================================
-- TEST CASES (Optional - Uncomment to test constraints)
-- ============================================================================

/*
-- Test 1: Try to create order without customer_id or project_id (should FAIL)
-- INSERT INTO orders (order_number, status) VALUES ('ORD-999999', 'pending');
-- Expected: ERROR - violates check constraint "orders_must_have_customer_or_project"

-- Test 2: Try to create order with invalid number format (should FAIL)
-- INSERT INTO orders (order_number, customer_id, status) VALUES ('INVALID', uuid_generate_v4(), 'pending');
-- Expected: ERROR - violates check constraint "orders_number_format"

-- Test 3: Try to create order with negative amount (should FAIL)
-- INSERT INTO orders (order_number, customer_id, total_amount, status) VALUES ('ORD-999999', uuid_generate_v4(), -100.00, 'pending');
-- Expected: ERROR - violates check constraint "orders_total_amount_positive"

-- Test 4: Create valid order (should SUCCEED)
-- INSERT INTO orders (order_number, customer_id, total_amount, status) VALUES ('ORD-999999', uuid_generate_v4(), 100.00, 'pending');
-- Expected: Success

-- Clean up test data
-- DELETE FROM orders WHERE order_number = 'ORD-999999';
*/

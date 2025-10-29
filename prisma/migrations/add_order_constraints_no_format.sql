-- Migration: Add Database Constraints for Order System (Without Format Constraint)
-- Phase: 2 of 9 (Order System 100% Production Ready)
-- Date: 2025-10-28
-- Purpose: Add data integrity constraints at database level
-- NOTE: Removed order_number_format constraint due to multiple valid formats in use

-- ============================================================================
-- CONSTRAINT 1: Require either customer_id OR project_id (not both NULL)
-- ============================================================================

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
-- CONSTRAINT 2: Positive amount constraint for orders.total_amount
-- ============================================================================

ALTER TABLE orders
ADD CONSTRAINT orders_total_amount_positive
CHECK (total_amount IS NULL OR total_amount >= 0);

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
END $$;

-- ============================================================================
-- CONSTRAINT 3: Positive amount constraints for production_orders
-- ============================================================================

ALTER TABLE production_orders
ADD CONSTRAINT production_orders_total_cost_positive
CHECK (total_cost IS NULL OR total_cost >= 0);

ALTER TABLE production_orders
ADD CONSTRAINT production_orders_deposit_amount_positive
CHECK (deposit_amount IS NULL OR deposit_amount >= 0);

-- Verification
DO $$
BEGIN
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
  SELECT COUNT(*) INTO constraint_count
  FROM information_schema.constraint_column_usage
  WHERE constraint_name IN (
    'orders_must_have_customer_or_project',
    'orders_total_amount_positive',
    'production_orders_total_cost_positive',
    'production_orders_deposit_amount_positive'
  );

  IF constraint_count = 4 THEN
    RAISE NOTICE '';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '✓ SUCCESS: All 4 constraints added successfully';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Constraints added:';
    RAISE NOTICE '  1. orders_must_have_customer_or_project';
    RAISE NOTICE '  2. orders_total_amount_positive';
    RAISE NOTICE '  3. production_orders_total_cost_positive';
    RAISE NOTICE '  4. production_orders_deposit_amount_positive';
    RAISE NOTICE '';
    RAISE NOTICE 'NOTE: order_number format constraint was intentionally omitted';
    RAISE NOTICE '      due to multiple valid formats in use (ORD-YYYY-XXX, ORD-XXXXXX, etc)';
    RAISE NOTICE '';
  ELSE
    RAISE EXCEPTION '✗ FAILED: Expected 4 constraints, found %', constraint_count;
  END IF;
END $$;

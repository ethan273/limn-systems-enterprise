-- Migration: Drop unused clients table
-- Date: 2025-10-28
-- Purpose: Remove unused clients table (no relations, not used in application)
-- Part of: Order System 100% Production Ready Implementation

-- ============================================================================
-- SAFETY CHECKS
-- ============================================================================

-- Check if clients table has any data (should verify before dropping)
DO $$
DECLARE
  client_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO client_count FROM clients;

  IF client_count > 0 THEN
    RAISE NOTICE 'WARNING: clients table has % rows. Verify this data is not needed before dropping!', client_count;
  ELSE
    RAISE NOTICE 'clients table is empty. Safe to drop.';
  END IF;
END $$;

-- ============================================================================
-- DROP TABLE
-- ============================================================================

-- Drop indexes first (safer to drop in reverse order)
DROP INDEX IF EXISTS idx_clients_updated_at;
DROP INDEX IF EXISTS idx_clients_status;
DROP INDEX IF EXISTS idx_clients_created_at;

-- Drop the table (CASCADE will drop any dependent objects)
DROP TABLE IF EXISTS clients CASCADE;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify table no longer exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'clients'
  ) THEN
    RAISE EXCEPTION 'FAILED: clients table still exists!';
  ELSE
    RAISE NOTICE 'SUCCESS: clients table dropped successfully.';
  END IF;
END $$;

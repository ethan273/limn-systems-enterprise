-- ============================================================================
-- Create Flipbook Enum Types (Dev Database Fix)
-- ============================================================================
-- This migration creates enum types that exist in production but are missing
-- in the development database.
--
-- IMPORTANT: Apply this BEFORE 20251024_flipbook_rls_policies.sql
-- ============================================================================

-- Create flipbook_status enum if it doesn't exist
-- CRITICAL: Must be in PUBLIC schema to match Prisma schema definition
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'flipbook_status'
    AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.flipbook_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
    RAISE NOTICE 'Created flipbook_status enum in public schema';
  ELSE
    RAISE NOTICE 'flipbook_status enum already exists in public schema';
  END IF;
END$$;

-- Verify the enum was created
SELECT
  t.typname as enum_name,
  string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'flipbook_status'
GROUP BY t.typname;

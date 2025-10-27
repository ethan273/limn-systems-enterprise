-- Migration: Drop AI Generation Queue Table
-- Date: 2025-10-26
-- Reason: AI system not in use, user approved dropping AI tables
-- Impact: Removes unused table, reduces schema complexity
-- Tables affected: ai_generation_queue
-- Rollback: NOT REVERSIBLE - table and data will be permanently deleted

-- SAFETY CHECKS
DO $$
BEGIN
    -- Verify table exists before attempting drop
    IF EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'ai_generation_queue'
    ) THEN
        RAISE NOTICE 'Found ai_generation_queue table, proceeding with drop';
    ELSE
        RAISE NOTICE 'Table ai_generation_queue does not exist, skipping';
        RETURN;
    END IF;
END $$;

-- Drop foreign key constraints first (if they exist)
-- This table has FK to user_profiles, but we're dropping the table so the FK will be removed

-- Drop all indexes associated with the table (will be dropped automatically with table)
-- - idx_ai_generation_queue_created_at
-- - idx_ai_generation_queue_status
-- - idx_ai_generation_queue_updated_at
-- - idx_ai_generation_queue_user

-- Drop the table
DROP TABLE IF EXISTS public.ai_generation_queue CASCADE;

-- Verify successful deletion
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'ai_generation_queue'
    ) THEN
        RAISE NOTICE 'Successfully dropped ai_generation_queue table';
    ELSE
        RAISE EXCEPTION 'Failed to drop ai_generation_queue table';
    END IF;
END $$;

-- Migration complete
-- Next steps:
-- 1. Remove ai_generation_queue model from prisma/schema.prisma
-- 2. Run: npx prisma generate
-- 3. Verify build passes

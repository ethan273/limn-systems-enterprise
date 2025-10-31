-- ==================================================================================
-- PORTAL ACCESS MIGRATION: customer_portal_access → portal_access
-- ==================================================================================
--
-- Purpose: Migrate all data from legacy customer_portal_access table to modern
--          portal_access table with proper module-based permissions.
--
-- Author: Claude Code
-- Date: 2025-10-31
--
-- THIS SCRIPT IS IDEMPOTENT: Can be run multiple times safely
--
-- DATABASE REQUIREMENTS:
-- - Apply to BOTH dev and prod databases
-- - Run with database superuser or owner privileges
-- - Verify schema sync before running
--
-- BACKUP COMMAND (run before migration):
--   pg_dump $DATABASE_URL -t customer_portal_access -t portal_access > backup-portal-tables-$(date +%Y%m%d-%H%M%S).sql
--
-- ==================================================================================

BEGIN;

-- ==================================================================================
-- STEP 1: CREATE BACKUP TABLE
-- ==================================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'customer_portal_access_backup_20251031'
    ) THEN
        CREATE TABLE customer_portal_access_backup_20251031 AS
        SELECT * FROM customer_portal_access;

        RAISE NOTICE '✅ Created backup table: customer_portal_access_backup_20251031';
    ELSE
        RAISE NOTICE '⚠️  Backup table already exists: customer_portal_access_backup_20251031';
    END IF;
END $$;

-- ==================================================================================
-- STEP 2: DEFINE MODULE MAPPING FUNCTION
-- ==================================================================================

CREATE OR REPLACE FUNCTION map_portal_role_to_modules(
    p_portal_type TEXT,
    p_portal_role TEXT
) RETURNS JSONB AS $$
DECLARE
    v_modules JSONB;
BEGIN
    -- Map portal_role to allowed_modules based on portal type
    -- Role hierarchy: admin > editor > viewer

    CASE p_portal_type
        -- CUSTOMER PORTAL MODULES
        WHEN 'customer' THEN
            CASE p_portal_role
                WHEN 'admin' THEN
                    v_modules := '["orders", "documents", "financials", "shipping", "profile"]'::jsonb;
                WHEN 'editor' THEN
                    v_modules := '["orders", "documents", "shipping", "profile"]'::jsonb;
                WHEN 'viewer' THEN
                    v_modules := '["orders", "documents", "profile"]'::jsonb;
                ELSE
                    v_modules := '["profile"]'::jsonb;  -- Minimal access for unknown roles
            END CASE;

        -- DESIGNER PORTAL MODULES
        WHEN 'designer' THEN
            CASE p_portal_role
                WHEN 'admin' THEN
                    v_modules := '["projects", "submissions", "documents", "quality", "settings"]'::jsonb;
                WHEN 'editor' THEN
                    v_modules := '["projects", "submissions", "documents", "settings"]'::jsonb;
                WHEN 'viewer' THEN
                    v_modules := '["projects", "documents", "settings"]'::jsonb;
                ELSE
                    v_modules := '["settings"]'::jsonb;
            END CASE;

        -- FACTORY PORTAL MODULES
        WHEN 'factory' THEN
            CASE p_portal_role
                WHEN 'admin' THEN
                    v_modules := '["orders", "quality", "shipping", "documents", "settings"]'::jsonb;
                WHEN 'editor' THEN
                    v_modules := '["orders", "quality", "documents", "settings"]'::jsonb;
                WHEN 'viewer' THEN
                    v_modules := '["orders", "documents", "settings"]'::jsonb;
                ELSE
                    v_modules := '["settings"]'::jsonb;
            END CASE;

        -- QC PORTAL MODULES
        WHEN 'qc' THEN
            CASE p_portal_role
                WHEN 'admin' THEN
                    v_modules := '["inspections", "history", "upload", "documents", "settings"]'::jsonb;
                WHEN 'editor' THEN
                    v_modules := '["inspections", "upload", "documents", "settings"]'::jsonb;
                WHEN 'viewer' THEN
                    v_modules := '["inspections", "history", "settings"]'::jsonb;
                ELSE
                    v_modules := '["settings"]'::jsonb;
            END CASE;

        ELSE
            -- Unknown portal type - provide minimal access
            v_modules := '["profile"]'::jsonb;
    END CASE;

    RETURN v_modules;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DO $$
BEGIN
    RAISE NOTICE '✅ Created module mapping function: map_portal_role_to_modules()';
END $$;

-- ==================================================================================
-- STEP 2B: ADD UNIQUE INDEX (If it doesn't exist)
-- ==================================================================================

DO $$
BEGIN
    -- Check if unique index exists, if not create it
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'uq_portal_access_user_portal_customer_partner'
    ) THEN
        CREATE UNIQUE INDEX uq_portal_access_user_portal_customer_partner
        ON portal_access (user_id, portal_type, COALESCE(customer_id::text, ''), COALESCE(partner_id::text, ''));

        RAISE NOTICE '✅ Created unique index: uq_portal_access_user_portal_customer_partner';
    ELSE
        RAISE NOTICE '⚠️  Unique index already exists: uq_portal_access_user_portal_customer_partner';
    END IF;
END $$;

-- ==================================================================================
-- STEP 2C: CLEANUP ORPHANED RECORDS (users not in auth.users)
-- ==================================================================================

DELETE FROM customer_portal_access
WHERE user_id IS NOT NULL
AND user_id NOT IN (SELECT id FROM auth.users);

DO $$
BEGIN
    RAISE NOTICE '✅ Cleaned up orphaned portal access records';
END $$;

-- ==================================================================================
-- STEP 3: MIGRATE DATA TO portal_access TABLE
-- ==================================================================================

INSERT INTO portal_access (
    user_id,
    portal_type,
    allowed_modules,
    customer_id,
    partner_id,
    is_active,
    granted_by,
    granted_at,
    last_accessed_at,
    metadata,
    created_at,
    updated_at
)
SELECT
    cpa.user_id,
    COALESCE(cpa.portal_type, 'customer') AS portal_type,
    map_portal_role_to_modules(
        COALESCE(cpa.portal_type, 'customer'),
        COALESCE(cpa.portal_role, 'viewer')
    ) AS allowed_modules,
    cpa.customer_id,
    NULL AS partner_id,  -- Legacy data doesn't have partner_id
    COALESCE(cpa.is_active, true) AS is_active,
    cpa.invited_by AS granted_by,
    COALESCE(cpa.granted_at, cpa.accepted_at, cpa.created_at) AS granted_at,
    cpa.last_login AS last_accessed_at,
    jsonb_build_object(
        'migrated_from', 'customer_portal_access',
        'migration_date', NOW(),
        'original_portal_role', cpa.portal_role,
        'original_entity_type', cpa.entity_type,
        'original_entity_id', cpa.entity_id,
        'login_count', cpa.login_count,
        'invited_at', cpa.invited_at,
        'accepted_at', cpa.accepted_at
    ) AS metadata,
    cpa.created_at,
    GREATEST(cpa.updated_at, NOW()) AS updated_at
FROM customer_portal_access cpa
WHERE cpa.user_id IS NOT NULL  -- Only migrate records with valid user_id
ON CONFLICT (user_id, portal_type, COALESCE(customer_id::text, ''), COALESCE(partner_id::text, ''))
DO UPDATE SET
    -- Update existing records with latest data
    allowed_modules = EXCLUDED.allowed_modules,
    is_active = EXCLUDED.is_active,
    granted_by = COALESCE(portal_access.granted_by, EXCLUDED.granted_by),
    granted_at = LEAST(portal_access.granted_at, EXCLUDED.granted_at),
    last_accessed_at = GREATEST(portal_access.last_accessed_at, EXCLUDED.last_accessed_at),
    metadata = portal_access.metadata || EXCLUDED.metadata,
    updated_at = NOW();

-- Count migrated records
DO $$
DECLARE
    v_migrated_count INTEGER;
    v_source_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_source_count FROM customer_portal_access WHERE user_id IS NOT NULL;
    SELECT COUNT(*) INTO v_migrated_count FROM portal_access WHERE metadata->>'migrated_from' = 'customer_portal_access';

    RAISE NOTICE '✅ Migration complete:';
    RAISE NOTICE '   Source records (customer_portal_access): %', v_source_count;
    RAISE NOTICE '   Migrated records (portal_access): %', v_migrated_count;

    IF v_migrated_count < v_source_count THEN
        RAISE WARNING '⚠️  Some records may not have been migrated due to missing user_id';
    END IF;
END $$;

-- ==================================================================================
-- STEP 4: ADD MIGRATION TRACKING
-- ==================================================================================

-- Add comment to table documenting migration
COMMENT ON TABLE customer_portal_access IS 'DEPRECATED: Migrated to portal_access table on 2025-10-31. This table is kept for audit purposes only. DO NOT use for new features.';

COMMENT ON TABLE portal_access IS 'Modern portal access control system with module-based permissions. Replaces customer_portal_access table. Use this table for ALL new portal access features.';

DO $$
BEGIN
    RAISE NOTICE '✅ Added deprecation notice to customer_portal_access table';
END $$;

-- ==================================================================================
-- STEP 5: CREATE SYNC TRIGGER (Temporary Safety)
-- ==================================================================================

-- This trigger will sync writes to customer_portal_access to portal_access
-- Remove this trigger once all code is migrated to use portal_access

CREATE OR REPLACE FUNCTION sync_customer_portal_access_to_portal_access()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        INSERT INTO portal_access (
            user_id,
            portal_type,
            allowed_modules,
            customer_id,
            is_active,
            granted_by,
            granted_at,
            last_accessed_at,
            metadata,
            created_at,
            updated_at
        ) VALUES (
            NEW.user_id,
            COALESCE(NEW.portal_type, 'customer'),
            map_portal_role_to_modules(
                COALESCE(NEW.portal_type, 'customer'),
                COALESCE(NEW.portal_role, 'viewer')
            ),
            NEW.customer_id,
            COALESCE(NEW.is_active, true),
            NEW.invited_by,
            COALESCE(NEW.granted_at, NEW.accepted_at, NEW.created_at),
            NEW.last_login,
            jsonb_build_object(
                'synced_from', 'customer_portal_access',
                'sync_date', NOW(),
                'original_portal_role', NEW.portal_role
            ),
            NEW.created_at,
            NEW.updated_at
        )
        ON CONFLICT (user_id, portal_type, COALESCE(customer_id::text, ''), COALESCE(partner_id::text, ''))
        DO UPDATE SET
            allowed_modules = EXCLUDED.allowed_modules,
            is_active = EXCLUDED.is_active,
            last_accessed_at = EXCLUDED.last_accessed_at,
            updated_at = NOW();

        RAISE NOTICE 'Synced customer_portal_access record to portal_access for user: %', NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_to_portal_access ON customer_portal_access;
CREATE TRIGGER sync_to_portal_access
    AFTER INSERT OR UPDATE ON customer_portal_access
    FOR EACH ROW
    EXECUTE FUNCTION sync_customer_portal_access_to_portal_access();

DO $$
BEGIN
    RAISE NOTICE '✅ Created sync trigger: customer_portal_access → portal_access';
    RAISE NOTICE '⚠️  WARNING: This is a TEMPORARY safety measure. Remove after code migration complete.';
END $$;

-- ==================================================================================
-- STEP 6: VERIFICATION QUERIES
-- ==================================================================================

-- Run these queries to verify migration success

DO $$
DECLARE
    v_total_old INTEGER;
    v_total_new INTEGER;
    v_active_old INTEGER;
    v_active_new INTEGER;
    v_customer_old INTEGER;
    v_customer_new INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==================================================================================';
    RAISE NOTICE 'MIGRATION VERIFICATION';
    RAISE NOTICE '==================================================================================';

    -- Total records
    SELECT COUNT(*) INTO v_total_old FROM customer_portal_access WHERE user_id IS NOT NULL;
    SELECT COUNT(*) INTO v_total_new FROM portal_access;
    RAISE NOTICE 'Total Records:';
    RAISE NOTICE '  customer_portal_access: %', v_total_old;
    RAISE NOTICE '  portal_access:          %', v_total_new;

    -- Active records
    SELECT COUNT(*) INTO v_active_old FROM customer_portal_access WHERE user_id IS NOT NULL AND is_active = true;
    SELECT COUNT(*) INTO v_active_new FROM portal_access WHERE is_active = true;
    RAISE NOTICE 'Active Records:';
    RAISE NOTICE '  customer_portal_access: %', v_active_old;
    RAISE NOTICE '  portal_access:          %', v_active_new;

    -- Customer portal records
    SELECT COUNT(*) INTO v_customer_old FROM customer_portal_access WHERE user_id IS NOT NULL AND COALESCE(portal_type, 'customer') = 'customer';
    SELECT COUNT(*) INTO v_customer_new FROM portal_access WHERE portal_type = 'customer';
    RAISE NOTICE 'Customer Portal Records:';
    RAISE NOTICE '  customer_portal_access: %', v_customer_old;
    RAISE NOTICE '  portal_access:          %', v_customer_new;

    RAISE NOTICE '';
    RAISE NOTICE '✅ Verification complete. Review numbers above for accuracy.';
    RAISE NOTICE '==================================================================================';
END $$;

COMMIT;

-- ==================================================================================
-- POST-MIGRATION INSTRUCTIONS
-- ==================================================================================

-- After running this migration:
--
-- 1. ✅ Verify counts match between tables
-- 2. ✅ Test portal logins for all user types (customer, designer, factory, qc)
-- 3. ✅ Update code to use portal_access table (see Phase 2)
-- 4. ✅ Remove auth callback fallback logic (see Phase 3)
-- 5. ✅ Update admin UI to use portal_access page (see Phase 4)
-- 6. ✅ Run comprehensive tests
-- 7. ⚠️  Keep sync trigger until code migration complete
-- 8. ⚠️  Remove sync trigger once all code uses portal_access
-- 9. ⏰ Schedule customer_portal_access table removal for Q1 2026
--
-- TO REMOVE SYNC TRIGGER (after code migration):
--   DROP TRIGGER IF EXISTS sync_to_portal_access ON customer_portal_access;
--   DROP FUNCTION IF EXISTS sync_customer_portal_access_to_portal_access();
--
-- TO ROLLBACK MIGRATION (emergency only):
--   DELETE FROM portal_access WHERE metadata->>'migrated_from' = 'customer_portal_access';
--   DROP TRIGGER IF EXISTS sync_to_portal_access ON customer_portal_access;
--
-- ==================================================================================

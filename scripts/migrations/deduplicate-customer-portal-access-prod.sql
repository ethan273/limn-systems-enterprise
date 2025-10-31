-- ==================================================================================
-- PRODUCTION DEDUPLICATION: customer_portal_access
-- ==================================================================================
--
-- Purpose: Remove duplicate records before migration to portal_access
--
-- ISSUE: Production has 4 users with duplicate (user_id, portal_type, customer_id) records
-- SOLUTION: Keep the most recent record (highest created_at), delete older duplicates
--
-- THIS SCRIPT IS IDEMPOTENT: Can be run multiple times safely
--
-- ==================================================================================

BEGIN;

-- Create temporary table with records to DELETE (older duplicates)
CREATE TEMP TABLE duplicates_to_delete AS
SELECT id
FROM (
    SELECT
        id,
        user_id,
        portal_type,
        COALESCE(customer_id::text, '') as customer_id,
        ROW_NUMBER() OVER (
            PARTITION BY user_id, portal_type, COALESCE(customer_id::text, '')
            ORDER BY created_at DESC, updated_at DESC
        ) as rn
    FROM customer_portal_access
    WHERE user_id IS NOT NULL
) ranked
WHERE rn > 1;  -- Keep the first (most recent), delete the rest

-- Show what will be deleted
DO $$
DECLARE
    v_delete_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_delete_count FROM duplicates_to_delete;
    RAISE NOTICE '==================================================================================';
    RAISE NOTICE 'DEDUPLICATION SUMMARY';
    RAISE NOTICE '==================================================================================';
    RAISE NOTICE 'Records to delete (older duplicates): %', v_delete_count;
    RAISE NOTICE '';
END $$;

-- Show details of records being deleted
SELECT
    cpa.id,
    cpa.user_id,
    cpa.portal_type,
    cpa.portal_role,
    cpa.created_at,
    cpa.updated_at
FROM customer_portal_access cpa
INNER JOIN duplicates_to_delete d ON cpa.id = d.id
ORDER BY cpa.user_id, cpa.portal_type, cpa.created_at;

-- Delete older duplicates
DELETE FROM customer_portal_access
WHERE id IN (SELECT id FROM duplicates_to_delete);

-- Verify deduplication
DO $$
DECLARE
    v_remaining_dupes INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_remaining_dupes
    FROM (
        SELECT user_id, portal_type, COALESCE(customer_id::text, ''), COUNT(*) as count
        FROM customer_portal_access
        WHERE user_id IS NOT NULL
        GROUP BY user_id, portal_type, customer_id
        HAVING COUNT(*) > 1
    ) dupes;

    RAISE NOTICE '';
    RAISE NOTICE 'Remaining duplicates after cleanup: %', v_remaining_dupes;

    IF v_remaining_dupes > 0 THEN
        RAISE WARNING '⚠️  Still have duplicates! Manual investigation required.';
    ELSE
        RAISE NOTICE '✅ Deduplication complete. All duplicates removed.';
    END IF;
    RAISE NOTICE '==================================================================================';
END $$;

COMMIT;

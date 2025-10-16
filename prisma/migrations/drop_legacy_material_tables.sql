-- Drop Legacy Material Tables
-- This migration removes the old hierarchical material tables after
-- all data has been migrated to the unified materials table
-- Migration Date: 2025-10-16

-- Drop tables in reverse dependency order to avoid foreign key constraint errors

-- Fabric tables (drop colors first, then collections, then brands)
DROP TABLE IF EXISTS fabric_colors CASCADE;
DROP TABLE IF EXISTS fabric_collections CASCADE;
DROP TABLE IF EXISTS fabric_brands CASCADE;

-- Wood tables (drop finishes first, then types)
DROP TABLE IF EXISTS wood_finishes CASCADE;
DROP TABLE IF EXISTS wood_types CASCADE;

-- Metal tables (drop colors first, then finishes, then types)
DROP TABLE IF EXISTS metal_colors CASCADE;
DROP TABLE IF EXISTS metal_finishes CASCADE;
DROP TABLE IF EXISTS metal_types CASCADE;

-- Stone tables (drop finishes first, then types)
DROP TABLE IF EXISTS stone_finishes CASCADE;
DROP TABLE IF EXISTS stone_types CASCADE;

-- Style tables (no dependencies)
DROP TABLE IF EXISTS carving_styles CASCADE;
DROP TABLE IF EXISTS weaving_patterns CASCADE;

-- Verification: Check that tables have been dropped
SELECT COUNT(*) as remaining_legacy_tables
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'fabric_brands', 'fabric_collections', 'fabric_colors',
    'wood_types', 'wood_finishes',
    'metal_types', 'metal_finishes', 'metal_colors',
    'stone_types', 'stone_finishes',
    'carving_styles', 'weaving_patterns'
  );

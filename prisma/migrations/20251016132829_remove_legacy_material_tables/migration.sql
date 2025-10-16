-- Drop legacy material junction tables (no foreign keys to them)
DROP TABLE IF EXISTS "public"."carving_style_collections" CASCADE;
DROP TABLE IF EXISTS "public"."fabric_brand_collections" CASCADE;
DROP TABLE IF EXISTS "public"."fabric_collection_collections" CASCADE;
DROP TABLE IF EXISTS "public"."fabric_color_collections" CASCADE;
DROP TABLE IF EXISTS "public"."metal_color_collections" CASCADE;
DROP TABLE IF EXISTS "public"."metal_finish_collections" CASCADE;
DROP TABLE IF EXISTS "public"."metal_type_collections" CASCADE;
DROP TABLE IF EXISTS "public"."stone_finish_collections" CASCADE;
DROP TABLE IF EXISTS "public"."stone_type_collections" CASCADE;
DROP TABLE IF EXISTS "public"."weaving_color_collections" CASCADE;
DROP TABLE IF EXISTS "public"."weaving_material_collections" CASCADE;
DROP TABLE IF EXISTS "public"."weaving_pattern_collections" CASCADE;
DROP TABLE IF EXISTS "public"."wood_finish_collections" CASCADE;
DROP TABLE IF EXISTS "public"."wood_type_collections" CASCADE;

-- Drop legacy material core tables
DROP TABLE IF EXISTS "public"."fabric_colors" CASCADE;
DROP TABLE IF EXISTS "public"."fabric_collections" CASCADE;
DROP TABLE IF EXISTS "public"."fabric_brands" CASCADE;
DROP TABLE IF EXISTS "public"."wood_finishes" CASCADE;
DROP TABLE IF EXISTS "public"."wood_types" CASCADE;
DROP TABLE IF EXISTS "public"."metal_colors" CASCADE;
DROP TABLE IF EXISTS "public"."metal_finishes" CASCADE;
DROP TABLE IF EXISTS "public"."metal_types" CASCADE;
DROP TABLE IF EXISTS "public"."stone_finishes" CASCADE;
DROP TABLE IF EXISTS "public"."stone_types" CASCADE;
DROP TABLE IF EXISTS "public"."carving_styles" CASCADE;
DROP TABLE IF EXISTS "public"."weaving_colors" CASCADE;
DROP TABLE IF EXISTS "public"."weaving_materials" CASCADE;
DROP TABLE IF EXISTS "public"."weaving_patterns" CASCADE;

-- Drop legacy options tables
DROP TABLE IF EXISTS "public"."fabric_options" CASCADE;
DROP TABLE IF EXISTS "public"."wood_options" CASCADE;
DROP TABLE IF EXISTS "public"."metal_options" CASCADE;
DROP TABLE IF EXISTS "public"."stone_options" CASCADE;
DROP TABLE IF EXISTS "public"."carving_options" CASCADE;
DROP TABLE IF EXISTS "public"."weave_options" CASCADE;

-- Drop legacy reference tables
DROP TABLE IF EXISTS "public"."order_materials" CASCADE;
DROP TABLE IF EXISTS "public"."order_item_materials" CASCADE;
DROP TABLE IF EXISTS "public"."product_materials" CASCADE;

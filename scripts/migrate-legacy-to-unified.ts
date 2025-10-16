#!/usr/bin/env tsx
/**
 * Comprehensive Legacy Materials Migration
 *
 * Migrates ALL legacy material records from separate tables to unified materials table
 *
 * Legacy tables (163 records):
 * - fabric_brands, fabric_collections, fabric_colors
 * - wood_types, wood_finishes
 * - metal_types, metal_finishes, metal_colors
 * - stone_types, stone_finishes
 * - carving_styles, weaving_styles
 *
 * Target: unified materials table with proper hierarchy
 *
 * Run with: npx tsx scripts/migrate-legacy-to-unified.ts
 * Dry run: npx tsx scripts/migrate-legacy-to-unified.ts --dry-run
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DRY_RUN = process.argv.includes('--dry-run');

interface MigrationStats {
  fabricBrands: number;
  fabricCollections: number;
  fabricColors: number;
  woodTypes: number;
  woodFinishes: number;
  metalTypes: number;
  metalFinishes: number;
  metalColors: number;
  stoneTypes: number;
  stoneFinishes: number;
  carvingStyles: number;
  weavingStyles: number;
  errors: string[];
}

async function main() {
  console.log('🚀 Starting Comprehensive Legacy Materials Migration\n');
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (no changes will be made)' : '⚡ LIVE MIGRATION'}\n`);

  const stats: MigrationStats = {
    fabricBrands: 0,
    fabricCollections: 0,
    fabricColors: 0,
    woodTypes: 0,
    woodFinishes: 0,
    metalTypes: 0,
    metalFinishes: 0,
    metalColors: 0,
    stoneTypes: 0,
    stoneFinishes: 0,
    carvingStyles: 0,
    weavingStyles: 0,
    errors: [],
  };

  // Get all active collections for default assignments
  const collections = await prisma.collections.findMany({
    where: { is_active: true },
  });
  const allCollectionIds = collections.map(c => c.id);
  console.log(`✅ Found ${collections.length} active collections for assignment\n`);

  // Get material categories
  const fabricCategory = await prisma.material_categories.findFirst({
    where: { name: { contains: 'Fabric', mode: 'insensitive' } },
  });
  const woodCategory = await prisma.material_categories.findFirst({
    where: { name: { contains: 'Wood', mode: 'insensitive' } },
  });
  const metalCategory = await prisma.material_categories.findFirst({
    where: { name: { contains: 'Metal', mode: 'insensitive' } },
  });
  const stoneCategory = await prisma.material_categories.findFirst({
    where: { name: { contains: 'Stone', mode: 'insensitive' } },
  });
  const carvingCategory = await prisma.material_categories.findFirst({
    where: { name: { contains: 'Carving', mode: 'insensitive' } },
  });
  const weavingCategory = await prisma.material_categories.findFirst({
    where: { name: { contains: 'Weaving', mode: 'insensitive' } },
  });

  console.log('📋 Material Categories:');
  console.log(`   Fabric: ${fabricCategory?.id || 'NOT FOUND'}`);
  console.log(`   Wood: ${woodCategory?.id || 'NOT FOUND'}`);
  console.log(`   Metal: ${metalCategory?.id || 'NOT FOUND'}`);
  console.log(`   Stone: ${stoneCategory?.id || 'NOT FOUND'}`);
  console.log(`   Carving: ${carvingCategory?.id || 'NOT FOUND'}`);
  console.log(`   Weaving: ${weavingCategory?.id || 'NOT FOUND'}\n`);

  try {
    // FABRIC BRANDS (Level 1)
    console.log('🎨 Migrating Fabric Brands...');
    const fabricBrands = await prisma.fabric_brands.findMany();
    const brandIdMap = new Map<string, string>();

    for (const brand of fabricBrands) {
      try {
        if (!DRY_RUN && fabricCategory) {
          const material = await prisma.materials.create({
            data: {
              name: brand.name,
              code: `FAB-${brand.name.substring(0, 3).toUpperCase()}-${brand.id.substring(0, 4)}`,
              type: 'brand',
              description: brand.description,
              material_categories: {
                connect: { id: fabricCategory.id },
              },
              active: brand.active !== false,
              hierarchy_level: 1,
              hierarchy_path: brand.name,
              material_collections: {
                create: allCollectionIds.map(cid => ({ collection_id: cid })),
              },
            },
          });
          brandIdMap.set(brand.id, material.id);
          stats.fabricBrands++;
          console.log(`   ✅ ${brand.name}`);
        } else {
          console.log(`   [DRY RUN] Would migrate: ${brand.name}`);
          stats.fabricBrands++;
        }
      } catch (error) {
        stats.errors.push(`Fabric Brand ${brand.name}: ${error}`);
        console.log(`   ❌ ${brand.name}: ${error}`);
      }
    }

    // FABRIC COLLECTIONS (Level 2)
    console.log('\n🎨 Migrating Fabric Collections...');
    const fabricCollections = await prisma.fabric_collections.findMany();
    const collectionIdMap = new Map<string, string>();

    for (const collection of fabricCollections) {
      try {
        const parentId = collection.brand_id ? brandIdMap.get(collection.brand_id) : undefined;
        const parentPath = collection.brand_id ? fabricBrands.find(b => b.id === collection.brand_id)?.name : undefined;

        if (!DRY_RUN && fabricCategory) {
          const material = await prisma.materials.create({
            data: {
              name: collection.name,
              code: `FAB-${collection.name.substring(0, 3).toUpperCase()}-${collection.id.substring(0, 4)}`,
              type: 'collection',
              description: collection.description,
              material_categories: {
                connect: { id: fabricCategory.id },
              },
              active: collection.active !== false,
              hierarchy_level: 2,
              hierarchy_path: parentPath ? `${parentPath}/${collection.name}` : collection.name,
              materials: parentId ? { connect: { id: parentId } } : undefined,
              material_collections: {
                create: allCollectionIds.map(cid => ({ collection_id: cid })),
              },
            },
          });
          collectionIdMap.set(collection.id, material.id);
          stats.fabricCollections++;
          console.log(`   ✅ ${collection.name} ${parentId ? `(parent: ${parentPath})` : ''}`);
        } else {
          console.log(`   [DRY RUN] Would migrate: ${collection.name}`);
          stats.fabricCollections++;
        }
      } catch (error) {
        stats.errors.push(`Fabric Collection ${collection.name}: ${error}`);
        console.log(`   ❌ ${collection.name}: ${error}`);
      }
    }

    // FABRIC COLORS (Level 3)
    console.log('\n🎨 Migrating Fabric Colors...');
    const fabricColors = await prisma.fabric_colors.findMany();

    for (const color of fabricColors) {
      try {
        const parentId = color.collection_id ? collectionIdMap.get(color.collection_id) : undefined;
        const parentCollection = color.collection_id ? fabricCollections.find(c => c.id === color.collection_id) : undefined;
        const parentBrand = parentCollection?.brand_id ? fabricBrands.find(b => b.id === parentCollection.brand_id) : undefined;
        const parentPath = parentBrand && parentCollection ? `${parentBrand.name}/${parentCollection.name}` : parentCollection?.name;

        if (!DRY_RUN && fabricCategory) {
          await prisma.materials.create({
            data: {
              name: color.name,
              code: `FAB-${color.name.substring(0, 3).toUpperCase()}-${color.id.substring(0, 4)}`,
              type: 'color',
              description: color.description,
              material_categories: { connect: { id: fabricCategory.id } },
              active: color.active !== false,
              hierarchy_level: 3,
              hierarchy_path: parentPath ? `${parentPath}/${color.name}` : color.name,
              materials: parentId ? { connect: { id: parentId } } : undefined,
              cost_per_unit: color.price_modifier,
              material_collections: {
                create: allCollectionIds.map(cid => ({ collection_id: cid })),
              },
            },
          });
          stats.fabricColors++;
          console.log(`   ✅ ${color.name} ${parentId ? `(parent: ${parentCollection?.name})` : ''}`);
        } else {
          console.log(`   [DRY RUN] Would migrate: ${color.name}`);
          stats.fabricColors++;
        }
      } catch (error) {
        stats.errors.push(`Fabric Color ${color.name}: ${error}`);
        console.log(`   ❌ ${color.name}: ${error}`);
      }
    }

    // WOOD TYPES (Level 1)
    console.log('\n🌲 Migrating Wood Types...');
    const woodTypes = await prisma.wood_types.findMany();
    const woodTypeIdMap = new Map<string, string>();

    for (const type of woodTypes) {
      try {
        if (!DRY_RUN && woodCategory) {
          const material = await prisma.materials.create({
            data: {
              name: type.name,
              code: `WOOD-${type.name.substring(0, 3).toUpperCase()}-${type.id.substring(0, 4)}`,
              type: 'type',
              description: type.description,
              material_categories: { connect: { id: woodCategory.id } },
              active: type.active !== false,
              hierarchy_level: 1,
              hierarchy_path: type.name,
              cost_per_unit: type.price_modifier,
              material_collections: {
                create: allCollectionIds.map(cid => ({ collection_id: cid })),
              },
            },
          });
          woodTypeIdMap.set(type.id, material.id);
          stats.woodTypes++;
          console.log(`   ✅ ${type.name}`);
        } else {
          console.log(`   [DRY RUN] Would migrate: ${type.name}`);
          stats.woodTypes++;
        }
      } catch (error) {
        stats.errors.push(`Wood Type ${type.name}: ${error}`);
        console.log(`   ❌ ${type.name}: ${error}`);
      }
    }

    // WOOD FINISHES (Level 2)
    console.log('\n🌲 Migrating Wood Finishes...');
    const woodFinishes = await prisma.wood_finishes.findMany();

    for (const finish of woodFinishes) {
      try {
        const parentId = finish.wood_type_id ? woodTypeIdMap.get(finish.wood_type_id) : undefined;
        const parentName = finish.wood_type_id ? woodTypes.find(t => t.id === finish.wood_type_id)?.name : undefined;

        if (!DRY_RUN && woodCategory) {
          await prisma.materials.create({
            data: {
              name: finish.name,
              code: `WOOD-${finish.name.substring(0, 3).toUpperCase()}-${finish.id.substring(0, 4)}`,
              type: 'finish',
              description: finish.description,
              material_categories: { connect: { id: woodCategory.id } },
              active: finish.active !== false,
              hierarchy_level: 2,
              hierarchy_path: parentName ? `${parentName}/${finish.name}` : finish.name,
              materials: parentId ? { connect: { id: parentId } } : undefined,
              cost_per_unit: finish.price_modifier,
              material_collections: {
                create: allCollectionIds.map(cid => ({ collection_id: cid })),
              },
            },
          });
          stats.woodFinishes++;
          console.log(`   ✅ ${finish.name} ${parentId ? `(parent: ${parentName})` : ''}`);
        } else {
          console.log(`   [DRY RUN] Would migrate: ${finish.name}`);
          stats.woodFinishes++;
        }
      } catch (error) {
        stats.errors.push(`Wood Finish ${finish.name}: ${error}`);
        console.log(`   ❌ ${finish.name}: ${error}`);
      }
    }

    // METAL TYPES (Level 1)
    console.log('\n⚙️ Migrating Metal Types...');
    const metalTypes = await prisma.metal_types.findMany();
    const metalTypeIdMap = new Map<string, string>();

    for (const type of metalTypes) {
      try {
        if (!DRY_RUN && metalCategory) {
          const material = await prisma.materials.create({
            data: {
              name: type.name,
              code: `MET-${type.name.substring(0, 3).toUpperCase()}-${type.id.substring(0, 4)}`,
              type: 'type',
              description: type.description,
              material_categories: { connect: { id: metalCategory.id } },
              active: type.active !== false,
              hierarchy_level: 1,
              hierarchy_path: type.name,
              cost_per_unit: type.price_modifier,
              material_collections: {
                create: allCollectionIds.map(cid => ({ collection_id: cid })),
              },
            },
          });
          metalTypeIdMap.set(type.id, material.id);
          stats.metalTypes++;
          console.log(`   ✅ ${type.name}`);
        } else {
          console.log(`   [DRY RUN] Would migrate: ${type.name}`);
          stats.metalTypes++;
        }
      } catch (error) {
        stats.errors.push(`Metal Type ${type.name}: ${error}`);
        console.log(`   ❌ ${type.name}: ${error}`);
      }
    }

    // METAL FINISHES (Level 2)
    console.log('\n⚙️ Migrating Metal Finishes...');
    const metalFinishes = await prisma.metal_finishes.findMany();
    const metalFinishIdMap = new Map<string, string>();

    for (const finish of metalFinishes) {
      try {
        const parentId = finish.metal_type_id ? metalTypeIdMap.get(finish.metal_type_id) : undefined;
        const parentName = finish.metal_type_id ? metalTypes.find(t => t.id === finish.metal_type_id)?.name : undefined;

        if (!DRY_RUN && metalCategory) {
          const material = await prisma.materials.create({
            data: {
              name: finish.name,
              code: `MET-${finish.name.substring(0, 3).toUpperCase()}-${finish.id.substring(0, 4)}`,
              type: 'finish',
              description: finish.description,
              material_categories: { connect: { id: metalCategory.id } },
              active: finish.active !== false,
              hierarchy_level: 2,
              hierarchy_path: parentName ? `${parentName}/${finish.name}` : finish.name,
              materials: parentId ? { connect: { id: parentId } } : undefined,
              cost_per_unit: finish.price_modifier,
              material_collections: {
                create: allCollectionIds.map(cid => ({ collection_id: cid })),
              },
            },
          });
          metalFinishIdMap.set(finish.id, material.id);
          stats.metalFinishes++;
          console.log(`   ✅ ${finish.name} ${parentId ? `(parent: ${parentName})` : ''}`);
        } else {
          console.log(`   [DRY RUN] Would migrate: ${finish.name}`);
          stats.metalFinishes++;
        }
      } catch (error) {
        stats.errors.push(`Metal Finish ${finish.name}: ${error}`);
        console.log(`   ❌ ${finish.name}: ${error}`);
      }
    }

    // METAL COLORS (Level 3)
    console.log('\n⚙️ Migrating Metal Colors...');
    const metalColors = await prisma.metal_colors.findMany();

    for (const color of metalColors) {
      try {
        const parentId = color.metal_finish_id ? metalFinishIdMap.get(color.metal_finish_id) : undefined;
        const parentFinish = color.metal_finish_id ? metalFinishes.find(f => f.id === color.metal_finish_id) : undefined;
        const parentType = parentFinish?.metal_type_id ? metalTypes.find(t => t.id === parentFinish.metal_type_id) : undefined;
        const parentPath = parentType && parentFinish ? `${parentType.name}/${parentFinish.name}` : parentFinish?.name;

        if (!DRY_RUN && metalCategory) {
          await prisma.materials.create({
            data: {
              name: color.name,
              code: `MET-${color.name.substring(0, 3).toUpperCase()}-${color.id.substring(0, 4)}`,
              type: 'color',
              description: color.description,
              material_categories: { connect: { id: metalCategory.id } },
              active: color.active !== false,
              hierarchy_level: 3,
              hierarchy_path: parentPath ? `${parentPath}/${color.name}` : color.name,
              materials: parentId ? { connect: { id: parentId } } : undefined,
              cost_per_unit: color.price_modifier,
              material_collections: {
                create: allCollectionIds.map(cid => ({ collection_id: cid })),
              },
            },
          });
          stats.metalColors++;
          console.log(`   ✅ ${color.name} ${parentId ? `(parent: ${parentFinish?.name})` : ''}`);
        } else {
          console.log(`   [DRY RUN] Would migrate: ${color.name}`);
          stats.metalColors++;
        }
      } catch (error) {
        stats.errors.push(`Metal Color ${color.name}: ${error}`);
        console.log(`   ❌ ${color.name}: ${error}`);
      }
    }

    // STONE TYPES (Level 1)
    console.log('\n🗿 Migrating Stone Types...');
    const stoneTypes = await prisma.stone_types.findMany();
    const stoneTypeIdMap = new Map<string, string>();

    for (const type of stoneTypes) {
      try {
        if (!DRY_RUN && stoneCategory) {
          const material = await prisma.materials.create({
            data: {
              name: type.name,
              code: `STONE-${type.name.substring(0, 3).toUpperCase()}-${type.id.substring(0, 4)}`,
              type: 'type',
              description: type.description,
              material_categories: { connect: { id: stoneCategory.id } },
              active: type.active !== false,
              hierarchy_level: 1,
              hierarchy_path: type.name,
              cost_per_unit: type.price_modifier,
              material_collections: {
                create: allCollectionIds.map(cid => ({ collection_id: cid })),
              },
            },
          });
          stoneTypeIdMap.set(type.id, material.id);
          stats.stoneTypes++;
          console.log(`   ✅ ${type.name}`);
        } else {
          console.log(`   [DRY RUN] Would migrate: ${type.name}`);
          stats.stoneTypes++;
        }
      } catch (error) {
        stats.errors.push(`Stone Type ${type.name}: ${error}`);
        console.log(`   ❌ ${type.name}: ${error}`);
      }
    }

    // STONE FINISHES (Level 2)
    console.log('\n🗿 Migrating Stone Finishes...');
    const stoneFinishes = await prisma.stone_finishes.findMany();

    for (const finish of stoneFinishes) {
      try {
        const parentId = finish.stone_type_id ? stoneTypeIdMap.get(finish.stone_type_id) : undefined;
        const parentName = finish.stone_type_id ? stoneTypes.find(t => t.id === finish.stone_type_id)?.name : undefined;

        if (!DRY_RUN && stoneCategory) {
          await prisma.materials.create({
            data: {
              name: finish.name,
              code: `STONE-${finish.name.substring(0, 3).toUpperCase()}-${finish.id.substring(0, 4)}`,
              type: 'finish',
              description: finish.description,
              material_categories: { connect: { id: stoneCategory.id } },
              active: finish.active !== false,
              hierarchy_level: 2,
              hierarchy_path: parentName ? `${parentName}/${finish.name}` : finish.name,
              materials: parentId ? { connect: { id: parentId } } : undefined,
              cost_per_unit: finish.price_modifier,
              material_collections: {
                create: allCollectionIds.map(cid => ({ collection_id: cid })),
              },
            },
          });
          stats.stoneFinishes++;
          console.log(`   ✅ ${finish.name} ${parentId ? `(parent: ${parentName})` : ''}`);
        } else {
          console.log(`   [DRY RUN] Would migrate: ${finish.name}`);
          stats.stoneFinishes++;
        }
      } catch (error) {
        stats.errors.push(`Stone Finish ${finish.name}: ${error}`);
        console.log(`   ❌ ${finish.name}: ${error}`);
      }
    }

    // CARVING STYLES (Level 1)
    console.log('\n✨ Migrating Carving Styles...');
    const carvingStyles = await prisma.carving_styles.findMany();

    for (const style of carvingStyles) {
      try {
        if (!DRY_RUN && carvingCategory) {
          await prisma.materials.create({
            data: {
              name: style.name,
              code: `CARV-${style.name.substring(0, 3).toUpperCase()}-${style.id.substring(0, 4)}`,
              type: 'style',
              description: style.description,
              material_categories: { connect: { id: carvingCategory.id } },
              active: style.active !== false,
              hierarchy_level: 1,
              hierarchy_path: style.name,
              cost_per_unit: style.price_modifier,
              material_collections: {
                create: allCollectionIds.map(cid => ({ collection_id: cid })),
              },
            },
          });
          stats.carvingStyles++;
          console.log(`   ✅ ${style.name}`);
        } else {
          console.log(`   [DRY RUN] Would migrate: ${style.name}`);
          stats.carvingStyles++;
        }
      } catch (error) {
        stats.errors.push(`Carving Style ${style.name}: ${error}`);
        console.log(`   ❌ ${style.name}: ${error}`);
      }
    }

    // Print Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN' : '⚡ LIVE'}\n`);

    const total = stats.fabricBrands + stats.fabricCollections + stats.fabricColors +
                  stats.woodTypes + stats.woodFinishes +
                  stats.metalTypes + stats.metalFinishes + stats.metalColors +
                  stats.stoneTypes + stats.stoneFinishes +
                  stats.carvingStyles + stats.weavingStyles;

    console.log('Migrated:');
    console.log(`   Fabric Brands: ${stats.fabricBrands}`);
    console.log(`   Fabric Collections: ${stats.fabricCollections}`);
    console.log(`   Fabric Colors: ${stats.fabricColors}`);
    console.log(`   Wood Types: ${stats.woodTypes}`);
    console.log(`   Wood Finishes: ${stats.woodFinishes}`);
    console.log(`   Metal Types: ${stats.metalTypes}`);
    console.log(`   Metal Finishes: ${stats.metalFinishes}`);
    console.log(`   Metal Colors: ${stats.metalColors}`);
    console.log(`   Stone Types: ${stats.stoneTypes}`);
    console.log(`   Stone Finishes: ${stats.stoneFinishes}`);
    console.log(`   Carving Styles: ${stats.carvingStyles}`);
    console.log(`   Weaving Styles: ${stats.weavingStyles}`);
    console.log(`   ─────────────`);
    console.log(`   TOTAL: ${total}`);

    if (stats.errors.length > 0) {
      console.log(`\n❌ Errors: ${stats.errors.length}`);
      stats.errors.forEach(err => console.log(`   - ${err}`));
    }

    if (DRY_RUN) {
      console.log('\n🔍 DRY RUN COMPLETE - No changes were made');
      console.log('   Run without --dry-run flag to execute migration');
    } else {
      console.log('\n✅ MIGRATION COMPLETE!');

      // Verification
      const finalCount = await prisma.materials.count();
      console.log(`\n✨ Unified materials table now has ${finalCount} records`);
    }

  } catch (error) {
    console.error('\n💥 Fatal error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });

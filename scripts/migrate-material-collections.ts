#!/usr/bin/env tsx
/**
 * Material Collection Association Migration Script
 *
 * Purpose: Set up initial collection associations for existing materials
 *
 * Strategy:
 * 1. Materials without collection associations → assign to ALL collections
 * 2. Materials with children → propagate collections to children (following fabric rules)
 * 3. Log all changes for review
 *
 * Business Rules:
 * - Fabric Brands → Collections can differ from parent
 * - Fabric Collections → Colors must inherit
 * - All other materials → Full inheritance enforced
 *
 * Run: npx tsx scripts/migrate-material-collections.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MigrationResult {
  materialsProcessed: number;
  associationsCreated: number;
  errors: string[];
  changes: Array<{
    materialId: string;
    materialName: string;
    action: string;
    collections: string[];
  }>;
}

async function main() {
  console.log('🚀 Starting Material Collection Association Migration\n');

  const result: MigrationResult = {
    materialsProcessed: 0,
    associationsCreated: 0,
    errors: [],
    changes: [],
  };

  try {
    // Step 1: Fetch all active collections
    const collections = await prisma.collections.findMany({
      where: { is_active: true },
      select: { id: true, name: true, prefix: true },
    });

    console.log(`✅ Found ${collections.length} active collections:`);
    collections.forEach(c => console.log(`   - ${c.name} (${c.prefix})`));
    console.log('');

    if (collections.length === 0) {
      console.log('⚠️  No active collections found. Exiting.');
      return result;
    }

    const allCollectionIds = collections.map(c => c.id);

    // Step 2: Fetch all materials with their current associations and hierarchy
    const materials = await prisma.materials.findMany({
      where: { active: true },
      include: {
        material_collections: {
          include: {
            collections: { select: { name: true } },
          },
        },
        material_categories: { select: { name: true } },
        materials: { // parent
          include: {
            material_collections: {
              include: {
                collections: { select: { name: true } },
              },
            },
            material_categories: { select: { name: true } },
          },
        },
      },
      orderBy: [
        { hierarchy_level: 'asc' }, // Process parents first
        { created_at: 'asc' },
      ],
    });

    console.log(`📦 Found ${materials.length} active materials to process\n`);

    // Step 3: Process each material
    for (const material of materials) {
      result.materialsProcessed++;

      const currentCollections = material.material_collections || [];
      const hasCollections = currentCollections.length > 0;
      const parent = material.materials;
      const categoryName = material.material_categories?.name?.toLowerCase() || '';
      const parentCategoryName = parent?.material_categories?.name?.toLowerCase() || '';

      // Determine if this is a fabric material
      const isFabric = categoryName.includes('fabric');
      const parentIsFabric = parentCategoryName.includes('fabric');

      // Determine hierarchy level rules
      const isFabricBrand = isFabric && material.hierarchy_level === 1;
      const isFabricCollection = isFabric && material.hierarchy_level === 2 && parentIsFabric;
      const isFabricColor = isFabric && material.hierarchy_level === 3 && parentIsFabric;

      let collectionsToAssign: string[] = [];
      let action = '';

      // Case 1: Material already has collections - skip
      if (hasCollections) {
        console.log(`⏭️  Skipping ${material.name} (${material.hierarchy_level}) - already has ${currentCollections.length} collection(s)`);
        continue;
      }

      // Case 2: Top-level material (Level 1) with no collections - assign ALL
      if (!parent && material.hierarchy_level === 1) {
        collectionsToAssign = allCollectionIds;
        action = 'Assigned ALL collections (top-level material)';
      }
      // Case 3: Fabric Collection (child of Fabric Brand) - assign ALL (can be customized later)
      else if (isFabricCollection && parent) {
        collectionsToAssign = allCollectionIds;
        action = 'Assigned ALL collections (Fabric Collection - can be customized)';
      }
      // Case 4: Fabric Color (child of Fabric Collection) - inherit from parent
      else if (isFabricColor && parent) {
        const parentCollections = parent.material_collections || [];
        if (parentCollections.length > 0) {
          collectionsToAssign = parentCollections.map(pc => pc.collection_id);
          action = `Inherited ${collectionsToAssign.length} collection(s) from parent`;
        } else {
          // Parent has no collections, assign all for now
          collectionsToAssign = allCollectionIds;
          action = 'Assigned ALL collections (parent has no collections yet)';
        }
      }
      // Case 5: Other child materials - inherit from parent
      else if (parent && material.hierarchy_level > 1) {
        const parentCollections = parent.material_collections || [];
        if (parentCollections.length > 0) {
          collectionsToAssign = parentCollections.map(pc => pc.collection_id);
          action = `Inherited ${collectionsToAssign.length} collection(s) from parent`;
        } else {
          // Parent has no collections, assign all for now
          collectionsToAssign = allCollectionIds;
          action = 'Assigned ALL collections (parent has no collections yet)';
        }
      }
      // Case 6: Other materials without parent - assign ALL
      else {
        collectionsToAssign = allCollectionIds;
        action = 'Assigned ALL collections (orphan material)';
      }

      // Apply the associations
      if (collectionsToAssign.length > 0) {
        try {
          await prisma.material_collections.createMany({
            data: collectionsToAssign.map(collectionId => ({
              material_id: material.id,
              collection_id: collectionId,
              created_at: new Date(),
            })),
            skipDuplicates: true,
          });

          result.associationsCreated += collectionsToAssign.length;

          const collectionNames = collections
            .filter(c => collectionsToAssign.includes(c.id))
            .map(c => c.name);

          result.changes.push({
            materialId: material.id,
            materialName: material.name,
            action,
            collections: collectionNames,
          });

          console.log(`✅ ${material.name} (Level ${material.hierarchy_level}): ${action}`);
          console.log(`   Collections: ${collectionNames.join(', ')}`);
          console.log('');
        } catch (error) {
          const errorMsg = `Failed to assign collections to ${material.name}: ${error}`;
          result.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}\n`);
        }
      }
    }

    // Step 4: Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`Materials Processed: ${result.materialsProcessed}`);
    console.log(`Associations Created: ${result.associationsCreated}`);
    console.log(`Materials Modified: ${result.changes.length}`);
    console.log(`Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      result.errors.forEach(err => console.log(`   - ${err}`));
    }

    console.log('\n✅ Migration completed successfully!\n');

    // Step 5: Verification query
    console.log('🔍 Running verification query...\n');

    const materialsWithCollections = await prisma.materials.count({
      where: {
        active: true,
        material_collections: { some: {} },
      },
    });

    const materialsWithoutCollections = await prisma.materials.count({
      where: {
        active: true,
        material_collections: { none: {} },
      },
    });

    console.log(`Materials WITH collection associations: ${materialsWithCollections}`);
    console.log(`Materials WITHOUT collection associations: ${materialsWithoutCollections}`);

    if (materialsWithoutCollections > 0) {
      console.log('\n⚠️  Some materials still have no collection associations.');
      console.log('   These will be available in ALL collections by default.');
    }

  } catch (error) {
    console.error('💥 Fatal error during migration:', error);
    result.errors.push(`Fatal error: ${error}`);
  } finally {
    await prisma.$disconnect();
  }

  return result;
}

// Run the migration
main()
  .then((result) => {
    console.log('\n✅ Script completed.');
    if (result.errors.length > 0) {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });

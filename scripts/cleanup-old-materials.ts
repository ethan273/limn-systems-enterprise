/**
 * Cleanup Script: Remove Old Materials Without Hierarchy
 *
 * This script removes materials that were created by the old seed script (faker data)
 * which don't have proper parent-child relationships (parent_material_id is null AND
 * they don't have any children).
 *
 * Keeps:
 * - Materials with parent_material_id set (child materials)
 * - Materials that have children (parent materials)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Starting materials cleanup...\n');

  // Step 1: Get all materials
  console.log('📊 Step 1: Analyzing materials...');
  const allMaterials = await prisma.materials.findMany({
    select: {
      id: true,
      name: true,
      parent_material_id: true,
      hierarchy_level: true,
      code: true,
    },
  });

  console.log(`   Total materials: ${allMaterials.length}`);

  // Step 2: Find materials WITH hierarchy (keep these)
  const materialsWithParent = allMaterials.filter((m) => m.parent_material_id !== null);
  console.log(`   Materials with parent: ${materialsWithParent.length}`);

  const parentIds = new Set(allMaterials.map((m) => m.parent_material_id).filter(Boolean));
  const materialsWithChildren = allMaterials.filter((m) => parentIds.has(m.id));
  console.log(`   Materials with children: ${materialsWithChildren.length}`);

  // Also keep materials with a 'code' field (these are from hierarchical seed)
  const materialsWithCode = allMaterials.filter((m) => m.code !== null);
  console.log(`   Materials with code: ${materialsWithCode.length}`);

  // Materials to keep: has parent OR has children OR has code (hierarchical seed marker)
  const materialsToKeep = new Set([
    ...materialsWithParent.map((m) => m.id),
    ...materialsWithChildren.map((m) => m.id),
    ...materialsWithCode.map((m) => m.id),
  ]);

  console.log(`   Total materials to keep: ${materialsToKeep.size}`);

  // Step 3: Find materials to delete (no parent AND no children)
  const materialsToDelete = allMaterials.filter((m) => !materialsToKeep.has(m.id));

  console.log(`\n🗑️  Materials to delete: ${materialsToDelete.length}`);

  if (materialsToDelete.length === 0) {
    console.log('\n✅ No materials to delete. All materials have proper hierarchy!');
    return;
  }

  console.log('\n   Sample materials to be deleted:');
  materialsToDelete.slice(0, 5).forEach((m) => {
    console.log(`     - ${m.name} (ID: ${m.id.substring(0, 8)}...)`);
  });
  if (materialsToDelete.length > 5) {
    console.log(`     ... and ${materialsToDelete.length - 5} more`);
  }

  // Step 4: Delete old materials
  console.log('\n🔥 Step 2: Deleting old materials...');

  const materialIds = materialsToDelete.map((m) => m.id);

  // First delete from material_furniture_collections (junction table)
  const deletedJunctions = await prisma.material_furniture_collections.deleteMany({
    where: {
      material_id: {
        in: materialIds,
      },
    },
  });
  console.log(`   ✓ Deleted ${deletedJunctions.count} material-collection assignments`);

  // Then delete the materials themselves
  const deletedMaterials = await prisma.materials.deleteMany({
    where: {
      id: {
        in: materialIds,
      },
    },
  });
  console.log(`   ✓ Deleted ${deletedMaterials.count} materials`);

  // Step 5: Verify results
  console.log('\n✅ Cleanup completed successfully!\n');

  const remainingMaterials = await prisma.materials.count();
  console.log('📊 Final Summary:');
  console.log(`   Remaining materials: ${remainingMaterials}`);

  const withParent = await prisma.materials.count({ where: { parent_material_id: { not: null } } });
  console.log(`   - With parent: ${withParent}`);
  console.log(`   - Top-level (no parent): ${remainingMaterials - withParent}`);

  console.log('\n   All remaining materials have proper hierarchical relationships! ✨');
}

main()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

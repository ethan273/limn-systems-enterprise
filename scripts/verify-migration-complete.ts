#!/usr/bin/env tsx
/**
 * Verify Migration Completion
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verifying Migration Completion...\n');

  // Count materials with migration code patterns
  const migratedMaterials = await prisma.materials.count({
    where: {
      OR: [
        { code: { startsWith: 'FAB-' } },
        { code: { startsWith: 'WOOD-' } },
        { code: { startsWith: 'MET-' } },
        { code: { startsWith: 'STONE-' } },
        { code: { startsWith: 'CARV-' } },
      ],
    },
  });

  console.log(`✅ Migrated materials (with new code format): ${migratedMaterials}`);

  // Count by category
  const fabricCount = await prisma.materials.count({ where: { code: { startsWith: 'FAB-' } } });
  const woodCount = await prisma.materials.count({ where: { code: { startsWith: 'WOOD-' } } });
  const metalCount = await prisma.materials.count({ where: { code: { startsWith: 'MET-' } } });
  const stoneCount = await prisma.materials.count({ where: { code: { startsWith: 'STONE-' } } });
  const carvingCount = await prisma.materials.count({ where: { code: { startsWith: 'CARV-' } } });

  console.log('\n📊 Breakdown:');
  console.log(`   Fabric (FAB-*): ${fabricCount} (expected: 5+7+11 = 23)`);
  console.log(`   Wood (WOOD-*): ${woodCount} (expected: 7+42 = 49)`);
  console.log(`   Metal (MET-*): ${metalCount} (expected: 7+28+30 = 65)`);
  console.log(`   Stone (STONE-*): ${stoneCount} (expected: 6+12 = 18)`);
  console.log(`   Carving (CARV-*): ${carvingCount} (expected: 8)`);
  console.log(`   ─────────────`);
  console.log(`   Total migrated: ${migratedMaterials} (expected: 163)`);

  const totalMaterials = await prisma.materials.count();
  const originalMaterials = totalMaterials - migratedMaterials;
  console.log(`\n   Original materials: ${originalMaterials}`);
  console.log(`   Total materials: ${totalMaterials}\n`);

  if (migratedMaterials === 163) {
    console.log('✅ MIGRATION COMPLETE: All 163 legacy records successfully migrated!');
  } else if (migratedMaterials < 163) {
    console.log(`⚠️  INCOMPLETE: ${163 - migratedMaterials} records not migrated`);
  } else {
    console.log(`⚠️  WARNING: More records migrated than expected (${migratedMaterials - 163} extra)`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

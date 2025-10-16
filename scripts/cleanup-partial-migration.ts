#!/usr/bin/env tsx
/**
 * Cleanup Partial Migration Data
 * Removes materials that were created during failed migration attempts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking for partial migration data...\n');

  // Count current materials
  const currentCount = await prisma.materials.count();
  console.log(`Current materials count: ${currentCount}`);

  // Find materials created in the last 24 hours (partial migration)
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const migrationMaterials = await prisma.materials.findMany({
    where: {
      created_at: {
        gte: oneDayAgo,
      },
      // Exclude materials that have specific known codes from manual creation
      NOT: {
        code: {
          in: ['MAT001', 'MAT002', 'MAT003'], // Add any manually created codes here
        },
      },
    },
    select: { id: true, name: true, code: true, created_at: true },
    orderBy: { created_at: 'desc' },
  });

  console.log(`\nFound ${migrationMaterials.length} materials created in last 24 hours\n`);

  if (migrationMaterials.length > 0) {
    console.log('⚠️  Would you like to delete these? (This script requires --confirm flag)');

    if (process.argv.includes('--confirm')) {
      console.log('\n🗑️  Deleting partial migration data...');

      // Delete material_collections associations first
      await prisma.material_collections.deleteMany({
        where: {
          material_id: { in: migrationMaterials.map(m => m.id) },
        },
      });

      // Delete materials
      const result = await prisma.materials.deleteMany({
        where: {
          id: { in: migrationMaterials.map(m => m.id) },
        },
      });

      console.log(`✅ Deleted ${result.count} materials from partial migration`);
    } else {
      console.log('\nSample of materials that would be deleted:');
      migrationMaterials.slice(0, 10).forEach(m => {
        console.log(`   - ${m.name} (${m.code})`);
      });
      console.log(`\nRun with --confirm flag to delete these materials`);
    }
  } else {
    console.log('✅ No partial migration data found');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

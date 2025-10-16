#!/usr/bin/env tsx
/**
 * Check Legacy Material Tables for Data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking Legacy Material Tables for Data\n');

  const tables = [
    { name: 'fabric_brands', model: prisma.fabric_brands },
    { name: 'fabric_collections', model: prisma.fabric_collections },
    { name: 'fabric_colors', model: prisma.fabric_colors },
    { name: 'wood_types', model: prisma.wood_types },
    { name: 'wood_finishes', model: prisma.wood_finishes },
    { name: 'metal_types', model: prisma.metal_types },
    { name: 'metal_finishes', model: prisma.metal_finishes },
    { name: 'metal_colors', model: prisma.metal_colors },
    { name: 'stone_types', model: prisma.stone_types },
    { name: 'stone_finishes', model: prisma.stone_finishes },
    { name: 'carving_styles', model: prisma.carving_styles },
  ];

  let totalRecords = 0;
  const tablesWithData: string[] = [];

  for (const table of tables) {
    const count = await table.model.count();
    totalRecords += count;

    if (count > 0) {
      tablesWithData.push(table.name);
      console.log(`   ${table.name}: ${count} records`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Total legacy records: ${totalRecords}`);
  console.log(`   Tables with data: ${tablesWithData.length}/${tables.length}`);

  if (totalRecords > 0) {
    console.log(`\n⚠️  WARNING: Legacy tables contain ${totalRecords} records!`);
    console.log(`   These need to be migrated to the unified materials table.`);
  } else {
    console.log(`\n✅ All legacy tables are empty - safe to remove!`);
  }

  // Check unified materials table
  const materialsCount = await prisma.materials.count();
  console.log(`\n📦 Unified materials table: ${materialsCount} records`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

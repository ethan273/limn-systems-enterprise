/**
 * Fix Base SKU Underscores Migration
 *
 * This script fixes Base SKUs that have underscores due to the old padding logic.
 *
 * Examples of fixes:
 * - IN-10__-001 → IN-10-001
 * - IN-4___-001 → IN-4-001
 * - IN-BAR_-001 → IN-BAR-001
 * - SH-ST__-001 → SH-ST-001
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Finding items with underscores in base_sku...\n');

  // Find all items with underscores in their base_sku
  const itemsWithUnderscores = await prisma.items.findMany({
    where: {
      base_sku: {
        contains: '_'
      }
    },
    select: {
      id: true,
      name: true,
      base_sku: true,
    },
    orderBy: {
      base_sku: 'asc'
    }
  });

  console.log(`Found ${itemsWithUnderscores.length} items with underscores in base_sku\n`);

  if (itemsWithUnderscores.length === 0) {
    console.log('✅ No items need fixing!');
    return;
  }

  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (const item of itemsWithUnderscores) {
    const oldSku = item.base_sku;
    if (!oldSku) continue;

    // Remove all underscores from the SKU
    const newSku = oldSku.replace(/_/g, '');

    try {
      // Check if new SKU already exists
      const existing = await prisma.items.findFirst({
        where: {
          base_sku: newSku,
          id: { not: item.id }
        }
      });

      if (existing) {
        console.log(`⚠️  SKIP: ${oldSku} → ${newSku} (already exists for item: ${existing.name})`);
        errorCount++;
        errors.push(`${item.name}: SKU ${newSku} already exists`);
        continue;
      }

      // Update the SKU
      await prisma.items.update({
        where: { id: item.id },
        data: { base_sku: newSku }
      });

      console.log(`✅ ${oldSku} → ${newSku} (${item.name})`);
      successCount++;

    } catch (error) {
      console.error(`❌ Error updating ${item.name}: ${error}`);
      errorCount++;
      errors.push(`${item.name}: ${error}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully fixed: ${successCount}`);
  console.log(`❌ Errors/Skipped: ${errorCount}`);
  console.log(`📝 Total processed: ${itemsWithUnderscores.length}`);

  if (errors.length > 0) {
    console.log('\n⚠️  ERRORS:');
    errors.forEach(err => console.log(`   - ${err}`));
  }

  console.log('\n✨ Migration complete!');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

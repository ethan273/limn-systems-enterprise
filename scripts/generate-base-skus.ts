/**
 * Migration Script: Generate Base SKUs for All Existing Items
 *
 * This script generates unique base SKUs for all items in the database
 * that don't already have one.
 *
 * Run with: npx tsx scripts/generate-base-skus.ts
 */

import { prisma } from '../src/lib/prisma';
import { generateBaseSku } from '../src/lib/utils/base-sku-generator';

async function main() {
  console.log('🚀 Starting Base SKU Generation Migration...\n');

  try {
    // Get all items with their collection data
    const items = await prisma.items.findMany({
      where: {
        active: true,
        base_sku: null, // Only items without base_sku
      },
      include: {
        collections: {
          select: {
            id: true,
            name: true,
            prefix: true,
          },
        },
      },
      orderBy: [
        { collection_id: 'asc' },
        { name: 'asc' },
      ],
    });

    console.log(`📊 Found ${items.length} items without base SKUs\n`);

    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ itemId: string; itemName: string; error: string }> = [];

    // Process each item
    for (const item of items) {
      try {
        if (!item.collections?.prefix) {
          console.warn(`⚠️  Skipping "${item.name}" - no collection prefix`);
          errorCount++;
          errors.push({
            itemId: item.id,
            itemName: item.name,
            error: 'No collection prefix',
          });
          continue;
        }

        // Generate base SKU
        const baseSku = await generateBaseSku(
          item.collections.prefix,
          item.name,
          item.variation_type
        );

        // Update item with generated base SKU
        await prisma.items.update({
          where: { id: item.id },
          data: { base_sku: baseSku },
        });

        console.log(`✅ ${item.collections.name} - "${item.name}" → ${baseSku}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error processing "${item.name}":`, error);
        errorCount++;
        errors.push({
          itemId: item.id,
          itemName: item.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 MIGRATION SUMMARY');
    console.log(`${'='.repeat(60)}`);
    console.log(`✅ Successfully generated: ${successCount} base SKUs`);
    console.log(`❌ Errors: ${errorCount}`);

    if (errors.length > 0) {
      console.log(`\n⚠️  ERRORS:`);
      errors.forEach((err) => {
        console.log(`   - ${err.itemName} (${err.itemId}): ${err.error}`);
      });
    }

    console.log(`\n✨ Migration complete!\n`);
  } catch (error) {
    console.error('💥 Fatal error during migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

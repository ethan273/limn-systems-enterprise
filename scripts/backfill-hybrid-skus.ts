/**
 * Backfill Hybrid SKU System Migration
 *
 * This script backfills product_sku and project_sku for existing orders/items.
 *
 * Product SKU: UK-DINI-001-HER-OAK (base_sku + top 2 materials)
 * Project SKU: ACME-24-DEV-001.001 (client-year-project-order.item)
 */

import { PrismaClient } from '@prisma/client';
import { generateProductSku, parseMaterialSelections } from '../src/lib/utils/product-sku-generator';
import { generateProjectSkuForLineItem } from '../src/lib/utils/project-sku-generator';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting Hybrid SKU System Backfill Migration...\n');

  // Step 1: Backfill product_sku for all items with base_sku
  console.log('📦 Step 1: Backfilling product_sku for catalog items...\n');

  const itemsWithBaseSku = await prisma.items.findMany({
    where: {
      base_sku: { not: null },
      product_sku: null, // Only items without product_sku
    },
    select: {
      id: true,
      name: true,
      base_sku: true,
      sku_full: true, // May contain material info
    },
  });

  console.log(`Found ${itemsWithBaseSku.length} items to update with product_sku\n`);

  let itemsUpdated = 0;
  let itemsSkipped = 0;

  for (const item of itemsWithBaseSku) {
    try {
      const baseSku = item.base_sku;
      if (!baseSku) {
        itemsSkipped++;
        continue;
      }

      // For now, if no material info available, product_sku = base_sku
      // In production, you'd extract materials from sku_full or other fields
      const productSku = baseSku; // Will be enhanced when orders are created

      await prisma.items.update({
        where: { id: item.id },
        data: { product_sku: productSku },
      });

      console.log(`✅ ${item.name}: ${productSku}`);
      itemsUpdated++;
    } catch (error) {
      console.error(`❌ Error updating item ${item.name}:`, error);
      itemsSkipped++;
    }
  }

  console.log(`\n📊 Items Summary: ${itemsUpdated} updated, ${itemsSkipped} skipped\n`);

  // Step 2: Backfill project_sku for existing order_items
  console.log('📋 Step 2: Backfilling project_sku for order items...\n');

  const orderItemsWithoutProjectSku = await prisma.order_items.findMany({
    where: {
      project_sku: null,
      order_id: { not: null },
    },
    include: {
      orders: {
        include: {
          customers: true,
        },
      },
      items: {
        select: {
          id: true,
          name: true,
          base_sku: true,
        },
      },
    },
    orderBy: [
      { order_id: 'asc' },
      { created_at: 'asc' },
    ],
  });

  console.log(`Found ${orderItemsWithoutProjectSku.length} order items to update with project_sku\n`);

  let orderItemsUpdated = 0;
  let orderItemsSkipped = 0;
  let currentOrderId: string | null = null;
  let lineItemNumber = 1;

  for (const orderItem of orderItemsWithoutProjectSku) {
    try {
      const order = orderItem.orders;
      if (!order) {
        console.log(`⚠️  Skipping order item ${orderItem.id}: No order found`);
        orderItemsSkipped++;
        continue;
      }

      // Reset line item number for new orders
      if (order.id !== currentOrderId) {
        currentOrderId = order.id;
        lineItemNumber = 1;
      }

      // Get client name
      const clientName = order.customers?.company_name || order.customers?.name || 'UNKNOWN';

      // Get project name (use order number or a default)
      const projectName = order.order_number || 'PROJECT';

      // Generate project SKU
      const projectSku = await generateProjectSkuForLineItem(
        clientName,
        projectName,
        order.id!,
        lineItemNumber
      );

      // Update order item
      await prisma.order_items.update({
        where: { id: orderItem.id },
        data: { project_sku: projectSku },
      });

      console.log(`✅ Order ${order.order_number} Item ${lineItemNumber}: ${projectSku}`);
      orderItemsUpdated++;
      lineItemNumber++;

      // Also generate product_sku if item has base_sku and specifications
      if (orderItem.items?.base_sku && orderItem.specifications) {
        const materials = parseMaterialSelections(orderItem.specifications as Record<string, unknown>);
        if (Object.keys(materials).length > 0) {
          const productSku = generateProductSku(orderItem.items.base_sku, materials);

          // Update the item's product_sku
          await prisma.items.update({
            where: { id: orderItem.items.id },
            data: { product_sku: productSku },
          });

          console.log(`   📦 Updated item product_sku: ${productSku}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error updating order item ${orderItem.id}:`, error);
      orderItemsSkipped++;
    }
  }

  console.log(`\n📊 Order Items Summary: ${orderItemsUpdated} updated, ${orderItemsSkipped} skipped\n`);

  // Step 3: Summary Report
  console.log('='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Catalog Items Updated: ${itemsUpdated}`);
  console.log(`✅ Order Items Updated: ${orderItemsUpdated}`);
  console.log(`⚠️  Items Skipped: ${itemsSkipped}`);
  console.log(`⚠️  Order Items Skipped: ${orderItemsSkipped}`);
  console.log(`📝 Total Processed: ${itemsWithBaseSku.length + orderItemsWithoutProjectSku.length}`);

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

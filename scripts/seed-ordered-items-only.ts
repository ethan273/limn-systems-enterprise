/**
 * Seed Ordered Items Production Only
 * Creates ordered items production records linked to existing production orders
 */

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

const ORDERED_ITEMS_STATUSES = ['queued', 'in_production', 'qc_passed', 'qc_failed', 'completed', 'shipped'];
const QC_RESULTS = ['pending', 'passed', 'failed', 'conditional'];

async function seedOrderedItemsProduction() {
  console.log('  → Creating ordered items production...');

  // Get production orders
  const productionOrders = await prisma.production_orders.findMany({
    take: 40,
  });

  if (productionOrders.length === 0) {
    console.log('  ⚠️  No production orders found. Skipping ordered items.');
    return 0;
  }

  let created = 0;

  for (const order of productionOrders) {
    // Create 1-3 items per production order
    const itemCount = Math.min(order.quantity, faker.number.int({ min: 1, max: 3 }));

    for (let i = 0; i < itemCount; i++) {
      const itemNumber = i + 1;
      const sku = `${order.order_number}-ITEM-${String(itemNumber).padStart(3, '0')}`;
      const serialNumber = `SN-${faker.string.alphanumeric(10).toUpperCase()}`;

      try {
        await prisma.ordered_items_production.create({
          data: {
            sku,
            production_order_id: order.id,
            item_number: itemNumber,
            serial_number: Math.random() < 0.7 ? serialNumber : null,
            status: faker.helpers.arrayElement(ORDERED_ITEMS_STATUSES),
            qc_status: faker.helpers.arrayElement(QC_RESULTS),
            production_start_date: faker.date.recent({ days: 30 }),
            production_end_date: faker.datatype.boolean() ? faker.date.recent({ days: 15 }) : null,
            qc_date: faker.datatype.boolean() ? faker.date.recent({ days: 10 }) : null,
            qc_notes: faker.datatype.boolean() ? faker.lorem.sentence() : null,
            shipped_date: faker.datatype.boolean() ? faker.date.recent({ days: 3 }) : null,
            delivered_date: faker.datatype.boolean() ? faker.date.recent({ days: 1 }) : null,
          },
        });
        created++;
      } catch (error) {
        // Skip duplicate SKUs
        if (!(error as any).message?.includes('Unique constraint')) {
          console.error(`  ❌ Failed to create ordered item:`, error);
        }
      }
    }
  }

  return created;
}

async function main() {
  console.log('🌱 Seeding ordered items production...\\n');

  try {
    const orderedItemsCount = await seedOrderedItemsProduction();
    console.log(`\\n✅ Created ${orderedItemsCount} ordered items production records\\n`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

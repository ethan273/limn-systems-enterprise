/**
 * Seed Production Module Data
 * Creates test data for Factory Reviews, Packing Jobs, and Ordered Items modules
 */

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

const FACTORY_REVIEW_STATUSES = ['scheduled', 'in_progress', 'completed'];
const ORDERED_ITEMS_STATUSES = ['queued', 'in_production', 'qc_passed', 'qc_failed', 'completed', 'shipped'];
const QC_RESULTS = ['pending', 'passed', 'failed', 'conditional'];

async function seedFactoryReviews() {
  console.log('  → Creating factory review sessions...');

  // Get prototype production records to link to
  const prototypeProductions = await prisma.prototype_production.findMany({
    take: 20,
  });

  if (prototypeProductions.length === 0) {
    console.log('  ⚠️  No prototype productions found. Skipping factory reviews.');
    return 0;
  }

  let created = 0;
  for (const prototype of prototypeProductions) {
    const sessionCount = faker.number.int({ min: 1, max: 3 });

    for (let i = 0; i < sessionCount; i++) {
      try {
        await prisma.factory_review_sessions.create({
          data: {
            prototype_production_id: prototype.id,
            session_number: i + 1,
            session_name: `Review ${i + 1} - ${prototype.item_name || 'Prototype'}`,
            review_date: faker.date.recent({ days: 60 }),
            status: faker.helpers.arrayElement(FACTORY_REVIEW_STATUSES),
            location: faker.helpers.arrayElement([
              'Factory Floor A',
              'QC Lab',
              'Production Line 1',
              'Assembly Area',
              'Inspection Room',
            ]),
            attendees: [faker.person.fullName(), faker.person.fullName()],
            overall_rating: faker.number.float({ min: 3.0, max: 5.0, fractionDigits: 1 }),
            summary: faker.lorem.paragraph(),
            action_items: faker.datatype.boolean() ? [faker.lorem.sentence(), faker.lorem.sentence()] : [],
            follow_up_required: faker.datatype.boolean(),
            follow_up_date: faker.datatype.boolean() ? faker.date.soon({ days: 30 }) : null,
            notes: faker.lorem.paragraph(),
          },
        });
        created++;
      } catch (error) {
        console.error(`  ❌ Failed to create factory review session:`, error);
      }
    }
  }

  return created;
}

async function seedOrderedItemsProduction() {
  console.log('  → Creating ordered items production...');

  // Get production orders to link to
  const productionOrders = await prisma.production_orders.findMany({
    take: 30,
  });

  if (productionOrders.length === 0) {
    console.log('  ⚠️  No production orders found. Skipping ordered items.');
    return 0;
  }

  let created = 0;
  for (const order of productionOrders) {
    // Create 1-5 individual items per production order
    const itemCount = Math.min(order.quantity, faker.number.int({ min: 1, max: 5 }));

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
            production_started: faker.date.recent({ days: 30 }),
            production_completed: faker.datatype.boolean() ? faker.date.recent({ days: 15 }) : null,
            qc_date: faker.datatype.boolean() ? faker.date.recent({ days: 10 }) : null,
            qc_notes: faker.datatype.boolean() ? faker.lorem.sentence() : null,
            defects_found: faker.datatype.boolean() ? faker.number.int({ min: 0, max: 3 }) : 0,
            rework_required: faker.datatype.boolean(),
            rework_completed: faker.datatype.boolean(),
            packed_date: faker.datatype.boolean() ? faker.date.recent({ days: 5 }) : null,
            shipped_date: faker.datatype.boolean() ? faker.date.recent({ days: 3 }) : null,
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

async function checkPackingJobs() {
  const count = await prisma.packing_jobs.count();
  console.log(`  ℹ️  Existing packing jobs: ${count}`);

  if (count === 0) {
    console.log('  ⚠️  No packing jobs found. Run prisma/seeds/06-production/seed-production.ts to create them.');
  }

  return count;
}

async function main() {
  console.log('🌱 Seeding production module data...\n');

  try {
    // Check packing jobs
    console.log('📦 Checking Packing Jobs...');
    const packingJobsCount = await checkPackingJobs();
    console.log('');

    // Seed factory reviews
    console.log('🏭 Seeding Factory Reviews...');
    const factoryReviewsCount = await seedFactoryReviews();
    console.log(`  ✅ Created ${factoryReviewsCount} factory review sessions\n`);

    // Seed ordered items production
    console.log('📋 Seeding Ordered Items Production...');
    const orderedItemsCount = await seedOrderedItemsProduction();
    console.log(`  ✅ Created ${orderedItemsCount} ordered items\n`);

    // Summary
    console.log('📊 Summary:');
    console.log(`  Packing Jobs: ${packingJobsCount} (existing)`);
    console.log(`  Factory Review Sessions: ${factoryReviewsCount} (created)`);
    console.log(`  Ordered Items Production: ${orderedItemsCount} (created)\n`);

    console.log('✨ Production modules seeding completed successfully!\n');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

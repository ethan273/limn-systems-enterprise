/**
 * Seed Full Production Workflow
 * Creates complete production data chain: Prototypes → Prototype Production → Factory Reviews
 * Also creates: Ordered Items Production and Packing Jobs
 */

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

const PROTOTYPE_STATUSES = ['concept', 'design', 'review', 'approved', 'in_production', 'complete', 'cancelled'];
const PRODUCTION_STATUSES = ['not_started', 'in_progress', 'paused', 'completed', 'cancelled'];
const REVIEW_STATUSES = ['scheduled', 'in_progress', 'completed'];
const ORDERED_ITEMS_STATUSES = ['queued', 'in_production', 'qc_passed', 'qc_failed', 'completed', 'shipped'];
const QC_RESULTS = ['pending', 'passed', 'failed', 'conditional'];
const PACKING_STATUSES = ['pending', 'in_progress', 'packed', 'shipped'];

async function seedPrototypesWithProduction() {
  console.log('  → Creating prototypes with production tracking...');

  // Get catalog items to base prototypes on
  const catalogItems = await prisma.items.findMany({
    where: { active: true },
    take: 20,
  });

  if (catalogItems.length === 0) {
    console.log('  ⚠️  No catalog items found. Skipping prototypes.');
    return 0;
  }

  // Get a user to be the creator
  const user = await prisma.users.findFirst();

  if (!user) {
    console.log('  ⚠️  No users found. Cannot create prototypes.');
    return 0;
  }

  // Get factories for production
  const factories = await prisma.partners.findMany({
    where: { type: 'factory' },
    take: 10,
  });

  let created = 0;

  for (let i = 0; i < 15; i++) {
    const catalogItem = faker.helpers.arrayElement(catalogItems);
    if (!catalogItem) continue;

    const prototypeNumber = `PROTO-${new Date().getFullYear()}-${String(i + 1).padStart(3, '0')}`;
    const factory = factories.length > 0 ? faker.helpers.arrayElement(factories) : null;

    try {
      // Create prototype with nested prototype_production record
      const prototype = await prisma.prototypes.create({
        data: {
          prototype_number: prototypeNumber,
          name: catalogItem.name + ' Prototype',
          description: `Prototype for ${catalogItem.name}`,
          prototype_type: 'furniture',
          status: faker.helpers.arrayElement(PROTOTYPE_STATUSES),
          priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'urgent']),
          is_catalog_candidate: faker.datatype.boolean(),
          target_price_usd: catalogItem.price ? Number(catalogItem.price) * 1.2 : null,
          notes: faker.datatype.boolean() ? faker.lorem.paragraph() : null,
          created_by: user.id,
          ...(catalogItem.id && { items: { connect: { id: catalogItem.id } } }),
          // Create prototype_production record at the same time
          prototype_production: {
            create: {
              status: faker.helpers.arrayElement(PRODUCTION_STATUSES),
              start_date: faker.date.recent({ days: 90 }),
              target_date: faker.date.soon({ days: 60 }),
              actual_completion: faker.datatype.boolean() ? faker.date.recent({ days: 30 }) : null,
              overall_progress: faker.number.int({ min: 0, max: 100 }),
              current_phase: faker.helpers.arrayElement(['Design', 'Material Selection', 'Fabrication', 'Assembly', 'Finishing', 'QC']),
              quality_score: faker.number.int({ min: 60, max: 100 }),
              defects_found: faker.number.int({ min: 0, max: 5 }),
              rework_required: faker.datatype.boolean(),
              notes: faker.datatype.boolean() ? faker.lorem.sentence() : null,
              ...(factory && { partners: { connect: { id: factory.id } } }),
            },
          },
        },
      });

      created++;
    } catch (error) {
      console.error(`  ❌ Failed to create prototype ${prototypeNumber}:`, error);
    }
  }

  return created;
}

async function seedFactoryReviews() {
  console.log('  → Creating factory review sessions...');

  // Get prototype production records
  const prototypeProductions = await prisma.prototype_production.findMany({
    take: 20,
    include: {
      prototypes: true,
    },
  });

  if (prototypeProductions.length === 0) {
    console.log('  ⚠️  No prototype productions found. Skipping factory reviews.');
    return 0;
  }

  let created = 0;

  for (const protoProd of prototypeProductions) {
    // Create 1-3 review sessions per prototype
    const sessionCount = faker.number.int({ min: 1, max: 3 });

    for (let i = 0; i < sessionCount; i++) {
      try {
        await prisma.factory_review_sessions.create({
          data: {
            prototype_production_id: protoProd.id,
            session_number: i + 1,
            session_name: `Review ${i + 1} - ${protoProd.prototypes.name}`,
            review_date: faker.date.recent({ days: 60 }),
            status: faker.helpers.arrayElement(REVIEW_STATUSES),
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
        console.error(`  ❌ Failed to create factory review:`, error);
      }
    }
  }

  return created;
}

async function seedOrderedItemsProduction() {
  console.log('  → Creating ordered items production...');

  // Get production orders
  const productionOrders = await prisma.production_orders.findMany({
    take: 30,
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

async function seedPackingJobs() {
  console.log('  → Creating packing jobs...');

  // Get production orders with their order items
  const productionOrders = await prisma.production_orders.findMany({
    take: 30,
    select: {
      id: true,
      order_number: true,
      quantity: true,
      order_id: true,
    },
  });

  if (productionOrders.length === 0) {
    console.log('  ⚠️  No production orders found. Skipping packing jobs.');
    return 0;
  }

  let created = 0;

  for (const prodOrder of productionOrders) {
    if (!prodOrder.order_id) continue;

    // Create 1-2 packing jobs per production order
    const jobCount = faker.number.int({ min: 1, max: 2 });

    for (let i = 0; i < jobCount; i++) {
      const quantity = Math.ceil(prodOrder.quantity / jobCount);

      try {
        await prisma.packing_jobs.create({
          data: {
            order_id: prodOrder.order_id,
            quantity,
            packed_quantity: faker.number.int({ min: 0, max: quantity }),
            box_count: faker.number.int({ min: 1, max: 8 }),
            total_weight: faker.number.float({ min: 20, max: 500, fractionDigits: 2 }),
            packing_status: faker.helpers.arrayElement(PACKING_STATUSES),
            priority: faker.helpers.arrayElement(['low', 'normal', 'high', 'urgent']),
            special_instructions: faker.datatype.boolean() ? faker.lorem.sentence() : null,
            packed_date: faker.datatype.boolean() ? faker.date.recent({ days: 10 }) : null,
          },
        });
        created++;
      } catch (error) {
        console.error(`  ❌ Failed to create packing job:`, error);
      }
    }
  }

  return created;
}

async function main() {
  console.log('🌱 Seeding full production workflow...\\n');

  try {
    // 1. Create Prototypes with Production tracking
    console.log('🔬 Seeding Prototypes with Production...');
    const prototypesCount = await seedPrototypesWithProduction();
    console.log(`  ✅ Created ${prototypesCount} prototypes with production tracking\\n`);

    // 2. Create Factory Review Sessions
    console.log('🏭 Seeding Factory Reviews...');
    const factoryReviewsCount = await seedFactoryReviews();
    console.log(`  ✅ Created ${factoryReviewsCount} factory review sessions\\n`);

    // 3. Create Ordered Items Production
    console.log('📋 Seeding Ordered Items Production...');
    const orderedItemsCount = await seedOrderedItemsProduction();
    console.log(`  ✅ Created ${orderedItemsCount} ordered items\\n`);

    // 4. Create Packing Jobs
    console.log('📦 Seeding Packing Jobs...');
    const packingJobsCount = await seedPackingJobs();
    console.log(`  ✅ Created ${packingJobsCount} packing jobs\\n`);

    // Summary
    console.log('📊 Summary:');
    console.log(`  Prototypes with Production: ${prototypesCount}`);
    console.log(`  Factory Review Sessions: ${factoryReviewsCount}`);
    console.log(`  Ordered Items Production: ${orderedItemsCount}`);
    console.log(`  Packing Jobs: ${packingJobsCount}\\n`);

    console.log('✨ Full production workflow seeding completed successfully!\\n');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

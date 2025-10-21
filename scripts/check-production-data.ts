/**
 * Check Production Data
 * Checks what production-related data exists in the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProductionData() {
  console.log('🔍 Checking production data...\n');

  try {
    // Check prototypes (parent table)
    const prototypesCount = await prisma.prototypes.count();
    console.log(`Prototypes: ${prototypesCount}`);

    if (prototypesCount > 0) {
      const samplePrototypes = await prisma.prototypes.findMany({
        take: 5,
        select: {
          prototype_number: true,
          name: true,
          status: true,
        },
      });
      console.log('  Sample prototypes:', samplePrototypes);
    }

    // Check production orders
    const productionOrdersCount = await prisma.production_orders.count();
    console.log(`\nProduction Orders: ${productionOrdersCount}`);

    if (productionOrdersCount > 0) {
      const sampleOrders = await prisma.production_orders.findMany({
        take: 5,
        select: {
          order_number: true,
          item_name: true,
          status: true,
        },
      });
      console.log('  Sample orders:', sampleOrders);
    }

    // Check prototype productions (child of prototypes)
    const prototypeProductionsCount = await prisma.prototype_production.count();
    console.log(`\nPrototype Productions: ${prototypeProductionsCount}`);

    // Check factory review sessions
    const factoryReviewsCount = await prisma.factory_review_sessions.count();
    console.log(`\nFactory Review Sessions: ${factoryReviewsCount}`);

    // Check ordered items production
    const orderedItemsCount = await prisma.ordered_items_production.count();
    console.log(`Ordered Items Production: ${orderedItemsCount}`);

    // Check packing jobs
    const packingJobsCount = await prisma.packing_jobs.count();
    console.log(`Packing Jobs: ${packingJobsCount}`);

    console.log('\n✅ Check complete\n');
  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductionData();

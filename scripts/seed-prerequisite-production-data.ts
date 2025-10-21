/**
 * Seed Prerequisite Production Data
 * Creates production orders and prototype productions needed by Production modules
 */

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

const PRODUCTION_STATUSES = ['queued', 'in_progress', 'completed', 'delayed', 'cancelled'];
const PRODUCTION_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

async function seedProductionOrders() {
  console.log('  → Checking existing production orders...');

  // Check if production orders already exist
  const existingCount = await prisma.production_orders.count();

  if (existingCount > 0) {
    console.log(`  ℹ️  Found ${existingCount} existing production orders - skipping creation`);
    return 0;
  }

  console.log('  → Creating production orders...');

  // Get orders to link to
  const orders = await prisma.orders.findMany({
    take: 30,
  });

  if (orders.length === 0) {
    console.log('  ⚠️  No orders found. Cannot create production orders.');
    return 0;
  }

  // Get catalog items to link to
  const catalogItems = await prisma.items.findMany({
    where: { active: true },
    take: 30,
  });

  if (catalogItems.length === 0) {
    console.log('  ⚠️  No catalog items found. Cannot create production orders.');
    return 0;
  }

  // Get factories to link to
  const factories = await prisma.partners.findMany({
    where: { type: 'factory' },
    take: 20,
  });

  let created = 0;
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    if (!order) continue;

    const catalogItem = faker.helpers.arrayElement(catalogItems);
    if (!catalogItem) continue;

    const quantity = faker.number.int({ min: 1, max: 10 });
    const unitPrice = catalogItem.price || 0;
    const totalCost = Number(unitPrice) * quantity;

    // Use timestamp to ensure unique order numbers
    const timestamp = Date.now();
    const prodOrderNumber = `PRD-${new Date().getFullYear()}-${String(timestamp).slice(-6)}-${String(i + 1).padStart(3, '0')}`;

    try {
      const factory = factories.length > 0 ? faker.helpers.arrayElement(factories) : null;

      await prisma.production_orders.create({
        data: {
          order_number: prodOrderNumber,
          product_type: catalogItem.furniture_type || 'Furniture',
          item_name: catalogItem.name,
          quantity,
          unit_price: unitPrice,
          total_cost: totalCost,
          deposit_paid: faker.datatype.boolean(),
          final_payment_paid: faker.datatype.boolean(),
          status: faker.helpers.arrayElement(PRODUCTION_STATUSES),
          order_date: faker.date.recent({ days: 60 }),
          estimated_ship_date: faker.date.soon({ days: 90 }),
          actual_ship_date: faker.datatype.boolean() ? faker.date.recent({ days: 20 }) : null,
          factory_notes: faker.datatype.boolean() ? faker.lorem.sentence() : null,
          orders: { connect: { id: order.id } },
          items_production_orders_catalog_item_idToitems: { connect: { id: catalogItem.id } },
          ...(factory && { partners: { connect: { id: factory.id } } }),
        },
      });
      created++;
    } catch (error) {
      console.error(`  ❌ Failed to create production order:`, error);
    }
  }

  return created;
}

async function seedPrototypeProductions() {
  console.log('  → Creating prototype productions...');

  // Get catalog items
  const catalogItems = await prisma.items.findMany({
    where: { active: true },
    take: 20,
  });

  if (catalogItems.length === 0) {
    console.log('  ⚠️  No catalog items found. Cannot create prototype productions.');
    return 0;
  }

  // Get factories
  const factories = await prisma.partners.findMany({
    where: { type: 'factory' },
    take: 10,
  });

  let created = 0;
  for (let i = 0; i < 15; i++) {
    const catalogItem = faker.helpers.arrayElement(catalogItems);
    if (!catalogItem) continue;

    const prototypeNumber = `PROTO-${new Date().getFullYear()}-${String(i + 1).padStart(3, '0')}`;

    try {
      const factory = factories.length > 0 ? faker.helpers.arrayElement(factories) : null;

      await prisma.prototype_production.create({
        data: {
          prototype_number: prototypeNumber,
          item_name: catalogItem.name,
          production_status: faker.helpers.arrayElement(['pending', 'in_production', 'completed', 'cancelled']),
          priority: faker.helpers.arrayElement(PRODUCTION_PRIORITIES),
          requested_date: faker.date.recent({ days: 90 }),
          target_completion_date: faker.date.soon({ days: 60 }),
          actual_completion_date: faker.datatype.boolean() ? faker.date.recent({ days: 30 }) : null,
          notes: faker.datatype.boolean() ? faker.lorem.paragraph() : null,
          items_prototype_production_catalog_item_idToitems: { connect: { id: catalogItem.id } },
          ...(factory && { partners: { connect: { id: factory.id } } }),
        },
      });
      created++;
    } catch (error) {
      console.error(`  ❌ Failed to create prototype production:`, error);
    }
  }

  return created;
}

async function main() {
  console.log('🌱 Seeding prerequisite production data...\n');

  try {
    // Seed production orders
    console.log('📋 Seeding Production Orders...');
    const productionOrdersCount = await seedProductionOrders();
    console.log(`  ✅ Created ${productionOrdersCount} production orders\n`);

    // Seed prototype productions
    console.log('🔬 Seeding Prototype Productions...');
    const prototypeProductionsCount = await seedPrototypeProductions();
    console.log(`  ✅ Created ${prototypeProductionsCount} prototype productions\n`);

    // Summary
    console.log('📊 Summary:');
    console.log(`  Production Orders: ${productionOrdersCount}`);
    console.log(`  Prototype Productions: ${prototypeProductionsCount}\n`);

    console.log('✨ Prerequisite data seeding completed successfully!\n');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

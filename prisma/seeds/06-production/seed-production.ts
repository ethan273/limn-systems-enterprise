/**
 * Phase 6: Production Module Seeding
 *
 * Seeds:
 * - 40 Production Orders (linked to customer orders)
 * - 30 Shop Drawings
 * - 50 QC Inspections
 * - 30 Packing Jobs
 *
 * Total: ~150 production workflow records
 */

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const PRODUCTION_STATUSES = ['queued', 'in_progress', 'completed', 'delayed', 'cancelled'];
const PRODUCTION_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const SHOP_DRAWING_STATUSES = ['draft', 'pending_review', 'approved', 'rejected', 'revision_required'];

const QC_STATUSES = ['pending', 'in_progress', 'passed', 'failed', 'conditional'];
const QC_RESULTS = ['pass', 'fail', 'conditional pass'];

const PACKING_STATUSES = ['pending', 'in_progress', 'completed', 'shipped'];

/**
 * Seed production workflow data
 */
export async function seedProduction(prisma: PrismaClient) {
  // Clean existing production data
  console.log('  → Cleaning existing production data...');
  await prisma.packing_jobs.deleteMany({});
  await prisma.qc_inspections.deleteMany({});
  await prisma.shop_drawings.deleteMany({});
  await prisma.production_orders.deleteMany({});
  console.log('  ✅ Cleaned existing production data');

  console.log('  → Fetching orders for production...');

  const orders = await prisma.orders.findMany({
    where: {
      status: { in: ['confirmed', 'in_production', 'ready'] },
    },
    take: 40,
  });

  if (orders.length === 0) {
    console.log('  ⚠️  No confirmed orders found. Please run Phase 5 (Orders) first.');
    return;
  }

  console.log('  → Fetching catalog items for production orders...');

  const catalogItems = await prisma.items.findMany({
    where: { type: 'Production Ready', active: true },
    take: 40,
  });

  if (catalogItems.length === 0) {
    console.log('  ⚠️  No catalog items found. Please run Phase 4 (Products) first.');
    return;
  }

  console.log(`  ✅ Found ${orders.length} orders and ${catalogItems.length} catalog items`);

  // Seed production orders
  console.log('  → Creating production orders...');

  const productionOrdersData = [];

  for (const order of orders) {
    const catalogItem = faker.helpers.arrayElement(catalogItems);
    if (!catalogItem) continue;

    const quantity = faker.number.int({ min: 1, max: 10 });
    const unitPrice = catalogItem.price || 0;
    const totalCost = Number(unitPrice) * quantity;

    // Generate unique production order number
    const prodOrderNumber: string = `PROD-${new Date().getFullYear()}-${String(productionOrdersData.length + 1).padStart(5, '0')}`;

    productionOrdersData.push({
      order_number: prodOrderNumber, // Unique production order number
      product_type: catalogItem.furniture_type || 'Furniture',
      item_name: catalogItem.name,
      quantity: quantity,
      unit_price: unitPrice,
      total_cost: totalCost,
      deposit_paid: faker.datatype.boolean(),
      final_payment_paid: faker.datatype.boolean(),
      status: faker.helpers.arrayElement(PRODUCTION_STATUSES),
      order_date: faker.date.recent({ days: 30 }),
      estimated_ship_date: faker.date.soon({ days: 60 }),
      actual_ship_date: faker.datatype.boolean() ? faker.date.recent({ days: 10 }) : null,
      factory_notes: faker.lorem.sentence(),
      order_id: order.id,
      catalog_item_id: catalogItem.id,
    });
  }

  const createdProductionOrders = [];
  for (const productionOrder of productionOrdersData) {
    const created = await prisma.production_orders.create({ data: productionOrder });
    createdProductionOrders.push(created);
  }

  console.log(`  ✅ Created ${createdProductionOrders.length} production orders`);

  // Seed shop drawings
  console.log('  → Creating shop drawings...');

  const shopDrawingsData = [];

  // Get a user for created_by field
  const users = await prisma.users.findMany({ take: 1 });
  const createdBy = users[0]?.id;

  if (!createdBy) {
    console.log('  ⚠️  No users found. Skipping shop drawings.');
  } else {
    // Create shop drawings for 30 production orders (75%)
    for (let i = 0; i < Math.min(30, createdProductionOrders.length); i++) {
      const productionOrder = createdProductionOrders[i];
      if (!productionOrder) continue;

      const drawingNumber = `SD-${new Date().getFullYear()}-${String(i + 1).padStart(5, '0')}`;

      shopDrawingsData.push({
        drawing_number: drawingNumber,
        drawing_name: `Shop Drawing for ${productionOrder.item_name}`,
        production_order_id: productionOrder.id,
        current_version: faker.number.int({ min: 1, max: 5 }),
        status: faker.helpers.arrayElement(SHOP_DRAWING_STATUSES),
        created_by: createdBy,
        notes: faker.lorem.sentence(),
      });
    }

    for (const shopDrawing of shopDrawingsData) {
      await prisma.shop_drawings.create({ data: shopDrawing });
    }

    console.log(`  ✅ Created ${shopDrawingsData.length} shop drawings`);
  }

  // Seed QC inspections
  console.log('  → Creating QC inspections...');

  const qcInspectionsData = [];

  // Get order items for QC inspections
  const orderItems = await prisma.order_items.findMany({
    where: {
      order_id: { in: orders.map(o => o.id) },
    },
    take: 50,
  });

  // Create 1 QC inspection per order item
  for (const orderItem of orderItems) {
    if (!orderItem.order_id) continue;

    const defectsCount = faker.number.int({ min: 0, max: 5 });

    qcInspectionsData.push({
      order_id: orderItem.order_id,
      order_item_id: orderItem.id,
      qc_stage: faker.helpers.arrayElement(['incoming_inspection', 'in_process_check', 'final_inspection', 'packaging_check']),
      status: faker.helpers.arrayElement(['pending', 'in_progress', 'passed', 'failed', 'on_hold']),
      priority: faker.helpers.arrayElement(['low', 'normal', 'high', 'urgent']),
      defects_found: defectsCount,
      started_at: faker.datatype.boolean() ? faker.date.recent({ days: 10 }) : null,
      completed_at: faker.datatype.boolean() ? faker.date.recent({ days: 5 }) : null,
      notes: faker.lorem.sentence(),
    });
  }

  for (const qcInspection of qcInspectionsData) {
    await prisma.qc_inspections.create({ data: qcInspection });
  }

  console.log(`  ✅ Created ${qcInspectionsData.length} QC inspections`);

  // Seed packing jobs
  console.log('  → Creating packing jobs...');

  const packingJobsData = [];

  // Use the same order items from QC inspections
  for (let i = 0; i < Math.min(30, orderItems.length); i++) {
    const orderItem = orderItems[i];
    if (!orderItem || !orderItem.order_id) continue;

    const quantity = orderItem.quantity || 1;

    packingJobsData.push({
      order_id: orderItem.order_id,
      order_item_id: orderItem.id,
      quantity: quantity,
      packed_quantity: faker.number.int({ min: 0, max: quantity }),
      box_count: faker.number.int({ min: 1, max: 8 }),
      total_weight: faker.number.float({ min: 20, max: 500, fractionDigits: 2 }),
      packing_status: faker.helpers.arrayElement(['pending', 'in_progress', 'packed', 'shipped']),
      priority: faker.helpers.arrayElement(['low', 'normal', 'high', 'urgent']),
      special_instructions: faker.datatype.boolean() ? faker.lorem.sentence() : null,
      packed_date: faker.datatype.boolean() ? faker.date.recent({ days: 10 }) : null,
    });
  }

  for (const packingJob of packingJobsData) {
    await prisma.packing_jobs.create({ data: packingJob });
  }

  console.log(`  ✅ Created ${packingJobsData.length} packing jobs`);
}

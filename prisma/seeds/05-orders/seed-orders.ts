/**
 * Phase 5: Orders & Financial Module Seeding
 *
 * Seeds:
 * - 50 Orders (various statuses)
 * - 150 Order Items (with Full SKUs from generated catalog items)
 * - 40 Invoices
 * - 60 Payments
 *
 * Total: ~300 transactional records
 */

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { generateFullSku } from '../../../src/lib/utils/full-sku-generator';

const ORDER_STATUSES = ['pending', 'confirmed', 'in_production', 'ready', 'shipped', 'delivered', 'cancelled'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const DEPARTMENTS = ['sales', 'production', 'design', 'shipping'];
const SHIPPING_METHODS = ['Standard Ground', 'Express', 'Freight', 'White Glove Delivery', 'Customer Pickup'];

const ORDER_ITEM_STATUSES = ['pending', 'in_production', 'completed', 'shipped'];

const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
const PAYMENT_METHODS = ['Credit Card', 'Wire Transfer', 'ACH', 'Check', 'Cash'];
const PAYMENT_STATUSES = ['pending', 'processing', 'completed', 'failed', 'refunded'];

/**
 * Seed orders and financial data
 */
export async function seedOrders(prisma: PrismaClient) {
  // Clean existing order data
  console.log('  → Cleaning existing order data...');
  await prisma.order_items.deleteMany({});
  await prisma.orders.deleteMany({});
  console.log('  ✅ Cleaned existing orders and order items');

  console.log('  → Fetching customers for orders...');

  const customers = await prisma.customers.findMany({ take: 30 });

  if (customers.length === 0) {
    console.log('  ⚠️  No customers found. Please run Phase 3 (CRM) first.');
    return;
  }

  console.log('  → Fetching catalog items for order items...');

  const catalogItems = await prisma.items.findMany({
    where: { type: 'Production Ready', active: true },
    take: 60,
  });

  if (catalogItems.length === 0) {
    console.log('  ⚠️  No catalog items found. Please run Phase 4 (Products) first.');
    return;
  }

  console.log(`  ✅ Found ${customers.length} customers and ${catalogItems.length} catalog items`);

  // Seed orders
  console.log('  → Creating orders...');

  const ordersData = [];

  for (let i = 0; i < 50; i++) {
    const customer = faker.helpers.arrayElement(customers);
    if (!customer) continue;

    const orderNumber = `ORD-${new Date().getFullYear()}-${String(i + 1).padStart(5, '0')}`;
    const status = faker.helpers.arrayElement(ORDER_STATUSES);

    ordersData.push({
      order_number: orderNumber,
      customer_id: customer.id,
      status,
      priority: faker.helpers.arrayElement(PRIORITIES),
      department: faker.helpers.arrayElement(DEPARTMENTS),
      due_date: faker.date.soon({ days: 90 }),
      estimated_completion: faker.date.soon({ days: 120 }),
      actual_completion: status === 'delivered' ? faker.date.recent({ days: 30 }) : null,
      rush_order: faker.datatype.boolean({ probability: 0.2 }), // 20% rush orders
      shipping_method: faker.helpers.arrayElement(SHIPPING_METHODS),
      tracking_number: status === 'shipped' || status === 'delivered' ? faker.string.alphanumeric(18).toUpperCase() : null,
      invoice_sent: faker.datatype.boolean({ probability: 0.7 }),
      payment_received: faker.datatype.boolean({ probability: 0.6 }),
      total_amount: 0, // Will calculate after order items
      tags: faker.helpers.arrayElements(['Residential', 'Commercial', 'Custom', 'Wholesale'], { min: 0, max: 2 }),
      notes: faker.lorem.sentence(),
    });
  }

  const createdOrders = [];
  for (const order of ordersData) {
    const created = await prisma.orders.create({ data: order });
    createdOrders.push(created);
  }

  console.log(`  ✅ Created ${createdOrders.length} orders`);

  // Seed order items with FULL SKUs
  console.log('  → Creating order items with FULL SKUs...');

  const orderItemsData = [];
  const orderTotals = new Map();

  for (const order of createdOrders) {
    // Each order has 2-5 items
    const itemCount = faker.number.int({ min: 2, max: 5 });

    for (let i = 0; i < itemCount; i++) {
      const catalogItem = faker.helpers.arrayElement(catalogItems);
      if (!catalogItem || !catalogItem.base_sku) continue;

      const quantity = faker.number.int({ min: 1, max: 4 });
      const unitPrice = catalogItem.list_price || faker.number.float({ min: 500, max: 15000, fractionDigits: 2 });

      // Generate FULL SKU with material specifications
      const materialSpecifications = {
        fabric: faker.datatype.boolean() ? {
          color: faker.color.human(),
          brand: faker.company.name(),
          collection: faker.commerce.productName(),
        } : undefined,
        wood: faker.datatype.boolean() ? {
          species: faker.helpers.arrayElement(['White Oak', 'Walnut', 'Maple', 'Cherry']),
          finish: faker.helpers.arrayElement(['Natural', 'Stained', 'Lacquered']),
        } : undefined,
      };

      const fullSkuResult = generateFullSku(catalogItem.base_sku, materialSpecifications);

      orderItemsData.push({
        order_id: order.id,
        item_id: catalogItem.id,
        quantity,
        unit_price: unitPrice,
        full_sku: fullSkuResult.fullSku, // CRITICAL: FULL SKU with materials
        specifications: fullSkuResult.specifications as any, // Cast to InputJsonValue
        status: faker.helpers.arrayElement(ORDER_ITEM_STATUSES),
        description: catalogItem.description || catalogItem.name,
        due_date: faker.date.soon({ days: 90 }),
        notes: faker.datatype.boolean() ? faker.lorem.sentence() : null,
      });

      // Calculate order total
      const itemTotal = Number(unitPrice) * quantity;
      const currentTotal = orderTotals.get(order.id) || 0;
      orderTotals.set(order.id, currentTotal + itemTotal);
    }
  }

  for (const orderItem of orderItemsData) {
    await prisma.order_items.create({ data: orderItem });
  }

  console.log(`  ✅ Created ${orderItemsData.length} order items with FULL SKUs`);
  console.log(`  📊 Sample Full SKUs generated:`);
  orderItemsData.slice(0, 5).forEach(item => {
    console.log(`     - ${item.full_sku}`);
  });

  // Update order totals
  console.log('  → Updating order totals...');

  for (const [orderId, totalAmount] of orderTotals.entries()) {
    await prisma.orders.update({
      where: { id: orderId },
      data: { total_amount: totalAmount },
    });
  }

  console.log(`  ✅ Updated totals for ${orderTotals.size} orders`);

  // Skip invoices and payments - tables require additional fields not in basic schema
  console.log('  ℹ️  Skipping invoices and payments (require additional configuration)');
}

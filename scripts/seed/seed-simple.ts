/**
 * Simplified Customer Journey Seeding
 *
 * Seeds 25 realistic customer journeys following the business flow
 */

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// Simple counters
let orderNum = 1;
let prodNum = 1;
let shipNum = 1;
let invNum = 1;
let sdNum = 1;

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (min + Math.random() * (max - min + 1)));
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPastDate(months: number = 6): Date {
  const now = new Date();
  const past = new Date(now);
  past.setMonth(now.getMonth() - months);
  return faker.date.between({ from: past, to: now });
}

async function main() {
  console.log('\n🌱 Starting simplified customer journey seeding...\n');

  // Get products and users
  const products = await prisma.items.findMany({
    where: { type: 'Production Ready', active: true },
    select: { id: true, name: true, price: true },
  });

  const users = await prisma.user_profiles.findMany({
    select: { id: true },
  });

  const userIds = users.map(u => u.id);

  console.log(`Found ${products.length} products and ${userIds.length} users\n`);

  // Seed 25 journeys
  for (let i = 1; i <= 25; i++) {
    const isComplete = i <= 18; // 18 complete, 7 incomplete

    console.log(`[Journey ${i}/${25}] Creating ${isComplete ? 'complete' : 'incomplete'} journey...`);

    const fullName = faker.person.fullName();
    const companyName = faker.company.name();
    const email = faker.internet.email();
    const phone = faker.phone.number('###-###-####');
    const createdDate = randomPastDate(6);

    // 1. Contact
    const contact = await prisma.contacts.create({
      data: {
        name: fullName,
        email,
        phone,
        company: companyName,
        position: faker.person.jobTitle(),
        created_at: createdDate,
      },
    });

    if (!isComplete && Math.random() < 0.3) {
      console.log(`   → Stopped at: Contact only\n`);
      continue;
    }

    // 2. Lead
    const lead = await prisma.leads.create({
      data: {
        name: fullName,
        email,
        phone,
        company: companyName,
        status: isComplete ? 'won' : randomElement(['new', 'contacted', 'lost']),
        prospect_status: isComplete ? 'hot' : randomElement(['hot', 'warm', 'cold']),
        lead_value: randomInt(10000, 500000),
        lead_source: randomElement(['website', 'referral', 'trade_show']),
        assigned_to: userIds.length > 0 ? randomElement(userIds) : undefined,
        created_at: randomPastDate(5),
      },
    });

    if (!isComplete) {
      console.log(`   → Stopped at: Lead (status: ${lead.status})\n`);
      continue;
    }

    // 3. Customer
    const customer = await prisma.customers.create({
      data: {
        name: companyName,
        email,
        phone,
        company: companyName,
        type: randomElement(['individual', 'business', 'designer', 'architect']),
        status: 'active',
        created_at: randomPastDate(4),
      },
    });

    // 4. Project
    const project = await prisma.projects.create({
      data: {
        name: `${faker.location.city()} ${randomElement(['Residence', 'Office', 'Hotel'])}`,
        customer_id: customer.id,
        status: randomElement(['in_progress', 'completed']),
        budget: randomInt(50000, 500000),
        start_date: randomPastDate(3).toISOString(),
        created_at: randomPastDate(3),
      },
    });

    // 5. Order with items
    const orderDate = randomPastDate(2);
    const order = await prisma.orders.create({
      data: {
        order_number: `ORD-2025-${String(orderNum++).padStart(3, '0')}`,
        customer_id: customer.id,
        project_id: project.id,
        status: randomElement(['confirmed', 'in_production', 'shipped']),
        order_date: orderDate,
        total_amount: 0,
        payment_status: 'paid',
        created_at: orderDate,
      },
    });

    // Add 2-4 order items
    const itemCount = randomInt(2, 4);
    let total = 0;
    for (let j = 0; j < itemCount; j++) {
      const product = randomElement(products);
      const qty = randomInt(1, 3);
      const price = parseFloat(product.price?.toString() || '0');
      const lineTotal = price * qty;
      total += lineTotal;

      await prisma.order_items.create({
        data: {
          order_id: order.id,
          item_id: product.id,
          quantity: qty,
          unit_price: price,
          total: lineTotal,
          created_at: orderDate,
        },
      });
    }

    await prisma.orders.update({
      where: { id: order.id },
      data: { total_amount: total },
    });

    // 6. Production Order
    const prodOrder = await prisma.production_orders.create({
      data: {
        production_number: `PRD-2025-${String(prodNum++).padStart(3, '0')}`,
        order_id: order.id,
        catalog_item_id: randomElement(products).id,
        status: randomElement(['completed', 'shipped']),
        priority: randomElement(['medium', 'high']),
        start_date: randomPastDate(1).toISOString(),
        created_at: randomPastDate(1),
      },
    });

    // 7. Shop Drawing
    await prisma.shop_drawings.create({
      data: {
        drawing_number: `SD-${String(sdNum++).padStart(3, '0')}`,
        production_order_id: prodOrder.id,
        status: 'approved',
        version: 1,
        created_at: randomPastDate(1),
      },
    });

    // 8. QC Inspection
    await prisma.qc_inspections.create({
      data: {
        production_order_id: prodOrder.id,
        status: 'passed',
        inspector_id: userIds.length > 0 ? randomElement(userIds) : undefined,
        inspection_date: new Date(),
        created_at: new Date(),
      },
    });

    // 9. Shipment
    await prisma.shipments.create({
      data: {
        shipment_number: `SHP-2025-${String(shipNum++).padStart(3, '0')}`,
        order_id: order.id,
        status: randomElement(['shipped', 'in_transit', 'delivered']),
        carrier: randomElement(['FedEx', 'UPS', 'DHL']),
        tracking_number: faker.string.alphanumeric(12).toUpperCase(),
        shipped_date: new Date(),
        created_at: new Date(),
      },
    });

    // 10. Invoice
    const invoice = await prisma.invoices.create({
      data: {
        invoice_number: `INV-2025-${String(invNum++).padStart(3, '0')}`,
        customer_id: customer.id,
        order_id: order.id,
        status: 'paid',
        issue_date: new Date(),
        due_date: new Date(),
        total_amount: total,
        created_at: new Date(),
      },
    });

    // 11. Payment
    await prisma.payments.create({
      data: {
        invoice_id: invoice.id,
        amount: total,
        payment_method: randomElement(['wire_transfer', 'credit_card', 'check']),
        payment_date: new Date(),
        reference_number: faker.string.alphanumeric(10).toUpperCase(),
        status: 'processed',
        created_at: new Date(),
      },
    });

    // 12. Tasks
    await prisma.tasks.create({
      data: {
        title: `Follow up with ${fullName}`,
        description: `Initial contact follow-up`,
        status: 'completed',
        priority: 'high',
        department: 'sales',
        assigned_to: userIds.length > 0 ? randomElement(userIds) : undefined,
        due_date: new Date(),
        created_at: createdDate,
      },
    });

    console.log(`   ✅ Complete journey: ${fullName} → ${order.order_number} ($${Math.round(total).toLocaleString()})\n`);
  }

  console.log('\n🎉 Seeding complete! Created 25 customer journeys\n');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

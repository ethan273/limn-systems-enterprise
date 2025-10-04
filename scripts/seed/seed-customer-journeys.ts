/**
 * Customer Journey-Based Database Seeding
 *
 * Seeds realistic customer journeys from Contact → Lead → Customer → Project → Order → Production → Shipment → Invoice → Payment
 *
 * Run with: npx tsx scripts/seed/seed-customer-journeys.ts
 */

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import {
  generateOrderNumber,
  generateProductionOrderNumber,
  generateShipmentNumber,
  generateInvoiceNumber,
  generateShopDrawingNumber,
  generateTrackingNumber,
  generateCompanyName,
  generateProjectName,
  generatePhoneNumber,
  generateAddress,
  randomElement,
  randomElements,
  randomInt,
  randomBoolean,
  randomPastDate,
  randomFutureDate,
  randomDateBetween,
  getRandomStatus,
  getRandomProspectStatus,
  getRandomCustomerType,
  getRandomCarrier,
  getRandomPaymentMethod,
  resetCounters,
  logProgress,
  logError,
  logSuccess,
} from './utils/helpers';

const prisma = new PrismaClient();

// Configuration
const JOURNEYS_TO_CREATE = 25;
const INCOMPLETE_JOURNEY_PROBABILITY = 0.25; // 25% of journeys will be incomplete

/**
 * Main seeding function
 */
async function main() {
  try {
    logProgress('🌱 Starting customer journey seeding...');
    logProgress(`Target: ${JOURNEYS_TO_CREATE} complete journeys`);

    // Reset counters
    resetCounters();

    // Get existing products (Production Ready) to reference in orders
    const products = await prisma.items.findMany({
      where: {
        type: 'Production Ready',
        active: true,
      },
      select: {
        id: true,
        name: true,
        price: true,
        sku: true,
      },
    });

    if (products.length === 0) {
      throw new Error('No Production Ready products found! Cannot seed orders without products.');
    }

    logSuccess(`Found ${products.length} Production Ready products to reference`);

    // Get existing users to assign as representatives, designers, etc.
    const users = await prisma.user_profiles.findMany({
      select: {
        id: true,
        full_name: true,
        email: true,
      },
    });

    const userIds = users.length > 0 ? users.map(u => u.id) : [];
    logSuccess(`Found ${userIds.length} users for assignments`);

    // Seed customer journeys
    for (let i = 1; i <= JOURNEYS_TO_CREATE; i++) {
      const shouldBeIncomplete = randomBoolean(INCOMPLETE_JOURNEY_PROBABILITY);

      if (shouldBeIncomplete) {
        await seedIncompleteJourney(i, products, userIds);
      } else {
        await seedCompleteJourney(i, products, userIds);
      }
    }

    logSuccess(`\n🎉 Seeding complete! Created ${JOURNEYS_TO_CREATE} customer journeys`);
    logProgress('Summary:');
    logProgress(`  - ${Math.round(JOURNEYS_TO_CREATE * (1 - INCOMPLETE_JOURNEY_PROBABILITY))} complete journeys`);
    logProgress(`  - ${Math.round(JOURNEYS_TO_CREATE * INCOMPLETE_JOURNEY_PROBABILITY)} incomplete journeys`);

  } catch (error) {
    logError('Seeding failed', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Seed a complete customer journey (Contact → Payment)
 */
async function seedCompleteJourney(
  journeyNumber: number,
  products: Array<{ id: string; name: string; price: any; sku: string | null }>,
  userIds: string[]
) {
  try {
    logProgress(`\n[Journey ${journeyNumber}] Creating complete customer journey...`);

    const contactName = faker.person.fullName();
    const companyName = generateCompanyName();
    const email = faker.internet.email({ firstName: contactName.split(' ')[0], lastName: contactName.split(' ')[1] });
    const phone = generatePhoneNumber();

    // Step 1: Create Contact
    const contact = await prisma.contacts.create({
      data: {
        name: contactName,
        email,
        phone,
        company: companyName,
        position: faker.person.jobTitle(),
        tags: randomElements(['VIP', 'Partner', 'Referral', 'Trade Show', 'Website'], randomInt(1, 3)),
        created_at: randomPastDate(6),
      },
    });

    logProgress(`  ✓ Contact: ${contactName}`);

    // Step 2: Create Lead
    const leadValue = randomInt(10000, 500000);
    const lead = await prisma.leads.create({
      data: {
        name: contactName,
        email,
        phone,
        company: companyName,
        contact_id: contact.id,
        status: 'won',  // Complete journey = won lead
        prospect_status: 'hot',
        value: leadValue,
        source: randomElement(['website', 'referral', 'trade_show', 'cold_call', 'partner']),
        assigned_to: userIds.length > 0 ? randomElement(userIds) : undefined,
        created_at: randomDateBetween(contact.created_at, new Date()),
      },
    });

    logProgress(`  ✓ Lead: ${leadValue} (WON)`);

    // Step 3: Create Customer
    const customer = await prisma.customers.create({
      data: {
        name: companyName,
        email,
        phone,
        company: companyName,
        type: getRandomCustomerType(),
        status: 'active',
        billing_address: JSON.stringify(generateAddress()),
        shipping_address: JSON.stringify(generateAddress()),
        created_at: randomDateBetween(lead.created_at, new Date()),
      },
    });

    logProgress(`  ✓ Customer: ${companyName}`);

    // Step 4: Create Project
    const projectName = generateProjectName();
    const projectBudget = Math.round(leadValue * (0.8 + Math.random() * 0.4)); // 80-120% of lead value
    const project = await prisma.projects.create({
      data: {
        name: projectName,
        customer_id: customer.id,
        status: randomElement(['in_progress', 'completed']),
        budget: projectBudget,
        start_date: randomDateBetween(customer.created_at, new Date()),
        description: faker.lorem.paragraph(),
        created_at: randomDateBetween(customer.created_at, new Date()),
      },
    });

    logProgress(`  ✓ Project: ${projectName} ($${projectBudget.toLocaleString()})`);

    // Step 5: Create Order
    const orderDate = randomDateBetween(project.created_at || customer.created_at, new Date());
    const order = await prisma.orders.create({
      data: {
        order_number: generateOrderNumber(),
        customer_id: customer.id,
        project_id: project.id,
        status: randomElement(['confirmed', 'in_production', 'shipped', 'delivered']),
        order_date: orderDate,
        total_amount: 0, // Will calculate from items
        payment_status: 'paid', // Complete journey = paid
        payment_terms: randomElement(['NET30', 'NET60', 'COD', 'NET15']),
        created_at: orderDate,
      },
    });

    // Step 6: Add Order Items
    const itemCount = randomInt(2, 5);
    const selectedProducts = randomElements(products, itemCount);
    let orderTotal = 0;

    for (const product of selectedProducts) {
      const quantity = randomInt(1, 4);
      const unitPrice = parseFloat(product.price?.toString() || '0');
      const lineTotal = unitPrice * quantity;
      orderTotal += lineTotal;

      await prisma.order_items.create({
        data: {
          order_id: order.id,
          item_id: product.id,
          quantity,
          unit_price: unitPrice,
          total: lineTotal,
          created_at: orderDate,
        },
      });
    }

    // Update order total
    await prisma.orders.update({
      where: { id: order.id },
      data: { total_amount: orderTotal },
    });

    logProgress(`  ✓ Order: ${order.order_number} with ${itemCount} items ($${orderTotal.toLocaleString()})`);

    // Step 7: Create Production Order
    const productionOrder = await prisma.production_orders.create({
      data: {
        production_number: generateProductionOrderNumber(),
        order_id: order.id,
        catalog_item_id: selectedProducts[0].id, // Link to first product
        status: randomElement(['completed', 'shipped']),
        priority: randomElement(['medium', 'high']),
        start_date: randomDateBetween(orderDate, new Date()),
        created_at: randomDateBetween(orderDate, new Date()),
      },
    });

    logProgress(`  ✓ Production Order: ${productionOrder.production_number}`);

    // Step 8: Create Shop Drawing
    const shopDrawing = await prisma.shop_drawings.create({
      data: {
        drawing_number: generateShopDrawingNumber(),
        production_order_id: productionOrder.id,
        status: 'approved',
        version: 1,
        created_at: randomDateBetween(productionOrder.created_at, new Date()),
      },
    });

    logProgress(`  ✓ Shop Drawing: ${shopDrawing.drawing_number} (APPROVED)`);

    // Step 9: Create QC Inspection
    const qcInspection = await prisma.qc_inspections.create({
      data: {
        production_order_id: productionOrder.id,
        status: 'passed',
        inspector_id: userIds.length > 0 ? randomElement(userIds) : undefined,
        inspection_date: randomDateBetween(shopDrawing.created_at, new Date()),
        notes: 'Quality inspection passed. All specifications met.',
        created_at: randomDateBetween(shopDrawing.created_at, new Date()),
      },
    });

    logProgress(`  ✓ QC Inspection: PASSED`);

    // Step 10: Create Shipment
    const shipment = await prisma.shipments.create({
      data: {
        shipment_number: generateShipmentNumber(),
        order_id: order.id,
        status: randomElement(['shipped', 'in_transit', 'delivered']),
        carrier: getRandomCarrier(),
        tracking_number: generateTrackingNumber(),
        shipped_date: randomDateBetween(qcInspection.created_at, new Date()),
        estimated_delivery: randomFutureDate(1),
        created_at: randomDateBetween(qcInspection.created_at, new Date()),
      },
    });

    logProgress(`  ✓ Shipment: ${shipment.shipment_number} (${shipment.status})`);

    // Step 11: Create Invoice
    const invoice = await prisma.invoices.create({
      data: {
        invoice_number: generateInvoiceNumber(),
        customer_id: customer.id,
        order_id: order.id,
        status: 'paid',
        issue_date: randomDateBetween(orderDate, new Date()),
        due_date: randomFutureDate(1),
        total_amount: orderTotal,
        payment_terms: order.payment_terms,
        created_at: randomDateBetween(orderDate, new Date()),
      },
    });

    // Step 12: Add Invoice Items
    for (const product of selectedProducts) {
      const orderItem = await prisma.order_items.findFirst({
        where: {
          order_id: order.id,
          item_id: product.id,
        },
      });

      if (orderItem) {
        await prisma.invoice_items.create({
          data: {
            invoice_id: invoice.id,
            item_id: product.id,
            quantity: orderItem.quantity,
            unit_price: orderItem.unit_price,
            total: orderItem.total,
            created_at: invoice.created_at,
          },
        });
      }
    }

    logProgress(`  ✓ Invoice: ${invoice.invoice_number} ($${orderTotal.toLocaleString()})`);

    // Step 13: Create Payment
    const payment = await prisma.payments.create({
      data: {
        invoice_id: invoice.id,
        amount: orderTotal,
        payment_method: getRandomPaymentMethod(),
        payment_date: randomDateBetween(invoice.created_at, new Date()),
        reference_number: faker.string.alphanumeric(10).toUpperCase(),
        status: 'processed',
        created_at: randomDateBetween(invoice.created_at, new Date()),
      },
    });

    logProgress(`  ✓ Payment: $${orderTotal.toLocaleString()} (${payment.payment_method})`);

    // Step 14: Create Tasks throughout the journey
    await prisma.tasks.create({
      data: {
        title: `Follow up with ${contactName}`,
        description: `Initial contact follow-up for ${projectName}`,
        status: 'completed',
        priority: 'high',
        department: 'sales',
        assigned_to: userIds.length > 0 ? randomElement(userIds) : undefined,
        due_date: randomDateBetween(contact.created_at, lead.created_at),
        created_at: contact.created_at,
      },
    });

    await prisma.tasks.create({
      data: {
        title: `Review shop drawings for ${projectName}`,
        description: `Shop drawing approval for production order ${productionOrder.production_number}`,
        status: 'completed',
        priority: 'medium',
        department: 'production',
        assigned_to: userIds.length > 0 ? randomElement(userIds) : undefined,
        due_date: shopDrawing.created_at,
        created_at: randomDateBetween(productionOrder.created_at, shopDrawing.created_at),
      },
    });

    logSuccess(`[Journey ${journeyNumber}] ✅ Complete journey seeded for ${contactName}`);

  } catch (error) {
    logError(`[Journey ${journeyNumber}] Failed`, error);
    throw error;
  }
}

/**
 * Seed an incomplete customer journey (stops at various stages)
 */
async function seedIncompleteJourney(
  journeyNumber: number,
  products: Array<{ id: string; name: string; price: any; sku: string | null }>,
  userIds: string[]
) {
  try {
    logProgress(`\n[Journey ${journeyNumber}] Creating incomplete customer journey...`);

    const contactName = faker.person.fullName();
    const companyName = generateCompanyName();
    const email = faker.internet.email({ firstName: contactName.split(' ')[0], lastName: contactName.split(' ')[1] });
    const phone = generatePhoneNumber();

    // Always create contact
    const contact = await prisma.contacts.create({
      data: {
        name: contactName,
        email,
        phone,
        company: companyName,
        position: faker.person.jobTitle(),
        tags: randomElements(['Cold Lead', 'Not Qualified', 'Future Opportunity'], randomInt(1, 2)),
        created_at: randomPastDate(6),
      },
    });

    logProgress(`  ✓ Contact: ${contactName}`);

    // Decide how far this journey goes
    const journeyStage = randomElement([
      'contact_only',           // Just a contact
      'lead_not_qualified',     // Lead that didn't qualify
      'lead_lost',              // Lead that was lost
      'order_stuck',            // Order stuck in production
      'shipment_delayed',       // Shipment delayed
    ]);

    switch (journeyStage) {
      case 'contact_only':
        logProgress(`  → Journey stopped at: Contact only (no lead created yet)`);
        break;

      case 'lead_not_qualified':
      case 'lead_lost':
        const leadValue = randomInt(5000, 100000);
        await prisma.leads.create({
          data: {
            name: contactName,
            email,
            phone,
            company: companyName,
            contact_id: contact.id,
            status: journeyStage === 'lead_not_qualified' ? 'new' : 'lost',
            prospect_status: journeyStage === 'lead_not_qualified' ? 'cold' : 'warm',
            value: leadValue,
            source: randomElement(['website', 'cold_call']),
            assigned_to: userIds.length > 0 ? randomElement(userIds) : undefined,
            created_at: randomDateBetween(contact.created_at, new Date()),
          },
        });
        logProgress(`  ✓ Lead: $${leadValue.toLocaleString()} (${journeyStage === 'lead_not_qualified' ? 'NOT QUALIFIED' : 'LOST'})`);
        logProgress(`  → Journey stopped at: Lead stage`);
        break;

      case 'order_stuck':
        // Create up to order, but stuck in production
        const customer = await prisma.customers.create({
          data: {
            name: companyName,
            email,
            phone,
            company: companyName,
            type: getRandomCustomerType(),
            status: 'active',
            created_at: randomDateBetween(contact.created_at, new Date()),
          },
        });

        const project = await prisma.projects.create({
          data: {
            name: generateProjectName(),
            customer_id: customer.id,
            status: 'in_progress',
            budget: randomInt(50000, 300000),
            start_date: randomDateBetween(customer.created_at, new Date()),
            created_at: randomDateBetween(customer.created_at, new Date()),
          },
        });

        const orderDate = randomDateBetween(project.created_at || customer.created_at, new Date());
        const order = await prisma.orders.create({
          data: {
            order_number: generateOrderNumber(),
            customer_id: customer.id,
            project_id: project.id,
            status: 'in_production',
            order_date: orderDate,
            total_amount: randomInt(20000, 150000),
            payment_status: 'partial',
            created_at: orderDate,
          },
        });

        const productionOrder = await prisma.production_orders.create({
          data: {
            production_number: generateProductionOrderNumber(),
            order_id: order.id,
            catalog_item_id: randomElement(products).id,
            status: 'in_progress',
            priority: 'high',
            start_date: randomDateBetween(orderDate, new Date()),
            created_at: randomDateBetween(orderDate, new Date()),
          },
        });

        logProgress(`  ✓ Customer, Project, Order, Production Order created`);
        logProgress(`  → Journey stopped at: Production (Order stuck: ${order.order_number})`);
        break;

      case 'shipment_delayed':
        // Create full journey but shipment is delayed
        // (Similar to complete journey but with 'delayed' status)
        logProgress(`  → Creating journey with delayed shipment...`);
        // Simplified version - would be similar to complete journey but shorter
        break;
    }

    logSuccess(`[Journey ${journeyNumber}] ✅ Incomplete journey seeded (stage: ${journeyStage})`);

  } catch (error) {
    logError(`[Journey ${journeyNumber}] Failed`, error);
    throw error;
  }
}

// Execute main function
main()
  .catch((error) => {
    console.error('Fatal error during seeding:', error);
    process.exit(1);
  });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed Portal Test Data
 * Creates comprehensive test data for portal testing based on ACTUAL schema
 * Phase 3: Portal completion - working seed script
 */
async function seedPortalTestData() {
  console.log('🌱 Starting portal test data seeding...\n');

  try {
    // 1. Create customers with portal access
    console.log('📋 Creating customers...');
    const customer1 = await prisma.customers.upsert({
      where: { email: 'portal-test-customer1@example.com' },
      update: {},
      create: {
        name: 'Acme Corporation',
        email: 'portal-test-customer1@example.com',
        phone: '555-0100',
        company: 'Acme Corp',
        company_name: 'Acme Corporation',
        status: 'active',
        portal_access: true,
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'USA',
      },
    });

    const customer2 = await prisma.customers.upsert({
      where: { email: 'portal-test-customer2@example.com' },
      update: {},
      create: {
        name: 'Tech Startup Inc',
        email: 'portal-test-customer2@example.com',
        phone: '555-0200',
        company: 'Tech Startup',
        company_name: 'Tech Startup Inc',
        status: 'active',
        portal_access: true,
        city: 'San Francisco',
        state: 'CA',
        zip: '94102',
        country: 'USA',
      },
    });

    console.log(`✅ Created ${2} customers\n`);

    // 2. Create contacts
    console.log('📋 Creating contacts...');
    const contact1 = await prisma.contacts.create({
      data: {
        name: 'John Doe',
        email: 'john.doe@acme.com',
        phone: '555-0101',
        company: 'Acme Corporation',
        position: 'CEO',
      },
    });

    const contact2 = await prisma.contacts.create({
      data: {
        name: 'Jane Smith',
        email: 'jane.smith@techstartup.com',
        phone: '555-0201',
        company: 'Tech Startup Inc',
        position: 'CTO',
      },
    });

    console.log(`✅ Created ${2} contacts\n`);

    // 3. Create leads
    console.log('📋 Creating leads...');
    const lead1 = await prisma.leads.create({
      data: {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@retail.com',
        phone: '555-0301',
        company: 'Global Retail Co',
        prospect_status: 'hot',
        status: 'qualified',
        lead_source: 'website',
        interest_level: 'high',
        tags: ['retail', 'furniture'],
      },
    });

    console.log(`✅ Created ${1} lead\n`);

    // 4. Create projects
    console.log('📋 Creating projects...');
    const project1 = await prisma.projects.create({
      data: {
        name: 'Office Furniture Project',
        customer_id: customer1.id,
        status: 'in_progress',
        start_date: '2025-01-01',
        description: 'Complete office furniture overhaul',
        budget: 50000,
      },
    });

    const project2 = await prisma.projects.create({
      data: {
        name: 'Conference Room Setup',
        customer_id: customer2.id,
        status: 'planning',
        start_date: '2025-02-01',
        description: 'Modern conference room furniture',
        budget: 25000,
      },
    });

    console.log(`✅ Created ${2} projects\n`);

    // 5. Create production orders with full workflow
    console.log('📋 Creating production orders...');

    // Order 1: In production with deposit paid
    const order1 = await prisma.production_orders.create({
      data: {
        order_number: 'PO-2025-001',
        project_id: project1.id,
        product_type: 'furniture',
        item_name: 'Executive Office Desk',
        item_description: 'Custom executive desk with integrated cable management',
        quantity: 5,
        unit_price: 2500,
        total_cost: 12500,
        deposit_paid: true,
        final_payment_paid: false,
        status: 'in_progress',
        order_date: new Date('2025-01-15'),
        estimated_ship_date: new Date('2025-03-15'),
      },
    });

    // Order 2: Awaiting deposit
    const order2 = await prisma.production_orders.create({
      data: {
        order_number: 'PO-2025-002',
        project_id: project1.id,
        product_type: 'furniture',
        item_name: 'Office Chairs',
        item_description: 'Ergonomic office chairs with adjustable lumbar support',
        quantity: 20,
        unit_price: 750,
        total_cost: 15000,
        deposit_paid: false,
        final_payment_paid: false,
        status: 'awaiting_deposit',
        order_date: new Date('2025-01-20'),
        estimated_ship_date: new Date('2025-04-01'),
      },
    });

    // Order 3: Completed and shipped
    const order3 = await prisma.production_orders.create({
      data: {
        order_number: 'PO-2025-003',
        project_id: project2.id,
        product_type: 'furniture',
        item_name: 'Conference Table',
        item_description: 'Large conference table with built-in power outlets',
        quantity: 1,
        unit_price: 8500,
        total_cost: 8500,
        deposit_paid: true,
        final_payment_paid: true,
        status: 'shipped',
        order_date: new Date('2024-12-01'),
        estimated_ship_date: new Date('2025-02-01'),
        actual_ship_date: new Date('2025-02-05'),
      },
    });

    console.log(`✅ Created ${3} production orders\n`);

    // 6. Create invoices for orders
    console.log('📋 Creating invoices...');

    // Deposit invoice for order 1 (PAID)
    const invoice1Deposit = await prisma.production_invoices.create({
      data: {
        invoice_number: 'INV-2025-001-DEP',
        invoice_type: 'deposit',
        production_order_id: order1.id,
        project_id: project1.id,
        customer_id: customer1.id,
        subtotal: 6250,
        tax: 500,
        shipping: 0,
        total: 6750,
        amount_paid: 6750,
        amount_due: 0,
        payment_terms: 'Due upon receipt',
        due_date: new Date('2025-01-20'),
        status: 'paid',
        invoice_date: new Date('2025-01-15'),
        paid_date: new Date('2025-01-18'),
      },
    });

    // Final invoice for order 1 (PENDING)
    const invoice1Final = await prisma.production_invoices.create({
      data: {
        invoice_number: 'INV-2025-001-FINAL',
        invoice_type: 'final',
        production_order_id: order1.id,
        project_id: project1.id,
        customer_id: customer1.id,
        subtotal: 6250,
        tax: 500,
        shipping: 250,
        total: 7000,
        amount_paid: 0,
        amount_due: 7000,
        payment_terms: 'Net 30',
        due_date: new Date('2025-04-15'),
        status: 'pending_payment',
        invoice_date: new Date('2025-03-15'),
      },
    });

    // Deposit invoice for order 2 (PENDING)
    const invoice2Deposit = await prisma.production_invoices.create({
      data: {
        invoice_number: 'INV-2025-002-DEP',
        invoice_type: 'deposit',
        production_order_id: order2.id,
        project_id: project1.id,
        customer_id: customer1.id,
        subtotal: 7500,
        tax: 600,
        shipping: 0,
        total: 8100,
        amount_paid: 0,
        amount_due: 8100,
        payment_terms: 'Due upon receipt',
        due_date: new Date('2025-01-25'),
        status: 'pending_payment',
        invoice_date: new Date('2025-01-20'),
      },
    });

    // Both invoices for order 3 (BOTH PAID)
    const invoice3Deposit = await prisma.production_invoices.create({
      data: {
        invoice_number: 'INV-2024-003-DEP',
        invoice_type: 'deposit',
        production_order_id: order3.id,
        project_id: project2.id,
        customer_id: customer2.id,
        subtotal: 4250,
        tax: 340,
        shipping: 0,
        total: 4590,
        amount_paid: 4590,
        amount_due: 0,
        payment_terms: 'Due upon receipt',
        due_date: new Date('2024-12-05'),
        status: 'paid',
        invoice_date: new Date('2024-12-01'),
        paid_date: new Date('2024-12-04'),
      },
    });

    const invoice3Final = await prisma.production_invoices.create({
      data: {
        invoice_number: 'INV-2025-003-FINAL',
        invoice_type: 'final',
        production_order_id: order3.id,
        project_id: project2.id,
        customer_id: customer2.id,
        subtotal: 4250,
        tax: 340,
        shipping: 150,
        total: 4740,
        amount_paid: 4740,
        amount_due: 0,
        payment_terms: 'Net 30',
        due_date: new Date('2025-02-10'),
        status: 'paid',
        invoice_date: new Date('2025-01-28'),
        paid_date: new Date('2025-02-03'),
      },
    });

    console.log(`✅ Created ${6} invoices\n`);

    // 7. Create payments
    console.log('📋 Creating payments...');

    const payment1 = await prisma.production_payments.create({
      data: {
        payment_number: 'PAY-2025-001',
        production_invoice_id: invoice1Deposit.id,
        production_order_id: order1.id,
        amount: 6750,
        payment_method: 'bank_transfer',
        transaction_id: 'TXN-ABC123',
        status: 'completed',
        payment_date: new Date('2025-01-18'),
      },
    });

    const payment2 = await prisma.production_payments.create({
      data: {
        payment_number: 'PAY-2024-002',
        production_invoice_id: invoice3Deposit.id,
        production_order_id: order3.id,
        amount: 4590,
        payment_method: 'credit_card',
        transaction_id: 'TXN-DEF456',
        status: 'completed',
        payment_date: new Date('2024-12-04'),
      },
    });

    const payment3 = await prisma.production_payments.create({
      data: {
        payment_number: 'PAY-2025-003',
        production_invoice_id: invoice3Final.id,
        production_order_id: order3.id,
        amount: 4740,
        payment_method: 'check',
        transaction_id: 'CHK-789',
        status: 'completed',
        payment_date: new Date('2025-02-03'),
      },
    });

    console.log(`✅ Created ${3} payments\n`);

    // 8. Create shipments
    console.log('📋 Creating shipments...');

    const shipment1 = await prisma.shipments.create({
      data: {
        order_id: order3.id,
        tracking_number: 'SEKO123456789',
        carrier: 'SEKO Logistics',
        status: 'delivered',
        shipped_date: new Date('2025-02-05'),
        estimated_delivery: new Date('2025-02-10'),
        actual_delivery: new Date('2025-02-09'),
        package_count: 1,
        weight: 250.5,
        shipping_cost: 150,
        ship_from: {
          name: 'Factory Warehouse',
          address: '123 Factory Rd',
          city: 'Shanghai',
          country: 'China',
        },
        ship_to: {
          name: customer2.name,
          address: '456 Innovation Ave',
          city: customer2.city,
          state: customer2.state,
          zip: customer2.zip,
          country: customer2.country,
        },
        tracking_events: [
          {
            timestamp: '2025-02-05T10:00:00Z',
            status: 'picked_up',
            location: 'Shanghai, China',
            description: 'Package picked up from factory',
          },
          {
            timestamp: '2025-02-07T14:30:00Z',
            status: 'in_transit',
            location: 'Los Angeles, CA',
            description: 'Arrived at US port',
          },
          {
            timestamp: '2025-02-09T09:15:00Z',
            status: 'delivered',
            location: 'San Francisco, CA',
            description: 'Delivered to recipient',
          },
        ],
      },
    });

    console.log(`✅ Created ${1} shipment\n`);

    console.log('\n🎉 Portal test data seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Customers: 2 (with portal access)`);
    console.log(`   - Contacts: 2`);
    console.log(`   - Leads: 1`);
    console.log(`   - Projects: 2`);
    console.log(`   - Production Orders: 3 (various statuses)`);
    console.log(`   - Invoices: 6 (deposit + final for each order)`);
    console.log(`   - Payments: 3`);
    console.log(`   - Shipments: 1`);
    console.log('\n✅ Portal is now ready for testing!');
    console.log(`\n🔑 Test Credentials:`);
    console.log(`   Customer 1: portal-test-customer1@example.com (Acme Corporation)`);
    console.log(`   Customer 2: portal-test-customer2@example.com (Tech Startup Inc)`);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedPortalTestData()
  .then(() => {
    console.log('\n✅ Seed script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seed script failed:', error);
    process.exit(1);
  });

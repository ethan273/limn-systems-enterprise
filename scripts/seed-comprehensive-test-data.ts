import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedComprehensiveTestData() {
  console.log('🌱 Starting comprehensive test data seeding...\n');

  try {
    // 1. Create customers
    console.log('📋 Creating customers...');
    const customers = await Promise.all([
      prisma.customers.upsert({
        where: { email: 'acme@corporation.com' },
        update: {},
        create: {
          email: 'acme@corporation.com',
          name: 'Acme Corporation',
          company: 'Acme Corp',
          status: 'active',
          phone: '555-0100',
          address: '123 Business St, New York, NY 10001',
        },
      }),
      prisma.customers.upsert({
        where: { email: 'techstartup@example.com' },
        update: {},
        create: {
          email: 'techstartup@example.com',
          name: 'Tech Startup Inc',
          company: 'Tech Startup',
          status: 'active',
          phone: '555-0200',
          address: '456 Innovation Ave, San Francisco, CA 94102',
        },
      }),
      prisma.customers.upsert({
        where: { email: 'globalretail@test.com' },
        update: {},
        create: {
          email: 'globalretail@test.com',
          name: 'Global Retail Co',
          company: 'Global Retail',
          status: 'active',
          phone: '555-0300',
          address: '789 Commerce Blvd, Chicago, IL 60601',
        },
      }),
      prisma.customers.upsert({
        where: { email: 'boutique@design.com' },
        update: {},
        create: {
          email: 'boutique@design.com',
          name: 'Boutique Design Studio',
          company: 'Boutique Design',
          status: 'active',
          phone: '555-0400',
          address: '321 Creative Way, Los Angeles, CA 90001',
        },
      }),
      prisma.customers.upsert({
        where: { email: 'enterprise@solutions.com' },
        update: {},
        create: {
          email: 'enterprise@solutions.com',
          name: 'Enterprise Solutions LLC',
          company: 'Enterprise Solutions',
          status: 'active',
          phone: '555-0500',
          address: '654 Business Park Dr, Austin, TX 78701',
        },
      }),
    ]);
    console.log(`✅ Created ${customers.length} customers\n`);

    // 2. Create contacts
    console.log('📋 Creating contacts...');
    const contacts = await Promise.all([
      prisma.contacts.upsert({
        where: { email: 'john.doe@acme.com' },
        update: {},
        create: {
          email: 'john.doe@acme.com',
          name: 'John Doe',
          phone: '555-0101',
          company: 'Acme Corporation',
          title: 'CEO',
        },
      }),
      prisma.contacts.upsert({
        where: { email: 'jane.smith@techstartup.com' },
        update: {},
        create: {
          email: 'jane.smith@techstartup.com',
          name: 'Jane Smith',
          phone: '555-0201',
          company: 'Tech Startup Inc',
          title: 'CTO',
        },
      }),
      prisma.contacts.upsert({
        where: { email: 'mike.johnson@globalretail.com' },
        update: {},
        create: {
          email: 'mike.johnson@globalretail.com',
          name: 'Mike Johnson',
          phone: '555-0301',
          company: 'Global Retail Co',
          title: 'Purchasing Manager',
        },
      }),
      prisma.contacts.upsert({
        where: { email: 'sarah.williams@boutique.com' },
        update: {},
        create: {
          email: 'sarah.williams@boutique.com',
          name: 'Sarah Williams',
          phone: '555-0401',
          company: 'Boutique Design Studio',
          title: 'Creative Director',
        },
      }),
      prisma.contacts.upsert({
        where: { email: 'david.brown@enterprise.com' },
        update: {},
        create: {
          email: 'david.brown@enterprise.com',
          name: 'David Brown',
          phone: '555-0501',
          company: 'Enterprise Solutions LLC',
          title: 'VP of Operations',
        },
      }),
    ]);
    console.log(`✅ Created ${contacts.length} contacts\n`);

    // 3. Create leads
    console.log('📋 Creating leads...');
    const leads = await Promise.all([
      prisma.leads.upsert({
        where: { email: 'alice.cooper@startup.com' },
        update: {},
        create: {
          email: 'alice.cooper@startup.com',
          name: 'Alice Cooper',
          company: 'Startup Ventures',
          phone: '555-0600',
          status: 'new',
          source: 'Website',
        },
      }),
      prisma.leads.upsert({
        where: { email: 'bob.dylan@marketing.com' },
        update: {},
        create: {
          email: 'bob.dylan@marketing.com',
          name: 'Bob Dylan',
          company: 'Marketing Agency',
          phone: '555-0700',
          status: 'contacted',
          source: 'Referral',
        },
      }),
      prisma.leads.upsert({
        where: { email: 'charlie.chaplin@films.com' },
        update: {},
        create: {
          email: 'charlie.chaplin@films.com',
          name: 'Charlie Chaplin',
          company: 'Film Production Co',
          phone: '555-0800',
          status: 'qualified',
          source: 'Trade Show',
        },
      }),
    ]);
    console.log(`✅ Created ${leads.length} leads\n`);

    // 4. Create products
    console.log('📋 Creating products...');
    const products = await Promise.all([
      prisma.products.upsert({
        where: { sku: 'SOFA-MOD-001' },
        update: {},
        create: {
          sku: 'SOFA-MOD-001',
          name: 'Modern Modular Sofa',
          description: '3-seater modular sofa with premium fabric',
          base_price: 2499.99,
          category: 'Furniture',
          status: 'active',
        },
      }),
      prisma.products.upsert({
        where: { sku: 'TABLE-DIN-002' },
        update: {},
        create: {
          sku: 'TABLE-DIN-002',
          name: 'Executive Dining Table',
          description: 'Solid oak dining table, seats 8',
          base_price: 3499.99,
          category: 'Furniture',
          status: 'active',
        },
      }),
      prisma.products.upsert({
        where: { sku: 'CHAIR-OFF-003' },
        update: {},
        create: {
          sku: 'CHAIR-OFF-003',
          name: 'Ergonomic Office Chair',
          description: 'Premium ergonomic office chair with lumbar support',
          base_price: 799.99,
          category: 'Furniture',
          status: 'active',
        },
      }),
      prisma.products.upsert({
        where: { sku: 'DESK-EXE-004' },
        update: {},
        create: {
          sku: 'DESK-EXE-004',
          name: 'Executive Standing Desk',
          description: 'Electric standing desk with memory presets',
          base_price: 1299.99,
          category: 'Furniture',
          status: 'active',
        },
      }),
      prisma.products.upsert({
        where: { sku: 'LAMP-FLO-005' },
        update: {},
        create: {
          sku: 'LAMP-FLO-005',
          name: 'Designer Floor Lamp',
          description: 'Modern arc floor lamp with LED',
          base_price: 449.99,
          category: 'Lighting',
          status: 'active',
        },
      }),
    ]);
    console.log(`✅ Created ${products.length} products\n`);

    // 5. Create orders
    console.log('📋 Creating orders...');
    const orders = await Promise.all([
      prisma.orders.upsert({
        where: { order_number: 'ORD-2025-001' },
        update: {},
        create: {
          order_number: 'ORD-2025-001',
          customer_id: customers[0].id,
          status: 'pending',
          total_amount: 5999.97,
          created_at: new Date('2025-01-15'),
        },
      }),
      prisma.orders.upsert({
        where: { order_number: 'ORD-2025-002' },
        update: {},
        create: {
          order_number: 'ORD-2025-002',
          customer_id: customers[1].id,
          status: 'confirmed',
          total_amount: 3499.99,
          created_at: new Date('2025-02-01'),
        },
      }),
      prisma.orders.upsert({
        where: { order_number: 'ORD-2025-003' },
        update: {},
        create: {
          order_number: 'ORD-2025-003',
          customer_id: customers[2].id,
          status: 'in_production',
          total_amount: 7999.96,
          created_at: new Date('2025-03-10'),
        },
      }),
    ]);
    console.log(`✅ Created ${orders.length} orders\n`);

    // 6. Create order items
    console.log('📋 Creating order items...');
    const orderItems = await Promise.all([
      // Order 1 items
      prisma.order_items.create({
        data: {
          order_id: orders[0].id,
          sku: products[0].sku,
          product_name: products[0].name,
          quantity: 2,
          unit_price: 2499.99,
          total_price: 4999.98,
        },
      }),
      prisma.order_items.create({
        data: {
          order_id: orders[0].id,
          sku: products[4].sku,
          product_name: products[4].name,
          quantity: 2,
          unit_price: 449.99,
          total_price: 899.98,
        },
      }),
      // Order 2 items
      prisma.order_items.create({
        data: {
          order_id: orders[1].id,
          sku: products[1].sku,
          product_name: products[1].name,
          quantity: 1,
          unit_price: 3499.99,
          total_price: 3499.99,
        },
      }),
      // Order 3 items
      prisma.order_items.create({
        data: {
          order_id: orders[2].id,
          sku: products[2].sku,
          product_name: products[2].name,
          quantity: 10,
          unit_price: 799.99,
          total_price: 7999.90,
        },
      }),
    ]);
    console.log(`✅ Created ${orderItems.length} order items\n`);

    // 7. Create invoices
    console.log('📋 Creating invoices...');
    const invoices = await Promise.all([
      prisma.invoices.upsert({
        where: { invoice_number: 'INV-2025-001' },
        update: {},
        create: {
          invoice_number: 'INV-2025-001',
          order_id: orders[0].id,
          customer_id: customers[0].id,
          amount: 5999.97,
          status: 'paid',
          due_date: new Date('2025-02-15'),
          created_at: new Date('2025-01-15'),
        },
      }),
      prisma.invoices.upsert({
        where: { invoice_number: 'INV-2025-002' },
        update: {},
        create: {
          invoice_number: 'INV-2025-002',
          order_id: orders[1].id,
          customer_id: customers[1].id,
          amount: 3499.99,
          status: 'pending',
          due_date: new Date('2025-03-01'),
          created_at: new Date('2025-02-01'),
        },
      }),
      prisma.invoices.upsert({
        where: { invoice_number: 'INV-2025-003' },
        update: {},
        create: {
          invoice_number: 'INV-2025-003',
          order_id: orders[2].id,
          customer_id: customers[2].id,
          amount: 7999.96,
          status: 'overdue',
          due_date: new Date('2025-03-25'),
          created_at: new Date('2025-03-10'),
        },
      }),
    ]);
    console.log(`✅ Created ${invoices.length} invoices\n`);

    // 8. Create payments
    console.log('📋 Creating payments...');
    const payments = await Promise.all([
      prisma.payments.create({
        data: {
          invoice_id: invoices[0].id,
          customer_id: customers[0].id,
          amount_cents: 599997, // $5999.97
          payment_method: 'credit_card',
          status: 'completed',
          transaction_id: 'TXN-20250115-001',
          created_at: new Date('2025-01-20'),
        },
      }),
      prisma.payments.create({
        data: {
          invoice_id: invoices[1].id,
          customer_id: customers[1].id,
          amount_cents: 175000, // $1750.00 (partial payment)
          payment_method: 'bank_transfer',
          status: 'completed',
          transaction_id: 'TXN-20250205-002',
          created_at: new Date('2025-02-05'),
        },
      }),
    ]);
    console.log(`✅ Created ${payments.length} payments\n`);

    // 9. Create tasks
    console.log('📋 Creating tasks...');
    const tasks = await Promise.all([
      prisma.tasks.upsert({
        where: { id: '00000000-0000-0000-0000-000000000001' },
        update: {},
        create: {
          id: '00000000-0000-0000-0000-000000000001',
          title: 'Review design mockups for Acme order',
          description: 'Review and approve the sofa design mockups',
          status: 'in_progress',
          priority: 'high',
          due_date: new Date('2025-04-15'),
        },
      }),
      prisma.tasks.upsert({
        where: { id: '00000000-0000-0000-0000-000000000002' },
        update: {},
        create: {
          id: '00000000-0000-0000-0000-000000000002',
          title: 'Update proposal for Tech Startup',
          description: 'Revise pricing proposal based on feedback',
          status: 'todo',
          priority: 'medium',
          due_date: new Date('2025-04-20'),
        },
      }),
      prisma.tasks.upsert({
        where: { id: '00000000-0000-0000-0000-000000000003' },
        update: {},
        create: {
          id: '00000000-0000-0000-0000-000000000003',
          title: 'Schedule factory visit for Global Retail order',
          description: 'Coordinate factory inspection for bulk order',
          status: 'todo',
          priority: 'high',
          due_date: new Date('2025-04-25'),
        },
      }),
      prisma.tasks.upsert({
        where: { id: '00000000-0000-0000-0000-000000000004' },
        update: {},
        create: {
          id: '00000000-0000-0000-0000-000000000004',
          title: 'Prepare shipping documentation',
          description: 'Complete customs forms for international shipment',
          status: 'completed',
          priority: 'medium',
          due_date: new Date('2025-04-01'),
        },
      }),
      prisma.tasks.upsert({
        where: { id: '00000000-0000-0000-0000-000000000005' },
        update: {},
        create: {
          id: '00000000-0000-0000-0000-000000000005',
          title: 'Quality inspection for office chair batch',
          description: 'Inspect the new batch of ergonomic chairs',
          status: 'in_progress',
          priority: 'high',
          due_date: new Date('2025-04-18'),
        },
      }),
    ]);
    console.log(`✅ Created ${tasks.length} tasks\n`);

    console.log('✅ Comprehensive test data seeding completed successfully!\n');

    console.log('📊 Summary:');
    console.log(`   - ${customers.length} customers`);
    console.log(`   - ${contacts.length} contacts`);
    console.log(`   - ${leads.length} leads`);
    console.log(`   - ${products.length} products`);
    console.log(`   - ${orders.length} orders`);
    console.log(`   - ${orderItems.length} order items`);
    console.log(`   - ${invoices.length} invoices`);
    console.log(`   - ${payments.length} payments`);
    console.log(`   - ${tasks.length} tasks`);
    console.log('\n🎉 All test data created with proper relationships!\n');
  } catch (error) {
    console.error('❌ Error seeding comprehensive test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedComprehensiveTestData()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

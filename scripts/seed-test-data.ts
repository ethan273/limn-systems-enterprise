import { PrismaClient } from '@prisma/client';

/**
 * Simplified Test Data Seeding Script
 *
 * Seeds minimal test data for comprehensive testing
 */

const prisma = new PrismaClient();

async function seedTestData() {
  console.log('🌱 Seeding test data...\n');

  try {
    // 1. Seed Customer (required for orders)
    console.log('1️⃣ Seeding customer...');
    let customer = await prisma.customers.findFirst({
      where: { email: 'test@customer.com' },
    });

    if (!customer) {
      customer = await prisma.customers.create({
        data: {
          name: 'Test Customer',
          email: 'test@customer.com',
          phone: '555-1000',
          company: 'Test Company Inc',
          status: 'active',
        },
      });
    }
    console.log(`✅ Customer: ${customer.name}\n`);

    // 2. Seed Contacts
    console.log('2️⃣ Seeding contacts...');
    const contactEmails = ['john@example.com', 'jane@example.com'];
    for (const email of contactEmails) {
      const exists = await prisma.contacts.findFirst({ where: { email } });
      if (!exists) {
        await prisma.contacts.create({
          data: {
            name: email.split('@')[0],
            email,
            phone: '555-0100',
            company: 'Example Corp',
          },
        });
      }
    }
    console.log(`✅ ${contactEmails.length} contacts\n`);

    // 3. Seed Leads
    console.log('3️⃣ Seeding leads...');
    const leadEmails = ['alice@startup.com', 'charlie@company.com'];
    for (const email of leadEmails) {
      const exists = await prisma.leads.findFirst({ where: { email } });
      if (!exists) {
        await prisma.leads.create({
          data: {
            name: email.split('@')[0],
            email,
            phone: '555-0200',
            company: 'Test Lead Company',
            status: 'new',
          },
        });
      }
    }
    console.log(`✅ ${leadEmails.length} leads\n`);

    // 4. Seed Products
    console.log('4️⃣ Seeding products...');
    const products = [
      { name: 'Modern Sofa', sku: 'TEST-SOFA-001', category: 'furniture', base_price: 999.00 },
      { name: 'Dining Table', sku: 'TEST-TABLE-001', category: 'furniture', base_price: 1299.00 },
    ];
    for (const product of products) {
      const exists = await prisma.products.findFirst({ where: { sku: product.sku } });
      if (!exists) {
        await prisma.products.create({ data: product });
      }
    }
    console.log(`✅ ${products.length} products\n`);

    // 5. Seed Tasks
    console.log('5️⃣ Seeding tasks...');
    const taskTitles = ['Review mockups', 'Update proposal'];
    for (const title of taskTitles) {
      const exists = await prisma.tasks.findFirst({ where: { title } });
      if (!exists) {
        await prisma.tasks.create({
          data: {
            title,
            status: 'todo',
            priority: 'medium',
          },
        });
      }
    }
    console.log(`✅ ${taskTitles.length} tasks\n`);

    console.log('✅ ✅ ✅ Test data seeding complete!\n');
    console.log('Summary:');
    console.log('- 1 Customer');
    console.log('- 2 Contacts');
    console.log('- 2 Leads');
    console.log('- 2 Products');
    console.log('- 2 Tasks');
    console.log('\nReady for testing!\n');

  } catch (error) {
    console.error('❌ Error seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestData();

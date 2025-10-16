import { PrismaClient } from '@prisma/client';

/**
 * Test Data Cleanup Script
 *
 * Removes all test data from database
 *
 * Usage: npx tsx scripts/clean-test-data.ts
 */

const prisma = new PrismaClient();

async function cleanTestData() {
  console.log('🧹 Cleaning test data...\n');

  try {
    // Delete in reverse order of dependencies to avoid foreign key violations

    console.log('Deleting test payments...');
    const deletedPayments = await prisma.payments.deleteMany({
      where: { id: { startsWith: 'test-' } },
    });
    console.log(`✅ Deleted ${deletedPayments.count} test payments\n`);

    console.log('Deleting test invoices...');
    const deletedInvoices = await prisma.invoices.deleteMany({
      where: { id: { startsWith: 'test-' } },
    });
    console.log(`✅ Deleted ${deletedInvoices.count} test invoices\n`);

    console.log('Deleting test orders...');
    const deletedOrders = await prisma.orders.deleteMany({
      where: { id: { startsWith: 'test-' } },
    });
    console.log(`✅ Deleted ${deletedOrders.count} test orders\n`);

    console.log('Deleting test products...');
    const deletedProducts = await prisma.products.deleteMany({
      where: { id: { startsWith: 'test-' } },
    });
    console.log(`✅ Deleted ${deletedProducts.count} test products\n`);

    console.log('Deleting test projects...');
    const deletedProjects = await prisma.projects.deleteMany({
      where: { id: { startsWith: 'test-' } },
    });
    console.log(`✅ Deleted ${deletedProjects.count} test projects\n`);

    console.log('Deleting test tasks...');
    const deletedTasks = await prisma.tasks.deleteMany({
      where: { id: { startsWith: 'test-' } },
    });
    console.log(`✅ Deleted ${deletedTasks.count} test tasks\n`);

    console.log('Deleting test contacts...');
    const deletedContacts = await prisma.contacts.deleteMany({
      where: { email: { contains: '@example.com' } },
    });
    console.log(`✅ Deleted ${deletedContacts.count} test contacts\n`);

    console.log('Deleting test leads...');
    const deletedLeads = await prisma.leads.deleteMany({
      where: {
        OR: [
          { email: { contains: '@startup.com' } },
          { email: { contains: '@company.com' } },
          { email: { contains: '@enterprise.com' } },
        ],
      },
    });
    console.log(`✅ Deleted ${deletedLeads.count} test leads\n`);

    console.log('Deleting test clients...');
    const deletedClients = await prisma.clients.deleteMany({
      where: { id: { startsWith: 'test-' } },
    });
    console.log(`✅ Deleted ${deletedClients.count} test clients\n`);

    console.log('✅ ✅ ✅ Test data cleanup complete! ✅ ✅ ✅\n');

  } catch (error) {
    console.error('❌ Error cleaning test data:', error);
    console.error('\nNote: Some tables may not exist or have different field names.\n');
  } finally {
    await prisma.$disconnect();
  }
}

cleanTestData();

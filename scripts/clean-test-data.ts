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
    const deletedPayments = await prisma.payment.deleteMany({
      where: { id: { startsWith: 'test-' } },
    });
    console.log(`✅ Deleted ${deletedPayments.count} test payments\n`);

    console.log('Deleting test invoices...');
    const deletedInvoices = await prisma.invoice.deleteMany({
      where: { id: { startsWith: 'test-' } },
    });
    console.log(`✅ Deleted ${deletedInvoices.count} test invoices\n`);

    console.log('Deleting test orders...');
    const deletedOrders = await prisma.order.deleteMany({
      where: { id: { startsWith: 'test-' } },
    });
    console.log(`✅ Deleted ${deletedOrders.count} test orders\n`);

    console.log('Deleting test products...');
    const deletedProducts = await prisma.product.deleteMany({
      where: { id: { startsWith: 'test-' } },
    });
    console.log(`✅ Deleted ${deletedProducts.count} test products\n`);

    console.log('Deleting test projects...');
    const deletedProjects = await prisma.project.deleteMany({
      where: { id: { startsWith: 'test-' } },
    });
    console.log(`✅ Deleted ${deletedProjects.count} test projects\n`);

    console.log('Deleting test tasks...');
    const deletedTasks = await prisma.task.deleteMany({
      where: { id: { startsWith: 'test-' } },
    });
    console.log(`✅ Deleted ${deletedTasks.count} test tasks\n`);

    console.log('Deleting test contacts...');
    const deletedContacts = await prisma.contact.deleteMany({
      where: { email: { contains: '@example.com' } },
    });
    console.log(`✅ Deleted ${deletedContacts.count} test contacts\n`);

    console.log('Deleting test leads...');
    const deletedLeads = await prisma.lead.deleteMany({
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
    const deletedClients = await prisma.client.deleteMany({
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

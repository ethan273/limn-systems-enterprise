import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCounts() {
  try {
    console.log('=== DATABASE ROW COUNTS ===\n');

    const counts = await Promise.all([
      prisma.production_orders.count(),
      prisma.invoices.count(),
      prisma.tasks.count(),
      prisma.partners.count(),
      prisma.products.count(),
      prisma.customers.count(),
      prisma.projects.count(),
      prisma.contacts.count(),
      prisma.shipments.count(),
      prisma.qc_inspections.count(),
    ]);

    console.log(`production_orders:  ${counts[0]}`);
    console.log(`invoices:           ${counts[1]}`);
    console.log(`tasks:              ${counts[2]}`);
    console.log(`partners:           ${counts[3]}`);
    console.log(`products:           ${counts[4]}`);
    console.log(`customers:          ${counts[5]}`);
    console.log(`projects:           ${counts[6]}`);
    console.log(`contacts:           ${counts[7]}`);
    console.log(`shipments:          ${counts[8]}`);
    console.log(`qc_inspections:     ${counts[9]}`);

    const total = counts.reduce((sum, count) => sum + count, 0);
    console.log(`\nTOTAL ROWS:         ${total}`);

    // Check for empty tables
    const emptyTables: string[] = [];
    const tableNames = ['production_orders', 'invoices', 'tasks', 'partners', 'products', 'customers', 'projects', 'contacts', 'shipments', 'qc_inspections'];
    counts.forEach((count, index) => {
      if (count === 0) {
        emptyTables.push(tableNames[index]);
      }
    });

    if (emptyTables.length > 0) {
      console.log(`\n⚠️  EMPTY TABLES (${emptyTables.length}):`, emptyTables.join(', '));
    } else {
      console.log('\n✅ All tables have data');
    }

    console.log('\n===========================');
  } catch (error) {
    console.error('❌ Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCounts();

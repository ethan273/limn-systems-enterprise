import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTables() {
  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('orders', 'production_orders', 'quality_inspections', 'shipments', 'invoices', 'notifications')
      ORDER BY table_name;
    `;

    console.log('=== ACTUAL DATABASE TABLES ===');
    console.log(JSON.stringify(tables, null, 2));

    // Also check what Prisma thinks exists
    console.log('\n=== CHECKING TABLE ACCESS ===');

    try {
      const ordersCount = await prisma.orders.count();
      console.log(`✅ orders table: ${ordersCount} records`);
    } catch (e: any) {
      console.log(`❌ orders table: ${e.message}`);
    }

    try {
      const prodOrdersCount = await prisma.production_orders.count();
      console.log(`✅ production_orders table: ${prodOrdersCount} records`);
    } catch (e: any) {
      console.log(`❌ production_orders table: ${e.message}`);
    }

    try {
      const qcCount = await prisma.quality_inspections.count();
      console.log(`✅ quality_inspections table: ${qcCount} records`);
    } catch (e: any) {
      console.log(`❌ quality_inspections table: ${e.message}`);
    }

    try {
      const shipmentsCount = await prisma.shipments.count();
      console.log(`✅ shipments table: ${shipmentsCount} records`);
    } catch (e: any) {
      console.log(`❌ shipments table: ${e.message}`);
    }

    try {
      const invoicesCount = await prisma.invoices.count();
      console.log(`✅ invoices table: ${invoicesCount} records`);
    } catch (e: any) {
      console.log(`❌ invoices table: ${e.message}`);
    }

    try {
      const notifCount = await prisma.notifications.count();
      console.log(`✅ notifications table: ${notifCount} records`);
    } catch (e: any) {
      console.log(`❌ notifications table: ${e.message}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTables();

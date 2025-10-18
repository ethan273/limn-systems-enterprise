import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTimeEntriesTable() {
  console.log('Checking if time_entries table exists...\n');

  try {
    // Try to query the table
    const result = await prisma.$queryRaw`SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'time_entries'
    )`;

    const tableExists = (result as any)[0]?.exists || false;

    if (tableExists) {
      console.log('✅ time_entries table EXISTS');

      // Get row count
      const count = await prisma.$queryRaw`SELECT COUNT(*) FROM time_entries`;
      console.log('Row count:', (count as any)[0]?.count || 0);
    } else {
      console.log('❌ time_entries table does NOT exist');
      console.log('Table needs to be created');
    }

    await prisma.$disconnect();
    return tableExists;
  } catch (error) {
    console.error('Error checking table:', error);
    await prisma.$disconnect();
    return false;
  }
}

checkTimeEntriesTable().catch(console.error);

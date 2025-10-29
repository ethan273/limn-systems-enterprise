#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';

async function test() {
  // Try with connection pooler port (6543 with pgbouncer)
  const baseUrl = process.env.DATABASE_URL || '';
  const poolerUrl = baseUrl.replace(':5432', ':6543') + '?pgbouncer=true';

  console.log('Testing connection with pooler (port 6543)...');

  const prisma = new PrismaClient({
    datasources: { db: { url: poolerUrl } }
  });

  try {
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✓ Connection successful with pooler!');
    await prisma.$disconnect();
    return true;
  } catch (error: any) {
    console.log('✗ Pooler failed:', error.message);
    await prisma.$disconnect();

    // Try direct connection
    console.log('\nTrying direct connection (port 5432)...');
    const prisma2 = new PrismaClient({
      datasources: { db: { url: baseUrl } }
    });

    try {
      const result2 = await prisma2.$queryRaw`SELECT 1 as test`;
      console.log('✓ Direct connection successful!');
      await prisma2.$disconnect();
      return true;
    } catch (error2: any) {
      console.log('✗ Direct connection failed:', error2.message);
      await prisma2.$disconnect();
      return false;
    }
  }
}

test().then(success => process.exit(success ? 0 : 1));

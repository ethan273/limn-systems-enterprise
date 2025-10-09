import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyRealtimeTables() {
  try {
    console.log('🔍 Verifying Realtime Configuration...\n');

    // Check which tables have realtime enabled
    const realtimeTables = await prisma.$queryRaw<{
      schemaname: string;
      tablename: string;
      pubname: string;
    }[]>`
      SELECT
        schemaname,
        tablename,
        pg_publication.pubname
      FROM pg_publication_tables
      JOIN pg_publication ON pg_publication_tables.pubname = pg_publication.pubname
      WHERE schemaname = 'public'
        AND tablename IN ('orders', 'production_orders', 'quality_inspections', 'shipments', 'invoices', 'notifications')
      ORDER BY tablename;
    `;

    console.log('📊 Tables with Realtime Enabled:');
    console.table(realtimeTables);

    // Check RLS policies for production_orders
    const rlsPolicies = await prisma.$queryRaw<{
      schemaname: string;
      tablename: string;
      policyname: string;
      permissive: string;
      roles: string[];
      cmd: string;
      qual: string;
    }[]>`
      SELECT
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'production_orders'
      ORDER BY policyname;
    `;

    console.log('\n🔒 RLS Policies for production_orders:');
    console.table(rlsPolicies);

    // Verify specific tables
    const requiredTables = [
      'production_orders',
      'quality_inspections',
      'shipments',
      'invoices',
      'notifications'
    ];

    const enabledTables = realtimeTables.map(t => t.tablename);
    const missingTables = requiredTables.filter(t => !enabledTables.includes(t));

    console.log('\n✅ Status Summary:');
    requiredTables.forEach(table => {
      const enabled = enabledTables.includes(table);
      console.log(`${enabled ? '✅' : '❌'} ${table}: ${enabled ? 'Realtime ENABLED' : 'Realtime NOT ENABLED'}`);
    });

    if (missingTables.length > 0) {
      console.log(`\n⚠️  Missing realtime on: ${missingTables.join(', ')}`);
    } else {
      console.log('\n🎉 All required tables have realtime enabled!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyRealtimeTables();

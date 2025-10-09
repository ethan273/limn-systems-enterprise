#!/usr/bin/env ts-node

/**
 * Database Health Check Script
 * Verifies database structure and connectivity for tests
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TableInfo {
  name: string;
  rowCount: number;
  status: 'ok' | 'empty' | 'error';
  error?: string;
}

const EXPECTED_TABLES = [
  'users',
  'projects',
  'orders',
  'materials',
  'contacts',
  'customers',
  'leads',
  'prospects',
  'tasks',
  'documents',
  'production_orders',
  'invoices',
  'products',
  'user_permissions',
  'default_permissions'
];

async function checkTableExists(tableName: string): Promise<TableInfo> {
  try {
    // Try to query the table
    const result = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as count FROM "${tableName}"`
    );
    const count = Number((result as any)[0]?.count || 0);

    return {
      name: tableName,
      rowCount: count,
      status: count > 0 ? 'ok' : 'empty'
    };
  } catch (error) {
    return {
      name: tableName,
      rowCount: 0,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function runHealthCheck() {
  console.log('\n🏥 Database Health Check\n');
  console.log('=' .repeat(70));

  // Check database connectivity
  console.log('\n📡 Checking database connectivity...');
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful\n');
  } catch (error) {
    console.log('❌ Database connection failed');
    console.log(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }

  // Check all expected tables
  console.log('📊 Checking database tables...\n');

  const tableResults: TableInfo[] = [];

  for (const table of EXPECTED_TABLES) {
    const result = await checkTableExists(table);
    tableResults.push(result);

    const icon = result.status === 'ok' ? '✅' :
                 result.status === 'empty' ? '⚠️' : '❌';

    const rowInfo = result.status === 'error' ? 'ERROR' :
                    `${result.rowCount} rows`;

    console.log(`${icon} ${table.padEnd(25)} ${rowInfo}`);

    if (result.error) {
      console.log(`   └─ ${result.error}`);
    }
  }

  // Summary
  console.log('\n' + '=' .repeat(70));

  const errorTables = tableResults.filter(t => t.status === 'error');
  const emptyTables = tableResults.filter(t => t.status === 'empty');
  const okTables = tableResults.filter(t => t.status === 'ok');

  console.log(`\n📈 Summary:`);
  console.log(`   Tables OK: ${okTables.length}`);
  console.log(`   Tables Empty: ${emptyTables.length}`);
  console.log(`   Tables Missing/Error: ${errorTables.length}`);

  // Save results
  const fs = require('fs');
  const resultsPath = '/Users/eko3/limn-systems-enterprise-docs/02-TESTING/database-health-results.json';

  const results = {
    timestamp: new Date().toISOString(),
    connected: true,
    tables: tableResults,
    summary: {
      total: tableResults.length,
      ok: okTables.length,
      empty: emptyTables.length,
      errors: errorTables.length
    }
  };

  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${resultsPath}`);

  // Recommendations
  console.log('\n📋 Recommendations:');

  if (errorTables.length > 0) {
    console.log('   ❌ Missing tables detected! Run migrations:');
    console.log('      npx prisma db push');
  }

  if (emptyTables.length > 0) {
    console.log('   ⚠️  Empty tables detected. Consider:');
    console.log('      - Running test data seed script');
    console.log('      - Some tests may fail due to missing data');
  }

  if (errorTables.length === 0 && emptyTables.length < 5) {
    console.log('   ✅ Database looks healthy for testing!');
  }

  console.log('\n' + '=' .repeat(70) + '\n');

  await prisma.$disconnect();

  // Exit with error if critical issues found
  process.exit(errorTables.length > 0 ? 1 : 0);
}

runHealthCheck().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

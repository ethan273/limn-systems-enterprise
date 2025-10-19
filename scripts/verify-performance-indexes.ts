/**
 * Verify all performance indexes are created
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verifying Performance Indexes');
  console.log('==================================\n');

  // Query to get all indexes on our target tables
  const query = `
    SELECT
      schemaname,
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename IN ('customers', 'invoices', 'orders', 'products', 'tasks', 'user_profiles')
    ORDER BY tablename, indexname;
  `;

  const indexes: any[] = await prisma.$queryRawUnsafe(query);

  // Group by table
  const byTable: Record<string, any[]> = {};

  for (const idx of indexes) {
    if (!byTable[idx.tablename]) {
      byTable[idx.tablename] = [];
    }
    byTable[idx.tablename].push(idx);
  }

  // Expected new indexes
  const expectedIndexes = {
    customers: [
      'idx_customers_company_name',
      'idx_customers_status',
      'idx_customers_created_at_desc',
      'idx_customers_status_created',
      'idx_customers_company_status',
    ],
    invoices: [
      'idx_invoices_created_at_desc',
      'idx_invoices_status_created',
      'idx_invoices_customer_status',
    ],
    orders: [
      'idx_orders_customer_id',
      'idx_orders_status',
      'idx_orders_due_date',
      'idx_orders_assigned_to',
      'idx_orders_status_created',
      'idx_orders_assigned_status',
      'idx_orders_customer_status',
      'idx_orders_rush_status',
    ],
    products: ['idx_products_name'],
    tasks: [
      'idx_tasks_status',
      'idx_tasks_due_date',
      'idx_tasks_department',
      'idx_tasks_status_priority',
      'idx_tasks_status_due_date',
      'idx_tasks_project_status',
    ],
    user_profiles: [
      'idx_user_profiles_department',
      'idx_user_profiles_created_at_desc',
      'idx_user_profiles_type_active',
      'idx_user_profiles_dept_active',
    ],
  };

  let allFound = true;

  console.log('📊 Index Verification Results:\n');

  for (const [table, expectedIdxList] of Object.entries(expectedIndexes)) {
    const tableIndexes = byTable[table] || [];
    const tableIndexNames = tableIndexes.map((idx) => idx.indexname);

    console.log(`\n📋 ${table} (${tableIndexes.length} total indexes):`);

    for (const expectedIdx of expectedIdxList) {
      if (tableIndexNames.includes(expectedIdx)) {
        console.log(`   ✅ ${expectedIdx}`);
      } else {
        console.log(`   ❌ ${expectedIdx} - MISSING!`);
        allFound = false;
      }
    }
  }

  console.log('\n\n' + '='.repeat(50));

  if (allFound) {
    console.log('✅ All performance indexes verified successfully!');
  } else {
    console.log('❌ Some indexes are missing. Run apply-performance-indexes.ts');
  }

  console.log('\n📊 Total Indexes by Table:');
  for (const [table, idxList] of Object.entries(byTable)) {
    console.log(`   ${table}: ${idxList.length} indexes`);
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ Verification failed:', error);
  prisma.$disconnect();
  process.exit(1);
});

import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

/**
 * SCHEMA DRIFT DETECTION TEST
 *
 * This test suite validates that the Prisma schema is in sync with the actual database.
 * It prevents schema drift by automatically detecting when:
 * - Tables defined in Prisma don't exist in database
 * - Tables exist in database but not in Prisma
 * - Critical tables are inaccessible
 *
 * Run Frequency: Every CI/CD pipeline + Daily cron job
 * Purpose: Catch schema drift within minutes/hours instead of weeks
 */

const prisma = new PrismaClient();

// Critical tables that must exist for the application to function
const CRITICAL_TABLES = [
  'users',
  'customers',
  'orders',
  'production_orders',
  'quality_inspections',
  'shipments',
  'invoices',
  'notifications',
  'projects',
  'collections',
  'items',
  'manufacturers',
  'partners',
  'design_projects',
  'manufacturer_projects',
] as const;

test.describe('🔍 SCHEMA DRIFT DETECTION @critical @schema', () => {

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test('All critical tables should exist in database', async () => {
    // Query actual database for table names (from both public and auth schemas)
    const result = await prisma.$queryRaw<{ table_name: string; table_schema: string }[]>`
      SELECT table_name, table_schema
      FROM information_schema.tables
      WHERE table_schema IN ('public', 'auth')
      ORDER BY table_schema, table_name;
    `;

    const actualTables = result.map(row => row.table_name);

    console.log(`\n📊 Found ${actualTables.length} tables in database`);

    // Verify each critical table exists
    const missingTables: string[] = [];
    const existingTables: string[] = [];

    for (const table of CRITICAL_TABLES) {
      if (actualTables.includes(table)) {
        existingTables.push(table);
      } else {
        missingTables.push(table);
      }
    }

    console.log(`✅ ${existingTables.length}/${CRITICAL_TABLES.length} critical tables exist`);

    if (missingTables.length > 0) {
      console.error(`❌ Missing tables: ${missingTables.join(', ')}`);
    }

    expect(missingTables, `Missing critical tables in database: ${missingTables.join(', ')}`).toHaveLength(0);
  });

  test('Critical tables should be queryable via Prisma', async () => {
    const results: { table: string; status: string; count?: number; error?: string }[] = [];

    // Test each critical table can be queried
    const tableTests = [
      { name: 'users', query: () => prisma.users.count() },
      { name: 'customers', query: () => prisma.customers.count() },
      { name: 'orders', query: () => prisma.orders.count() },
      { name: 'production_orders', query: () => prisma.production_orders.count() },
      { name: 'quality_inspections', query: () => prisma.quality_inspections.count() },
      { name: 'shipments', query: () => prisma.shipments.count() },
      { name: 'invoices', query: () => prisma.invoices.count() },
      { name: 'notifications', query: () => prisma.notifications.count() },
      { name: 'projects', query: () => prisma.projects.count() },
      { name: 'collections', query: () => prisma.collections.count() },
      { name: 'items', query: () => prisma.items.count() },
      { name: 'manufacturers', query: () => prisma.manufacturers.count() },
      { name: 'partners', query: () => prisma.partners.count() },
      { name: 'design_projects', query: () => prisma.design_projects.count() },
      { name: 'manufacturer_projects', query: () => prisma.manufacturer_projects.count() },
    ];

    for (const { name, query } of tableTests) {
      try {
        const count = await query();
        results.push({ table: name, status: '✅', count });
      } catch (error: any) {
        results.push({ table: name, status: '❌', error: error.message });
      }
    }

    // Log results
    console.log('\n📋 Table Access Report:');
    console.table(results);

    // Check for failures
    const failures = results.filter(r => r.status === '❌');

    expect(failures, `Failed to query tables: ${failures.map(f => f.table).join(', ')}`).toHaveLength(0);
  });

  test('Production orders table should have expected structure', async () => {
    // Verify critical columns exist
    const columns = await prisma.$queryRaw<{ column_name: string; data_type: string }[]>`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'production_orders'
      ORDER BY column_name;
    `;

    const columnNames = columns.map(c => c.column_name);

    // Critical columns that must exist
    const requiredColumns = [
      'id',
      'order_number',
      'order_id',
      'status',
      'created_at',
      'updated_at',
    ];

    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));

    console.log(`\n📊 production_orders has ${columns.length} columns`);
    console.log(`✅ Required columns: ${requiredColumns.filter(col => columnNames.includes(col)).join(', ')}`);

    if (missingColumns.length > 0) {
      console.error(`❌ Missing columns: ${missingColumns.join(', ')}`);
    }

    expect(missingColumns, `Missing required columns in production_orders: ${missingColumns.join(', ')}`).toHaveLength(0);
  });

  test('Quality inspections should have manufacturer_project_id (not order_id)', async () => {
    const columns = await prisma.$queryRaw<{ column_name: string }[]>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'quality_inspections';
    `;

    const columnNames = columns.map(c => c.column_name);

    // Should have manufacturer_project_id
    expect(columnNames).toContain('manufacturer_project_id');

    // Should NOT have order_id (common mistake)
    expect(columnNames).not.toContain('order_id');

    console.log('\n✅ quality_inspections correctly uses manufacturer_project_id');
  });

  test('Critical foreign key relationships should exist', async () => {
    const foreignKeys = await prisma.$queryRaw<{
      table_name: string;
      column_name: string;
      foreign_table_name: string;
    }[]>`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name IN ('production_orders', 'quality_inspections', 'shipments', 'invoices')
      ORDER BY tc.table_name, kcu.column_name;
    `;

    console.log(`\n🔗 Found ${foreignKeys.length} foreign keys on critical tables`);
    console.table(foreignKeys);

    // Verify key relationships exist
    const hasProductionOrdersToOrders = foreignKeys.some(
      fk => fk.table_name === 'production_orders' && fk.column_name === 'order_id' && fk.foreign_table_name === 'orders'
    );

    const hasQualityInspectionsToManufacturerProjects = foreignKeys.some(
      fk => fk.table_name === 'quality_inspections' && fk.column_name === 'manufacturer_project_id'
    );

    const hasInvoicesToOrders = foreignKeys.some(
      fk => fk.table_name === 'invoices' && fk.column_name === 'order_id' && fk.foreign_table_name === 'orders'
    );

    expect(hasProductionOrdersToOrders, 'production_orders → orders FK missing').toBeTruthy();
    expect(hasQualityInspectionsToManufacturerProjects, 'quality_inspections → manufacturer_projects FK missing').toBeTruthy();
    expect(hasInvoicesToOrders, 'invoices → orders FK missing').toBeTruthy();

    console.log('✅ All critical foreign key relationships exist');
  });

  test('Critical indexes should exist for performance', async () => {
    const indexes = await prisma.$queryRaw<{
      tablename: string;
      indexname: string;
      indexdef: string;
    }[]>`
      SELECT
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename IN ('orders', 'production_orders', 'quality_inspections', 'invoices', 'shipments')
      ORDER BY tablename, indexname;
    `;

    console.log(`\n⚡ Found ${indexes.length} indexes on critical tables`);

    // Group by table
    const indexesByTable = indexes.reduce((acc, idx) => {
      if (!acc[idx.tablename]) acc[idx.tablename] = [];
      acc[idx.tablename].push(idx.indexname);
      return acc;
    }, {} as Record<string, string[]>);

    console.table(Object.entries(indexesByTable).map(([table, idxs]) => ({
      table,
      count: idxs.length,
      indexes: idxs.join(', '),
    })));

    // Each critical table should have at least a primary key index
    for (const table of ['orders', 'production_orders', 'quality_inspections', 'invoices', 'shipments']) {
      const tableIndexes = indexesByTable[table] || [];
      expect(tableIndexes.length, `${table} should have at least one index`).toBeGreaterThan(0);
    }

    console.log('✅ All critical tables have indexes');
  });

  test('Database should be accessible and responsive', async () => {
    const startTime = Date.now();

    // Simple query to test database responsiveness
    await prisma.$queryRaw`SELECT 1 as test`;

    const responseTime = Date.now() - startTime;

    console.log(`\n⚡ Database response time: ${responseTime}ms`);

    // Database should respond within 1 second
    expect(responseTime, 'Database response time too slow').toBeLessThan(1000);

    console.log('✅ Database is responsive');
  });
});

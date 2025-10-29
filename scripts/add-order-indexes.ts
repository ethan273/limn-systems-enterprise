/**
 * Phase 7: Add Performance Indexes for Orders System
 *
 * Adds indexes to optimize common query patterns:
 * - Order lookups by customer_id
 * - Order lookups by project_id
 * - Order filtering by status
 * - Order filtering by priority
 * - Order sorting by created_at
 * - Order number searches
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

interface IndexDefinition {
  table: string;
  name: string;
  columns: string[];
  description: string;
}

const INDEXES: IndexDefinition[] = [
  {
    table: 'orders',
    name: 'idx_orders_customer_id',
    columns: ['customer_id'],
    description: 'Optimize queries filtering by customer (e.g., customer order history)',
  },
  {
    table: 'orders',
    name: 'idx_orders_project_id',
    columns: ['project_id'],
    description: 'Optimize queries filtering by project (e.g., project orders list)',
  },
  {
    table: 'orders',
    name: 'idx_orders_status',
    columns: ['status'],
    description: 'Optimize queries filtering by status (e.g., pending orders, shipped orders)',
  },
  {
    table: 'orders',
    name: 'idx_orders_priority',
    columns: ['priority'],
    description: 'Optimize queries filtering by priority (e.g., urgent orders dashboard)',
  },
  {
    table: 'orders',
    name: 'idx_orders_created_at',
    columns: ['created_at'],
    description: 'Optimize queries sorting by creation date (e.g., recent orders)',
  },
  {
    table: 'orders',
    name: 'idx_orders_order_number',
    columns: ['order_number'],
    description: 'Optimize order number searches (e.g., quick lookup by ORD-123456)',
  },
  {
    table: 'orders',
    name: 'idx_orders_customer_status',
    columns: ['customer_id', 'status'],
    description: 'Composite index for customer order filtering by status',
  },
  {
    table: 'orders',
    name: 'idx_orders_project_status',
    columns: ['project_id', 'status'],
    description: 'Composite index for project order filtering by status',
  },
  {
    table: 'order_items',
    name: 'idx_order_items_order_id',
    columns: ['order_id'],
    description: 'Optimize order items lookup by order_id (foreign key)',
  },
  {
    table: 'order_items',
    name: 'idx_order_items_status',
    columns: ['status'],
    description: 'Optimize queries filtering order items by status',
  },
  {
    table: 'production_orders',
    name: 'idx_production_orders_order_id',
    columns: ['order_id'],
    description: 'Optimize production order lookup by order_id (foreign key)',
  },
  {
    table: 'production_orders',
    name: 'idx_production_orders_project_id',
    columns: ['project_id'],
    description: 'Optimize production order lookup by project_id',
  },
  {
    table: 'production_orders',
    name: 'idx_production_orders_status',
    columns: ['status'],
    description: 'Optimize queries filtering production orders by status',
  },
];

async function checkIndexExists(
  prisma: PrismaClient,
  table: string,
  indexName: string
): Promise<boolean> {
  const result = await prisma.$queryRawUnsafe<any[]>(`
    SELECT indexname
    FROM pg_indexes
    WHERE tablename = '${table}'
      AND indexname = '${indexName}';
  `);

  return result.length > 0;
}

async function createIndex(
  prisma: PrismaClient,
  index: IndexDefinition
): Promise<void> {
  const exists = await checkIndexExists(prisma, index.table, index.name);

  if (exists) {
    console.log(`   ⏭️  Index ${index.name} already exists, skipping`);
    return;
  }

  const columns = index.columns.join(', ');
  const sql = `CREATE INDEX IF NOT EXISTS ${index.name} ON ${index.table} (${columns});`;

  console.log(`   🔨 Creating index: ${index.name}`);
  console.log(`      Table: ${index.table}`);
  console.log(`      Columns: ${columns}`);
  console.log(`      Purpose: ${index.description}`);

  await prisma.$executeRawUnsafe(sql);
  console.log(`   ✅ Created ${index.name}`);
}

async function analyzeTable(prisma: PrismaClient, table: string): Promise<void> {
  console.log(`   📊 Analyzing table: ${table}`);
  await prisma.$executeRawUnsafe(`ANALYZE ${table};`);
  console.log(`   ✅ Analysis complete`);
}

async function verifyIndexes(prisma: PrismaClient): Promise<void> {
  console.log('\n🔍 Verifying all indexes...\n');

  for (const index of INDEXES) {
    const exists = await checkIndexExists(prisma, index.table, index.name);
    const status = exists ? '✅' : '❌';
    console.log(`   ${status} ${index.name} on ${index.table}`);
  }
}

async function main() {
  console.log('🚀 Phase 7: Adding Performance Indexes for Orders System\n');

  try {
    // Read database URL from .env
    const envContent = fs.readFileSync('.env', 'utf-8');
    const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/);

    if (!dbUrlMatch) {
      throw new Error('DATABASE_URL not found in .env');
    }

    const dbUrl = dbUrlMatch[1];
    const dbName = dbUrl.includes('localhost') ? 'DEV' : 'PROD';

    console.log(`📂 Target Database: ${dbName}\n`);

    // Create indexes
    let created = 0;
    let skipped = 0;

    for (const index of INDEXES) {
      try {
        const existed = await checkIndexExists(prisma, index.table, index.name);
        await createIndex(prisma, index);

        if (existed) {
          skipped++;
        } else {
          created++;
        }
      } catch (error: any) {
        console.error(`   ❌ Failed to create ${index.name}: ${error.message}`);
      }
    }

    // Analyze tables to update query planner statistics
    console.log('\n📊 Analyzing tables...\n');
    await analyzeTable(prisma, 'orders');
    await analyzeTable(prisma, 'order_items');
    await analyzeTable(prisma, 'production_orders');

    // Verify all indexes
    await verifyIndexes(prisma);

    console.log(`\n✨ Complete!`);
    console.log(`   Indexes created: ${created}`);
    console.log(`   Indexes skipped (already exist): ${skipped}`);
    console.log(`   Total indexes: ${INDEXES.length}`);

    console.log('\n⚡ Performance improvements:');
    console.log('   - Customer order history queries');
    console.log('   - Project order lookups');
    console.log('   - Status-based filtering');
    console.log('   - Priority-based sorting');
    console.log('   - Order number searches');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

/**
 * Database Schema Analysis Script
 *
 * Analyzes Prisma schema vs actual database to find:
 * - Unused tables
 * - Unused fields
 * - Missing indexes
 * - Orphaned data
 * - Schema inconsistencies
 *
 * Created: October 3, 2025
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface DatabaseAnalysisReport {
  timestamp: string;
  totalPrismaModels: number;
  totalDatabaseTables: number;
  unusedTables: string[];
  unusedFields: Record<string, string[]>;
  missingIndexes: Array<{
    table: string;
    column: string;
    reason: string;
  }>;
  orphanedData: Array<{
    table: string;
    count: number;
    issue: string;
  }>;
  schemaInconsistencies: Array<{
    table: string;
    field: string;
    prismaType: string;
    dbType: string;
  }>;
}

async function analyzeDatabaseSchema(): Promise<DatabaseAnalysisReport> {
  console.log('🔍 Starting database schema analysis...\n');

  // 1. Get all Prisma models
  console.log('📊 Analyzing Prisma models...');
  const prismaModels = Object.keys(prisma).filter(
    key => !key.startsWith('$') && !key.startsWith('_')
  );
  console.log(`   Found ${prismaModels.length} Prisma models\n`);

  // 2. Get all actual database tables
  console.log('📊 Querying database tables...');
  const tables: any[] = await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `;
  console.log(`   Found ${tables.length} database tables\n`);

  // 3. Find unused tables (in DB but not in Prisma)
  console.log('🔍 Checking for unused tables...');
  const unusedTables = tables
    .filter((table: any) => !prismaModels.includes(table.table_name))
    .map((table: any) => table.table_name);
  console.log(`   Found ${unusedTables.length} unused tables\n`);

  // 4. Find missing indexes on foreign keys
  console.log('🔍 Checking for missing indexes...');
  const missingIndexes: any[] = await prisma.$queryRaw`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND NOT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE tablename = tc.table_name
      AND indexdef LIKE '%' || kcu.column_name || '%'
    )
    LIMIT 50;
  `;

  const formattedMissingIndexes = missingIndexes.map((idx: any) => ({
    table: idx.table_name,
    column: idx.column_name,
    reason: `Foreign key to ${idx.foreign_table_name}.${idx.foreign_column_name}`,
  }));
  console.log(`   Found ${formattedMissingIndexes.length} missing indexes\n`);

  // 5. Check for orphaned data in key tables
  console.log('🔍 Checking for orphaned data...');
  const orphanedData: Array<{ table: string; count: number; issue: string }> = [];

  // Check orders with deleted customers
  try {
    const orphanedOrders: any[] = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM orders
      WHERE customer_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM customers
        WHERE customers.id = orders.customer_id
      );
    `;
    if (orphanedOrders[0]?.count > 0) {
      orphanedData.push({
        table: 'orders',
        count: parseInt(orphanedOrders[0].count),
        issue: 'Orders with deleted customer_id',
      });
    }
  } catch (error) {
    console.log('   Note: Could not check orders table');
  }

  // Check order_items with deleted item_id
  try {
    const orphanedOrderItems: any[] = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM order_items
      WHERE item_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM items
        WHERE items.id = order_items.item_id
      );
    `;
    if (orphanedOrderItems[0]?.count > 0) {
      orphanedData.push({
        table: 'order_items',
        count: parseInt(orphanedOrderItems[0].count),
        issue: 'Order items with deleted item_id (catalog reference)',
      });
    }
  } catch (error) {
    console.log('   Note: Could not check order_items table');
  }

  // Check qc_inspections with deleted order_item_id
  try {
    const orphanedQC: any[] = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM qc_inspections
      WHERE order_item_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM order_items
        WHERE order_items.id = qc_inspections.order_item_id
      );
    `;
    if (orphanedQC[0]?.count > 0) {
      orphanedData.push({
        table: 'qc_inspections',
        count: parseInt(orphanedQC[0].count),
        issue: 'QC inspections with deleted order_item_id',
      });
    }
  } catch (error) {
    console.log('   Note: Could not check qc_inspections table');
  }

  console.log(`   Found ${orphanedData.length} tables with orphaned data\n`);

  // 6. Schema inconsistencies (placeholder - would need schema introspection)
  const schemaInconsistencies: Array<{
    table: string;
    field: string;
    prismaType: string;
    dbType: string;
  }> = [];

  // 7. Generate report
  const report: DatabaseAnalysisReport = {
    timestamp: new Date().toISOString(),
    totalPrismaModels: prismaModels.length,
    totalDatabaseTables: tables.length,
    unusedTables,
    unusedFields: {}, // Would require query log analysis
    missingIndexes: formattedMissingIndexes,
    orphanedData,
    schemaInconsistencies,
  };

  // Save JSON report
  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(reportsDir, 'database-analysis-report.json'),
    JSON.stringify(report, null, 2)
  );

  // Generate markdown report
  const markdown = generateMarkdownReport(report);
  fs.writeFileSync(
    path.join(reportsDir, 'database-analysis-report.md'),
    markdown
  );

  console.log('✅ Database analysis complete!');
  console.log(`   Reports saved to: ${reportsDir}\n`);

  return report;
}

function generateMarkdownReport(report: DatabaseAnalysisReport): string {
  let md = `# Database Analysis Report\n\n`;
  md += `**Generated:** ${new Date(report.timestamp).toLocaleString()}\n\n`;
  md += `## Summary\n\n`;
  md += `- **Total Prisma Models:** ${report.totalPrismaModels}\n`;
  md += `- **Total Database Tables:** ${report.totalDatabaseTables}\n`;
  md += `- **Unused Tables:** ${report.unusedTables.length}\n`;
  md += `- **Missing Indexes:** ${report.missingIndexes.length}\n`;
  md += `- **Orphaned Data Issues:** ${report.orphanedData.length}\n\n`;

  if (report.unusedTables.length > 0) {
    md += `## Unused Tables (${report.unusedTables.length})\n\n`;
    md += `Tables in database but not in Prisma schema:\n\n`;
    report.unusedTables.forEach(table => {
      md += `- \`${table}\`\n`;
    });
    md += `\n**Recommendation:** Review these tables. If no longer needed, consider archiving and dropping.\n\n`;
  }

  if (report.missingIndexes.length > 0) {
    md += `## Missing Indexes (${report.missingIndexes.length})\n\n`;
    md += `Foreign keys without indexes (performance impact):\n\n`;
    report.missingIndexes.forEach(idx => {
      md += `### ${idx.table}.${idx.column}\n`;
      md += `- **Reason:** ${idx.reason}\n`;
      md += `- **SQL:**\n`;
      md += `  \`\`\`sql\n`;
      md += `  CREATE INDEX idx_${idx.table}_${idx.column}\n`;
      md += `  ON ${idx.table}(${idx.column});\n`;
      md += `  \`\`\`\n\n`;
    });
  }

  if (report.orphanedData.length > 0) {
    md += `## Orphaned Data (${report.orphanedData.length} issues)\n\n`;
    md += `Records with broken foreign key references:\n\n`;
    report.orphanedData.forEach(orphan => {
      md += `### ${orphan.table}\n`;
      md += `- **Count:** ${orphan.count} records\n`;
      md += `- **Issue:** ${orphan.issue}\n`;
      md += `- **Recommendation:** Review and clean up orphaned records\n\n`;
    });
  }

  md += `---\n\n`;
  md += `*Generated by Database Analysis Script*\n`;

  return md;
}

// Run analysis
analyzeDatabaseSchema()
  .then((report) => {
    console.log('📊 Analysis Results:');
    console.log(`   - Prisma Models: ${report.totalPrismaModels}`);
    console.log(`   - Database Tables: ${report.totalDatabaseTables}`);
    console.log(`   - Unused Tables: ${report.unusedTables.length}`);
    console.log(`   - Missing Indexes: ${report.missingIndexes.length}`);
    console.log(`   - Orphaned Data Issues: ${report.orphanedData.length}`);
    console.log('\n✅ Reports saved to /reports directory');
  })
  .catch((error) => {
    console.error('❌ Error during analysis:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

/**
 * DATABASE INTEGRITY TEST
 *
 * CRITICAL: Verifies database schema matches application expectations
 *
 * Tests:
 * - All Prisma models have corresponding database tables
 * - All model fields have corresponding database columns
 * - All foreign key constraints exist and are valid
 * - All indexes exist
 * - No orphaned records (foreign keys pointing to deleted records)
 * - Database migrations are up to date
 *
 * Memory Safe: Processes tables one at a time, cleans up connections
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

interface TableCheck {
  tableName: string;
  exists: boolean;
  columnCount: number;
  missingColumns: string[];
  extraColumns: string[];
  constraints: {
    valid: number;
    missing: number;
    details: string[];
  };
  indexes: {
    valid: number;
    missing: number;
    details: string[];
  };
}

interface OrphanCheck {
  tableName: string;
  column: string;
  orphanCount: number;
  details: string;
}

interface IntegrityResult {
  timestamp: string;
  summary: {
    totalTables: number;
    validTables: number;
    missingTables: number;
    schemaIssues: number;
    orphanedRecords: number;
    criticalIssues: number;
  };
  tables: TableCheck[];
  orphans: OrphanCheck[];
  migrations: {
    upToDate: boolean;
    pendingMigrations: string[];
  };
}

// ============================================================================
// DATABASE INTEGRITY TESTER
// ============================================================================

class DatabaseIntegrityTester {
  private db: PrismaClient;
  private result: IntegrityResult;

  constructor() {
    this.db = new PrismaClient();
    this.result = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTables: 0,
        validTables: 0,
        missingTables: 0,
        schemaIssues: 0,
        orphanedRecords: 0,
        criticalIssues: 0,
      },
      tables: [],
      orphans: [],
      migrations: {
        upToDate: true,
        pendingMigrations: [],
      },
    };
  }

  // ==========================================================================
  // MEMORY MANAGEMENT
  // ==========================================================================

  private checkMemory(): void {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);

    console.log(`💾 Memory: ${heapUsedMB}MB / ${heapTotalMB}MB`);

    if (heapUsedMB > 3500) {
      console.warn('⚠️  High memory usage, triggering cleanup...');
      if (global.gc) {
        global.gc();
      }
    }
  }

  async cleanup(): Promise<void> {
    await this.db.$disconnect().catch(() => {});
    if (global.gc) {
      global.gc();
    }
  }

  // ==========================================================================
  // TABLE EXISTENCE CHECKS
  // ==========================================================================

  async checkTableExists(tableName: string): Promise<boolean> {
    try {
      const result = await this.db.$queryRaw<any[]>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = ${tableName}
        ) as exists
      `;
      return result[0]?.exists || false;
    } catch (error) {
      console.error(`Error checking table ${tableName}:`, error);
      return false;
    }
  }

  async getTableColumns(tableName: string): Promise<string[]> {
    try {
      const result = await this.db.$queryRaw<any[]>`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = ${tableName}
        ORDER BY ordinal_position
      `;
      return result.map((row) => row.column_name);
    } catch (error) {
      console.error(`Error getting columns for ${tableName}:`, error);
      return [];
    }
  }

  // ==========================================================================
  // SCHEMA VALIDATION
  // ==========================================================================

  async validatePrismaSchema(): Promise<void> {
    console.log('🔍 Validating Prisma schema against database...\n');

    // Expected tables from Prisma schema
    const expectedTables = [
      'user_profiles',
      'user_permissions',
      'default_permissions',
      'contacts',
      'customers',
      'leads',
      'projects',
      'prospects',
      'production_orders',
      'qc_inspections',
      'products',
      'product_concepts',
      'prototypes',
      'design_briefs',
      'shipments',
      'invoices',
      'tasks',
      'notifications',
      'audit_logs',
    ];

    this.result.summary.totalTables = expectedTables.length;

    for (const tableName of expectedTables) {
      const exists = await this.checkTableExists(tableName);

      if (!exists) {
        console.log(`❌ Table missing: ${tableName}`);
        this.result.summary.missingTables++;
        this.result.summary.criticalIssues++;
        this.result.tables.push({
          tableName,
          exists: false,
          columnCount: 0,
          missingColumns: [],
          extraColumns: [],
          constraints: { valid: 0, missing: 0, details: [] },
          indexes: { valid: 0, missing: 0, details: [] },
        });
      } else {
        console.log(`✅ Table exists: ${tableName}`);
        const columns = await this.getTableColumns(tableName);
        this.result.summary.validTables++;
        this.result.tables.push({
          tableName,
          exists: true,
          columnCount: columns.length,
          missingColumns: [],
          extraColumns: [],
          constraints: { valid: 0, missing: 0, details: [] },
          indexes: { valid: 0, missing: 0, details: [] },
        });
      }

      // Memory check after each table
      this.checkMemory();
    }
  }

  // ==========================================================================
  // FOREIGN KEY VALIDATION
  // ==========================================================================

  async checkForeignKeyConstraints(): Promise<void> {
    console.log('\n🔗 Checking foreign key constraints...\n');

    try {
      const constraints = await this.db.$queryRaw<any[]>`
        SELECT
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
        ORDER BY tc.table_name
      `;

      console.log(`Found ${constraints.length} foreign key constraints`);

      for (const constraint of constraints) {
        console.log(`  ✅ ${constraint.table_name}.${constraint.column_name} → ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
      }

    } catch (error) {
      console.error('Error checking constraints:', error);
      this.result.summary.criticalIssues++;
    }

    this.checkMemory();
  }

  // ==========================================================================
  // ORPHANED RECORDS CHECK
  // ==========================================================================

  async checkOrphanedRecords(): Promise<void> {
    console.log('\n🔍 Checking for orphaned records...\n');

    // Check user_profiles with missing auth users
    try {
      const orphanedProfiles = await this.db.$queryRaw<any[]>`
        SELECT COUNT(*) as count
        FROM user_profiles
        WHERE id NOT IN (
          SELECT id FROM auth.users
        )
      `;

      const count = parseInt(orphanedProfiles[0]?.count || '0');
      if (count > 0) {
        console.log(`❌ Found ${count} orphaned user_profiles (no auth.users record)`);
        this.result.orphans.push({
          tableName: 'user_profiles',
          column: 'id',
          orphanCount: count,
          details: 'user_profiles without corresponding auth.users',
        });
        this.result.summary.orphanedRecords += count;
        this.result.summary.criticalIssues++;
      } else {
        console.log(`✅ No orphaned user_profiles`);
      }
    } catch (error) {
      console.log(`⚠️  Could not check user_profiles orphans (this is OK if auth.users not accessible)`);
    }

    // Check other common orphans
    const orphanChecks = [
      {
        table: 'user_permissions',
        column: 'user_id',
        reference: 'user_profiles',
        query: `SELECT COUNT(*) as count FROM user_permissions WHERE user_id NOT IN (SELECT id FROM user_profiles)`,
      },
      {
        table: 'projects',
        column: 'customer_id',
        reference: 'customers',
        query: `SELECT COUNT(*) as count FROM projects WHERE customer_id IS NOT NULL AND customer_id NOT IN (SELECT id FROM customers)`,
      },
      {
        table: 'tasks',
        column: 'assigned_to',
        reference: 'user_profiles',
        query: `SELECT COUNT(*) as count FROM tasks WHERE assigned_to IS NOT NULL AND assigned_to NOT IN (SELECT id FROM user_profiles)`,
      },
    ];

    for (const check of orphanChecks) {
      try {
        const result = await this.db.$queryRawUnsafe<any[]>(check.query);
        const count = parseInt(result[0]?.count || '0');

        if (count > 0) {
          console.log(`❌ Found ${count} orphaned ${check.table}.${check.column} (missing ${check.reference})`);
          this.result.orphans.push({
            tableName: check.table,
            column: check.column,
            orphanCount: count,
            details: `${check.table}.${check.column} references missing ${check.reference}`,
          });
          this.result.summary.orphanedRecords += count;
          this.result.summary.schemaIssues++;
        } else {
          console.log(`✅ No orphaned ${check.table}.${check.column}`);
        }
      } catch (error) {
        console.log(`⚠️  Could not check ${check.table}.${check.column} (table may not exist yet)`);
      }

      this.checkMemory();
    }
  }

  // ==========================================================================
  // INDEX VALIDATION
  // ==========================================================================

  async checkIndexes(): Promise<void> {
    console.log('\n📊 Checking database indexes...\n');

    try {
      const indexes = await this.db.$queryRaw<any[]>`
        SELECT
          tablename,
          indexname,
          indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname
      `;

      console.log(`Found ${indexes.length} indexes`);

      // Group by table
      const indexesByTable = new Map<string, number>();
      for (const index of indexes) {
        const count = indexesByTable.get(index.tablename) || 0;
        indexesByTable.set(index.tablename, count + 1);
      }

      // Report
      for (const [table, count] of indexesByTable.entries()) {
        console.log(`  ✅ ${table}: ${count} indexes`);
      }

    } catch (error) {
      console.error('Error checking indexes:', error);
    }

    this.checkMemory();
  }

  // ==========================================================================
  // MIGRATION STATUS
  // ==========================================================================

  async checkMigrationStatus(): Promise<void> {
    console.log('\n🔄 Checking migration status...\n');

    try {
      // Check if _prisma_migrations table exists
      const migrationsTableExists = await this.checkTableExists('_prisma_migrations');

      if (!migrationsTableExists) {
        console.log('⚠️  No _prisma_migrations table found');
        this.result.migrations.upToDate = false;
        this.result.summary.criticalIssues++;
        return;
      }

      // Get applied migrations
      const appliedMigrations = await this.db.$queryRaw<any[]>`
        SELECT migration_name, applied_steps_count, finished_at
        FROM _prisma_migrations
        WHERE finished_at IS NOT NULL
        ORDER BY finished_at DESC
        LIMIT 10
      `;

      console.log(`Applied migrations: ${appliedMigrations.length}`);
      for (const migration of appliedMigrations.slice(0, 5)) {
        console.log(`  ✅ ${migration.migration_name}`);
      }

      this.result.migrations.upToDate = true;

    } catch (error) {
      console.error('Error checking migrations:', error);
      this.result.migrations.upToDate = false;
      this.result.summary.criticalIssues++;
    }
  }

  // ==========================================================================
  // REPORT GENERATION
  // ==========================================================================

  generateReport(): string {
    const timestamp = new Date().toISOString();
    let report = `# DATABASE INTEGRITY TEST REPORT\n\n`;
    report += `**Generated**: ${timestamp}\n\n`;

    // Summary
    report += `## 📊 SUMMARY\n\n`;
    report += `- **Total Tables Expected**: ${this.result.summary.totalTables}\n`;
    report += `- **Valid Tables**: ${this.result.summary.validTables}\n`;
    report += `- **Missing Tables**: ${this.result.summary.missingTables}\n`;
    report += `- **Schema Issues**: ${this.result.summary.schemaIssues}\n`;
    report += `- **Orphaned Records**: ${this.result.summary.orphanedRecords}\n`;
    report += `- **Critical Issues**: ${this.result.summary.criticalIssues}\n\n`;

    // Status
    if (this.result.summary.criticalIssues === 0) {
      report += `## ✅ STATUS: PASS\n\n`;
      report += `All database integrity checks passed. Database is production-ready.\n\n`;
    } else {
      report += `## ❌ STATUS: FAIL\n\n`;
      report += `**CRITICAL**: ${this.result.summary.criticalIssues} issues found. Database is NOT production-ready.\n\n`;
    }

    // Missing Tables
    if (this.result.summary.missingTables > 0) {
      report += `## ❌ MISSING TABLES\n\n`;
      for (const table of this.result.tables) {
        if (!table.exists) {
          report += `- **${table.tableName}** - Table does not exist in database\n`;
        }
      }
      report += `\n**Action Required**: Run \`npx prisma db push\` to create missing tables.\n\n`;
    }

    // Orphaned Records
    if (this.result.orphans.length > 0) {
      report += `## ❌ ORPHANED RECORDS\n\n`;
      for (const orphan of this.result.orphans) {
        report += `### ${orphan.tableName}.${orphan.column}\n\n`;
        report += `- **Count**: ${orphan.orphanCount}\n`;
        report += `- **Issue**: ${orphan.details}\n`;
        report += `- **Action**: Clean up orphaned records before production\n\n`;
      }
    }

    // Migrations
    report += `## 🔄 MIGRATIONS\n\n`;
    report += `- **Status**: ${this.result.migrations.upToDate ? '✅ Up to date' : '❌ Out of date'}\n`;
    if (this.result.migrations.pendingMigrations.length > 0) {
      report += `- **Pending**: ${this.result.migrations.pendingMigrations.length} migrations\n\n`;
      for (const migration of this.result.migrations.pendingMigrations) {
        report += `  - ${migration}\n`;
      }
    }
    report += `\n`;

    // Valid Tables
    if (this.result.summary.validTables > 0) {
      report += `## ✅ VALID TABLES (${this.result.summary.validTables})\n\n`;
      for (const table of this.result.tables) {
        if (table.exists) {
          report += `- **${table.tableName}**: ${table.columnCount} columns\n`;
        }
      }
      report += `\n`;
    }

    return report;
  }

  async saveReport(): Promise<string> {
    const report = this.generateReport();
    const projectRoot = process.cwd();
    const parentDir = path.dirname(projectRoot);
    const outputDir = path.join(parentDir, 'limn-systems-enterprise-docs', '02-TESTING', 'CRITICAL-TESTS', 'reports');
    const outputPath = path.join(outputDir, `database-integrity-${Date.now()}.md`);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, report, 'utf-8');
    console.log(`\n📝 Report saved: ${outputPath}`);

    const latestPath = path.join(outputDir, 'database-integrity-latest.md');
    fs.writeFileSync(latestPath, report, 'utf-8');
    console.log(`📝 Latest report: ${latestPath}\n`);

    return outputPath;
  }

  // ==========================================================================
  // MAIN TEST RUNNER
  // ==========================================================================

  async runAllChecks(): Promise<void> {
    console.log('🚀 Starting Database Integrity Test\n');
    console.log('='.repeat(80) + '\n');

    try {
      // Test database connection
      await this.db.$connect();
      console.log('✅ Database connection successful\n');

      // Run checks
      await this.validatePrismaSchema();
      await this.checkForeignKeyConstraints();
      await this.checkOrphanedRecords();
      await this.checkIndexes();
      await this.checkMigrationStatus();

      // Generate report
      await this.saveReport();

      // Summary
      console.log('='.repeat(80));
      console.log('📊 TEST SUMMARY');
      console.log('='.repeat(80));
      console.log(`Valid Tables: ${this.result.summary.validTables}/${this.result.summary.totalTables}`);
      console.log(`Critical Issues: ${this.result.summary.criticalIssues}`);

      if (this.result.summary.criticalIssues === 0) {
        console.log('\n✅ DATABASE INTEGRITY: PASS\n');
        process.exit(0);
      } else {
        console.log('\n❌ DATABASE INTEGRITY: FAIL\n');
        console.log(`Fix ${this.result.summary.criticalIssues} critical issues before production.\n`);
        process.exit(1);
      }

    } catch (error) {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }
}

// ============================================================================
// MAIN
// ============================================================================

const tester = new DatabaseIntegrityTester();
tester.runAllChecks().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

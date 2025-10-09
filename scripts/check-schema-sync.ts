/**
 * PRE-FLIGHT SCHEMA SYNC CHECK
 *
 * CRITICAL: Runs BEFORE dev server starts and tests run
 *
 * Purpose:
 * - Detect Prisma/database schema mismatches immediately
 * - Auto-fix with `prisma db push` if needed
 * - Prevent type errors from propagating to runtime
 *
 * Usage:
 * - npm run schema:check       (check + auto-fix)
 * - npm run schema:check:fast  (check only, no fix)
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

interface SchemaCheckResult {
  inSync: boolean;
  missingTables: string[];
  extraTables: string[];
  action: 'none' | 'push' | 'generate';
}

const EXPECTED_TABLES = [
  'user_profiles',
  'user_permissions',
  'default_permissions',
  'contacts',
  'customers',
  'leads',
  'projects',
  'production_orders',
  'qc_inspections',
  'products',
  'prototypes',
  'design_briefs',
  'shipments',
  'invoices',
  'tasks',
  'notifications',
];

async function checkSchemaSync(): Promise<SchemaCheckResult> {
  const db = new PrismaClient();

  try {
    // Get all tables from database
    const tables = await db.$queryRaw<{ tablename: string }[]>`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      AND tablename NOT LIKE '\\_%'
    `;

    const existingTables = tables.map(t => t.tablename);

    // Find missing tables
    const missingTables = EXPECTED_TABLES.filter(t => !existingTables.includes(t));

    // Find extra tables (not in Prisma schema)
    const extraTables = existingTables.filter(t => !EXPECTED_TABLES.includes(t));

    const inSync = missingTables.length === 0;
    const action = missingTables.length > 0 ? 'push' : 'none';

    return {
      inSync,
      missingTables,
      extraTables,
      action,
    };

  } finally {
    await db.$disconnect();
  }
}

async function autoFix(): Promise<void> {
  console.log('🔧 Running prisma db push...');
  execSync('npx prisma db push --accept-data-loss', {
    stdio: 'inherit',
    cwd: process.cwd(),
  });

  console.log('🔧 Running prisma generate...');
  execSync('npx prisma generate', {
    stdio: 'inherit',
    cwd: process.cwd(),
  });

  console.log('✅ Schema sync complete!');
}

async function main() {
  const autoFixMode = !process.argv.includes('--no-fix');

  console.log('🔍 Checking Prisma/Database schema sync...\n');

  try {
    const result = await checkSchemaSync();

    if (result.inSync) {
      console.log('✅ Schema is IN SYNC');
      console.log(`   ${EXPECTED_TABLES.length} tables exist in database\n`);
      process.exit(0);
    }

    console.log('❌ Schema is OUT OF SYNC\n');

    if (result.missingTables.length > 0) {
      console.log(`Missing Tables (${result.missingTables.length}):`);
      result.missingTables.forEach(t => console.log(`  - ${t}`));
      console.log();
    }

    if (result.extraTables.length > 0) {
      console.log(`Extra Tables (${result.extraTables.length}) - not in Prisma schema:`);
      result.extraTables.forEach(t => console.log(`  - ${t}`));
      console.log();
    }

    if (autoFixMode && result.action === 'push') {
      console.log('🚀 AUTO-FIX MODE: Syncing schema...\n');
      await autoFix();

      // Verify fix worked
      console.log('\n🔍 Verifying fix...');
      const recheck = await checkSchemaSync();
      if (recheck.inSync) {
        console.log('✅ Schema sync successful!\n');
        process.exit(0);
      } else {
        console.log('❌ Schema still out of sync after fix\n');
        process.exit(1);
      }
    } else {
      console.log('⚠️  Run `npx prisma db push` to sync schema\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Schema check failed:', error);
    process.exit(1);
  }
}

main();

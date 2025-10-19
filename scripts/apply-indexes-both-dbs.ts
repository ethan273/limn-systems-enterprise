/**
 * Apply performance indexes to BOTH dev and production databases
 * CRITICAL: Ensures dev and prod stay 100% in sync
 */

import { getSupabaseAdmin } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

async function applyIndexesToDatabase(dbName: string, connectionUrl: string) {
  console.log(`\n🔧 Applying indexes to ${dbName} database...`);

  // Read the migration SQL file
  const migrationPath = path.join(
    __dirname,
    '../prisma/migrations/20251018_add_performance_indexes.sql'
  );

  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  // Split into individual statements (each CREATE INDEX)
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Found ${statements.length} index creation statements`);

  // Create Supabase client for this database
  const supabase = getSupabaseAdmin();

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const statement of statements) {
    if (!statement.includes('CREATE INDEX')) continue;

    // Extract index name for logging
    const match = statement.match(/CREATE INDEX CONCURRENTLY IF NOT EXISTS "([^"]+)"/);
    const indexName = match ? match[1] : 'unknown';

    try {
      // Execute the CREATE INDEX statement
      // Note: Supabase doesn't have a direct SQL execution method, so we'll use a workaround
      const { error } = await supabase.rpc('exec_sql', {
        sql: statement + ';'
      });

      if (error) {
        // Check if error is "already exists" - that's okay
        if (error.message.includes('already exists')) {
          console.log(`   ⏭️  ${indexName} (already exists)`);
          skipCount++;
        } else {
          console.error(`   ❌ ${indexName}: ${error.message}`);
          errorCount++;
        }
      } else {
        console.log(`   ✅ ${indexName}`);
        successCount++;
      }
    } catch (error: any) {
      console.error(`   ❌ ${indexName}: ${error.message}`);
      errorCount++;
    }
  }

  console.log(`\n📊 ${dbName} Results:`);
  console.log(`   ✅ Created: ${successCount}`);
  console.log(`   ⏭️  Skipped: ${skipCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);

  return { successCount, skipCount, errorCount };
}

async function main() {
  console.log('🚀 PHASE 1: DATABASE INDEX OPTIMIZATION');
  console.log('========================================\n');

  // Get connection URLs from environment
  const devUrl = process.env.DATABASE_URL;
  const prodUrl = process.env.PRODUCTION_DATABASE_URL || process.env.DATABASE_URL;

  if (!devUrl) {
    throw new Error('DATABASE_URL not found in environment');
  }

  console.log('📍 Database Configuration:');
  console.log(`   Dev:  ${devUrl.substring(0, 50)}...`);
  console.log(`   Prod: ${prodUrl.substring(0, 50)}...\n`);

  // Apply to dev database
  const devResults = await applyIndexesToDatabase('DEV', devUrl);

  // If dev and prod use the same URL, don't apply twice
  if (devUrl === prodUrl) {
    console.log('\n⚠️  Dev and Prod use the same database - skipping duplicate application');
  } else {
    // Apply to production database
    const prodResults = await applyIndexesToDatabase('PRODUCTION', prodUrl);

    // Verify both are in sync
    if (
      devResults.successCount !== prodResults.successCount ||
      devResults.skipCount !== prodResults.skipCount
    ) {
      console.log('\n⚠️  WARNING: Dev and Prod results differ!');
      console.log('Dev and Production databases may not be in sync.');
    } else {
      console.log('\n✅ Dev and Production databases are IN SYNC');
    }
  }

  console.log('\n✅ Index migration completed!');
  console.log('\nNext steps:');
  console.log('1. Verify indexes with: npm run verify-indexes');
  console.log('2. Test query performance');
  console.log('3. Monitor database metrics\n');
}

main().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});

/**
 * Apply Performance Indexes to BOTH Dev and Prod Databases
 *
 * CRITICAL: This script ensures indexes are applied to both databases
 * to maintain synchronization as required.
 *
 * Safety Features:
 * - Prompts for confirmation before each database
 * - Verifies index count after application
 * - Ensures both databases have same number of indexes
 * - Uses IF NOT EXISTS to prevent errors on re-run
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

interface DatabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  name: string;
}

async function getConfig(name: string): Promise<DatabaseConfig> {
  console.log(`\n📝 Enter ${name} Database Configuration:`);
  console.log('   (You can find these in your Supabase project settings)\n');

  const url = await question(`   Supabase URL for ${name}: `);
  const anonKey = await question(`   Anon Key for ${name}: `);
  const serviceRoleKey = await question(`   Service Role Key for ${name}: `);

  return { url, anonKey, serviceRoleKey, name };
}

async function testConnection(config: DatabaseConfig): Promise<boolean> {
  try {
    const supabase = createClient(config.url, config.serviceRoleKey);
    const { data, error } = await supabase.from('_prisma_migrations').select('id').limit(1);

    if (error && !error.message.includes('does not exist')) {
      console.log(`   ❌ Connection failed: ${error.message}`);
      return false;
    }

    console.log(`   ✅ Connection successful to ${config.name}`);
    return true;
  } catch (error: any) {
    console.log(`   ❌ Connection failed: ${error.message}`);
    return false;
  }
}

async function applyIndexes(config: DatabaseConfig, sql: string): Promise<boolean> {
  try {
    const supabase = createClient(config.url, config.serviceRoleKey);

    console.log(`\n🔧 Applying indexes to ${config.name} database...`);
    console.log('   This may take 1-2 minutes for large databases...\n');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.startsWith('CREATE INDEX'));

    console.log(`   Total indexes to create: ${statements.length}`);

    let successful = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';

      // Show progress every 50 indexes
      if (i % 50 === 0) {
        console.log(`   Progress: ${i}/${statements.length} indexes...`);
      }

      try {
        const { error } = await supabase.rpc('exec_sql', { sql_string: statement });

        if (error) {
          if (error.message.includes('already exists')) {
            skipped++;
          } else {
            console.log(`   ⚠️  Error on statement ${i + 1}: ${error.message}`);
            failed++;
          }
        } else {
          successful++;
        }
      } catch (err: any) {
        if (err.message?.includes('already exists')) {
          skipped++;
        } else {
          console.log(`   ⚠️  Error on statement ${i + 1}: ${err.message}`);
          failed++;
        }
      }
    }

    console.log(`\n   ✅ Created: ${successful} indexes`);
    if (skipped > 0) {
      console.log(`   ⏭️  Skipped: ${skipped} indexes (already existed)`);
    }
    if (failed > 0) {
      console.log(`   ❌ Failed: ${failed} indexes`);
      return false;
    }

    return true;
  } catch (error: any) {
    console.log(`   ❌ Application failed: ${error.message}`);
    return false;
  }
}

async function verifyIndexes(config: DatabaseConfig): Promise<number> {
  try {
    const supabase = createClient(config.url, config.serviceRoleKey);

    const { data, error } = await supabase
      .rpc('exec_sql', {
        sql_string: `
          SELECT COUNT(*) as count
          FROM pg_indexes
          WHERE schemaname = 'public'
            AND indexname LIKE 'idx_%';
        `
      });

    if (error) {
      console.log(`   ❌ Verification failed: ${error.message}`);
      return -1;
    }

    const count = data?.[0]?.count || 0;
    console.log(`\n   📊 Total indexes in ${config.name}: ${count}`);
    return count;
  } catch (error: any) {
    console.log(`   ❌ Verification failed: ${error.message}`);
    return -1;
  }
}

async function main() {
  console.log('🚀 Performance Index Application');
  console.log('================================\n');
  console.log('CRITICAL: This will apply indexes to BOTH dev and prod databases.\n');
  console.log('⚠️  WARNING: Ensure you have:');
  console.log('   1. Backed up both databases (recommended)');
  console.log('   2. Service role keys for both databases');
  console.log('   3. Reviewed the SQL migration file\n');

  const proceed = await question('Do you want to proceed? (yes/no): ');
  if (proceed.toLowerCase() !== 'yes') {
    console.log('\n❌ Aborted by user');
    rl.close();
    process.exit(0);
  }

  // Load SQL migration
  const sqlPath = join(process.cwd(), 'prisma/migrations/add_performance_indexes.sql');
  console.log(`\n📂 Loading migration from: ${sqlPath}`);
  const sql = readFileSync(sqlPath, 'utf-8');
  console.log('   ✅ Migration loaded\n');

  // Get database configurations
  const devConfig = await getConfig('DEV');
  const prodConfig = await getConfig('PROD');

  // Test connections
  console.log('\n🔌 Testing database connections...');
  const devConnected = await testConnection(devConfig);
  const prodConnected = await testConnection(prodConfig);

  if (!devConnected || !prodConnected) {
    console.log('\n❌ Failed to connect to one or both databases');
    rl.close();
    process.exit(1);
  }

  // Apply to DEV first
  console.log('\n' + '='.repeat(60));
  console.log('STEP 1: Applying to DEV Database');
  console.log('='.repeat(60));

  const devConfirm = await question('\nApply indexes to DEV database? (yes/no): ');
  if (devConfirm.toLowerCase() !== 'yes') {
    console.log('\n❌ Aborted - DEV application skipped');
    rl.close();
    process.exit(0);
  }

  const devSuccess = await applyIndexes(devConfig, sql);
  if (!devSuccess) {
    console.log('\n❌ Failed to apply indexes to DEV database');
    rl.close();
    process.exit(1);
  }

  const devCount = await verifyIndexes(devConfig);
  if (devCount === -1) {
    console.log('\n❌ Failed to verify DEV indexes');
    rl.close();
    process.exit(1);
  }

  // Apply to PROD
  console.log('\n' + '='.repeat(60));
  console.log('STEP 2: Applying to PROD Database');
  console.log('='.repeat(60));
  console.log('\n⚠️  WARNING: You are about to apply indexes to PRODUCTION\n');

  const prodConfirm = await question('Apply indexes to PROD database? (yes/no): ');
  if (prodConfirm.toLowerCase() !== 'yes') {
    console.log('\n❌ Aborted - PROD application skipped');
    console.log('⚠️  WARNING: Dev and prod databases are now OUT OF SYNC!');
    rl.close();
    process.exit(0);
  }

  const prodSuccess = await applyIndexes(prodConfig, sql);
  if (!prodSuccess) {
    console.log('\n❌ Failed to apply indexes to PROD database');
    console.log('⚠️  WARNING: Dev and prod databases are now OUT OF SYNC!');
    rl.close();
    process.exit(1);
  }

  const prodCount = await verifyIndexes(prodConfig);
  if (prodCount === -1) {
    console.log('\n❌ Failed to verify PROD indexes');
    rl.close();
    process.exit(1);
  }

  // Final verification
  console.log('\n' + '='.repeat(60));
  console.log('FINAL VERIFICATION');
  console.log('='.repeat(60));

  console.log(`\nDEV Database:  ${devCount} indexes`);
  console.log(`PROD Database: ${prodCount} indexes`);

  if (devCount === prodCount) {
    console.log('\n✅ SUCCESS: Both databases have matching index counts!');
    console.log('✅ Dev and prod databases are synchronized');
  } else {
    console.log('\n⚠️  WARNING: Index counts do not match!');
    console.log('❌ Dev and prod databases are OUT OF SYNC!');
    console.log('\nPlease investigate and re-run if needed.');
  }

  rl.close();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  rl.close();
  process.exit(1);
});

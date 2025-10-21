/**
 * Apply share links migration to BOTH dev and production databases
 * CRITICAL: Ensures dev and prod stay 100% in sync
 *
 * Phase 9: Unique Tracking Links
 * Migration: 20251020_add_share_links.sql
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function applyMigrationToDatabase(dbName: string, connectionUrl: string) {
  console.log(`\n🔧 Applying share links migration to ${dbName} database...`);

  // Parse Supabase URL and key from connection string
  const match = connectionUrl.match(/postgresql:\/\/postgres\.[a-z]+:([^@]+)@([^:]+):(\d+)\/postgres/);
  if (!match) {
    throw new Error(`Invalid Supabase connection URL format for ${dbName}`);
  }

  const password = match[1];
  const project = match[2];
  const supabaseUrl = `https://${project}`;
  const supabaseKey = password; // In Supabase, the password IS the key

  // Read the migration SQL file
  const migrationPath = path.join(
    __dirname,
    '../prisma/migrations/20251020_add_share_links.sql'
  );

  if (!fs.existsSync(migrationPath)) {
    throw new Error(`Migration file not found: ${migrationPath}`);
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  // Split into individual statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && s !== '');

  console.log(`Found ${statements.length} SQL statements to execute`);

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  });

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];

    // Extract operation name for logging
    let operationName = 'unknown';
    if (statement.includes('CREATE TABLE')) {
      const match = statement.match(/CREATE TABLE IF NOT EXISTS (?:flipbook\.)?(\w+)/);
      operationName = match ? `CREATE TABLE ${match[1]}` : 'CREATE TABLE';
    } else if (statement.includes('CREATE INDEX')) {
      const match = statement.match(/CREATE INDEX (?:CONCURRENTLY )?IF NOT EXISTS (\w+)/);
      operationName = match ? `CREATE INDEX ${match[1]}` : 'CREATE INDEX';
    } else if (statement.includes('COMMENT ON')) {
      operationName = 'ADD COMMENT';
    } else if (statement.includes('CONSTRAINT')) {
      const match = statement.match(/CONSTRAINT (\w+)/);
      operationName = match ? `ADD CONSTRAINT ${match[1]}` : 'ADD CONSTRAINT';
    }

    try {
      // Execute via Supabase SQL
      const { error } = await supabase.rpc('exec_sql', {
        sql: statement + ';'
      });

      if (error) {
        // Check if error is "already exists" - that's okay
        if (
          error.message.includes('already exists') ||
          error.message.includes('duplicate key')
        ) {
          console.log(`   ⏭️  ${operationName} (already exists)`);
          skipCount++;
        } else {
          console.error(`   ❌ ${operationName}: ${error.message}`);
          errors.push(`${operationName}: ${error.message}`);
          errorCount++;
        }
      } else {
        console.log(`   ✅ ${operationName}`);
        successCount++;
      }
    } catch (error: any) {
      console.error(`   ❌ ${operationName}: ${error.message}`);
      errors.push(`${operationName}: ${error.message}`);
      errorCount++;
    }
  }

  console.log(`\n📊 ${dbName} Results:`);
  console.log(`   ✅ Applied: ${successCount}`);
  console.log(`   ⏭️  Skipped: ${skipCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);

  if (errors.length > 0) {
    console.log(`\n❌ Errors encountered:`);
    errors.forEach(err => console.log(`   - ${err}`));
  }

  return { successCount, skipCount, errorCount, errors };
}

async function main() {
  console.log('🚀 PHASE 9: SHARE LINKS DATABASE MIGRATION');
  console.log('==========================================\n');

  // Get connection URLs from environment
  const devUrl = process.env.DATABASE_URL;
  const prodUrl = process.env.PRODUCTION_DATABASE_URL || process.env.DATABASE_URL;

  if (!devUrl) {
    throw new Error('DATABASE_URL not found in environment');
  }

  console.log('📍 Database Configuration:');
  console.log(`   Dev:  ${devUrl.substring(0, 50)}...`);
  console.log(`   Prod: ${prodUrl.substring(0, 50)}...\n`);

  console.log('⚠️  IMPORTANT: This migration will create:');
  console.log('   - flipbook.flipbook_share_links table');
  console.log('   - flipbook.share_link_views table');
  console.log('   - Associated indexes and constraints\n');

  // Apply to dev database
  console.log('=== DEV DATABASE ===');
  const devResults = await applyMigrationToDatabase('DEV', devUrl);

  // If dev and prod use the same URL, don't apply twice
  if (devUrl === prodUrl) {
    console.log('\n⚠️  Dev and Prod use the same database - skipping duplicate application');
  } else {
    // Apply to production database
    console.log('\n=== PRODUCTION DATABASE ===');
    const prodResults = await applyMigrationToDatabase('PRODUCTION', prodUrl);

    // Verify both are in sync
    if (
      devResults.successCount !== prodResults.successCount ||
      devResults.skipCount !== prodResults.skipCount ||
      devResults.errorCount !== prodResults.errorCount
    ) {
      console.log('\n⚠️  WARNING: Dev and Prod results differ!');
      console.log('Dev and Production databases may not be in sync.');
      console.log('\nDev Results:', devResults);
      console.log('Prod Results:', prodResults);
    } else {
      console.log('\n✅ Dev and Production databases are IN SYNC');
    }
  }

  if (devResults.errorCount > 0 || (devUrl !== prodUrl && prodResults?.errorCount > 0)) {
    console.log('\n❌ Migration completed with ERRORS');
    console.log('Please review errors above and fix manually if needed.\n');
    process.exit(1);
  } else {
    console.log('\n✅ Share links migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: npx prisma generate');
    console.log('2. Verify tables: npm run check-db-tables');
    console.log('3. Test share link creation in UI\n');
  }
}

main().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});

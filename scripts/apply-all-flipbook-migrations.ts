/**
 * Apply all flipbook migrations to BOTH dev and production databases
 * CRITICAL: Ensures dev and prod stay 100% in sync
 *
 * Migrations applied:
 * 1. 20251020_add_share_links.sql - Share links tables
 * 2. 20251022_add_missing_flipbook_tables.sql - Analytics, templates, AI queue
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from production-credentials.env
const prodCredsPath = path.join(__dirname, '../production-credentials.env');
if (fs.existsSync(prodCredsPath)) {
  const prodCreds = fs.readFileSync(prodCredsPath, 'utf-8');
  prodCreds.split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=["']?([^"'\n]+)["']?$/);
    if (match) {
      process.env[match[1]] = match[2];
    }
  });
}

// Also load .env for fallback
dotenv.config({ path: path.join(__dirname, '../.env') });

interface MigrationResult {
  successCount: number;
  skipCount: number;
  errorCount: number;
  errors: string[];
}

async function applyMigrationToDatabase(
  dbName: string,
  connectionUrl: string,
  migrationPath: string,
  migrationName: string
): Promise<MigrationResult> {
  console.log(`\n🔧 Applying ${migrationName} to ${dbName} database...`);

  if (!fs.existsSync(migrationPath)) {
    throw new Error(`Migration file not found: ${migrationPath}`);
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  // Split into individual statements
  const statements = migrationSQL
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--') && s !== '');

  console.log(`Found ${statements.length} SQL statements to execute`);

  // Create PostgreSQL connection pool
  const pool = new Pool({
    connectionString: connectionUrl,
    ssl: { rejectUnauthorized: false },
  });

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  try {
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Extract operation name for logging
      let operationName = 'unknown';
      if (statement.includes('CREATE TABLE')) {
        // eslint-disable-next-line security/detect-unsafe-regex
        const match = statement.match(
          /CREATE TABLE IF NOT EXISTS (?:[\w.]+\.)?(\w+)/
        );
        operationName = match ? `CREATE TABLE ${match[1]}` : 'CREATE TABLE';
      } else if (statement.includes('CREATE INDEX')) {
        const match = statement.match(
          /CREATE INDEX (?:CONCURRENTLY )?IF NOT EXISTS (\w+)/
        );
        operationName = match ? `CREATE INDEX ${match[1]}` : 'CREATE INDEX';
      } else if (statement.includes('CREATE TYPE')) {
        const match = statement.match(/CREATE TYPE IF NOT EXISTS [\w.]+\.?(\w+)/);
        operationName = match ? `CREATE TYPE ${match[1]}` : 'CREATE TYPE';
      } else if (statement.includes('COMMENT ON')) {
        operationName = 'ADD COMMENT';
      } else if (statement.includes('CONSTRAINT')) {
        const match = statement.match(/CONSTRAINT (\w+)/);
        operationName = match ? `ADD CONSTRAINT ${match[1]}` : 'ADD CONSTRAINT';
      }

      try {
        await pool.query(statement + ';');
        console.log(`   ✅ ${operationName}`);
        successCount++;
      } catch (error: any) {
        // Check if error is "already exists" - that's okay
        if (
          error.message.includes('already exists') ||
          error.message.includes('duplicate key') ||
          error.message.includes('violates unique constraint')
        ) {
          console.log(`   ⏭️  ${operationName} (already exists)`);
          skipCount++;
        } else {
          console.error(`   ❌ ${operationName}: ${error.message}`);
          errors.push(`${operationName}: ${error.message}`);
          errorCount++;
        }
      }
    }
  } finally {
    await pool.end();
  }

  console.log(`\n📊 ${dbName} Results for ${migrationName}:`);
  console.log(`   ✅ Applied: ${successCount}`);
  console.log(`   ⏭️  Skipped: ${skipCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);

  if (errors.length > 0) {
    console.log(`\n❌ Errors encountered:`);
    errors.forEach((err) => console.log(`   - ${err}`));
  }

  return { successCount, skipCount, errorCount, errors };
}

async function main() {
  console.log('🚀 APPLYING ALL FLIPBOOK MIGRATIONS');
  console.log('===================================\n');

  // Get connection URLs from environment
  const devUrl = process.env.DEV_DB_URL || process.env.DATABASE_URL;
  const prodUrl = process.env.PROD_DB_URL;

  if (!devUrl) {
    throw new Error('DEV_DB_URL or DATABASE_URL not found in environment');
  }

  if (!prodUrl) {
    throw new Error('PROD_DB_URL not found in production-credentials.env');
  }

  console.log('📍 Database Configuration:');
  console.log(`   Dev:  ${devUrl.substring(0, 50)}...`);
  console.log(`   Prod: ${prodUrl.substring(0, 50)}...\n`);

  const migrations = [
    {
      name: 'Share Links (Phase 9)',
      file: '20251022_add_share_links_public.sql',
      description: 'flipbook_share_links table',
    },
    {
      name: 'Missing Flipbook Tables',
      file: '20251022_add_missing_flipbook_tables.sql',
      description: 'analytics_events, share_link_views, templates, ai_generation_queue',
    },
  ];

  console.log('⚠️  IMPORTANT: This will create:');
  migrations.forEach((m) => {
    console.log(`   - ${m.name}: ${m.description}`);
  });
  console.log('');

  for (const migration of migrations) {
    const migrationPath = path.join(
      __dirname,
      '../prisma/migrations',
      migration.file
    );

    console.log(`\n${'='.repeat(60)}`);
    console.log(`MIGRATION: ${migration.name}`);
    console.log('='.repeat(60));

    // Apply to dev database
    console.log('\n=== DEV DATABASE ===');
    const devResults = await applyMigrationToDatabase(
      'DEV',
      devUrl,
      migrationPath,
      migration.name
    );

    // Apply to production database
    console.log('\n=== PRODUCTION DATABASE ===');
    const prodResults = await applyMigrationToDatabase(
      'PRODUCTION',
      prodUrl,
      migrationPath,
      migration.name
    );

    // Verify both are in sync
    if (
      devResults.successCount !== prodResults.successCount ||
      devResults.skipCount !== prodResults.skipCount ||
      devResults.errorCount !== prodResults.errorCount
    ) {
      console.log('\n⚠️  WARNING: Dev and Prod results differ for this migration!');
      console.log('Dev Results:', devResults);
      console.log('Prod Results:', prodResults);
    } else {
      console.log(`\n✅ Dev and Production are IN SYNC for ${migration.name}`);
    }

    if (devResults.errorCount > 0 || prodResults.errorCount > 0) {
      console.log(`\n❌ Migration "${migration.name}" completed with ERRORS`);
      console.log('Please review errors above and fix manually if needed.\n');
      process.exit(1);
    }
  }

  console.log('\n\n' + '='.repeat(60));
  console.log('✅ ALL FLIPBOOK MIGRATIONS COMPLETED SUCCESSFULLY!');
  console.log('='.repeat(60));
  console.log('\nNext steps:');
  console.log('1. Run: npx prisma db pull --force');
  console.log('2. Run: npx prisma generate');
  console.log('3. Run: npm run type-check');
  console.log('4. Test flipbooks analytics in UI\n');
}

main().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});

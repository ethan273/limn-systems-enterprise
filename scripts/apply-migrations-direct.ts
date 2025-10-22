/**
 * Apply migrations directly to dev and prod databases
 * Executes entire SQL file without statement splitting
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

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

async function applyMigration(dbName: string, connectionUrl: string, migrationPath: string) {
  console.log(`\n🔧 Applying migration to ${dbName}...`);
  console.log(`   File: ${path.basename(migrationPath)}`);

  const sql = fs.readFileSync(migrationPath, 'utf-8');

  const pool = new Pool({
    connectionString: connectionUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await pool.query(sql);
    console.log(`   ✅ Migration applied successfully to ${dbName}`);
  } catch (error: any) {
    console.error(`   ❌ Error applying migration to ${dbName}:`, error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

async function main() {
  const devUrl = process.env.DEV_DB_URL || process.env.DATABASE_URL;
  const prodUrl = process.env.PROD_DB_URL;

  if (!devUrl || !prodUrl) {
    throw new Error('Missing database URLs');
  }

  const migrations = [
    '20251022_add_share_links_public.sql',
    '20251022_add_missing_flipbook_tables.sql',
  ];

  console.log('🚀 APPLYING FLIPBOOK MIGRATIONS\n');
  console.log(`Dev:  ${devUrl.substring(0, 50)}...`);
  console.log(`Prod: ${prodUrl.substring(0, 50)}...\n`);

  for (const migrationFile of migrations) {
    const migrationPath = path.join(__dirname, '../prisma/migrations', migrationFile);

    console.log(`\n${'='.repeat(60)}`);
    console.log(`MIGRATION: ${migrationFile}`);
    console.log('='.repeat(60));

    // Apply to dev
    await applyMigration('DEV', devUrl, migrationPath);

    // Apply to prod
    await applyMigration('PROD', prodUrl, migrationPath);
  }

  console.log('\n\n✅ ALL MIGRATIONS APPLIED SUCCESSFULLY!\n');
  console.log('Next steps:');
  console.log('1. npx prisma db pull');
  console.log('2. npx prisma generate');
  console.log('3. npm run type-check\n');
}

main().catch((error) => {
  console.error('\n❌ Migration failed:', error.message);
  process.exit(1);
});

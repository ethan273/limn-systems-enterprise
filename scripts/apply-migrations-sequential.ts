/**
 * Apply migrations sequentially to dev and prod databases
 * Handles DO blocks and multi-line statements correctly
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

function parseSQL(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inDollarQuote = false;
  let dollarQuoteTag = '';

  const lines = sql.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comment-only lines
    if (trimmed.startsWith('--') || trimmed.length === 0) {
      continue;
    }

    // Check for DO $$ blocks
    if (trimmed.includes('DO $$')) {
      inDollarQuote = true;
      dollarQuoteTag = '$$';
      current += line + '\n';
      continue;
    }

    // Check for END$$ to close DO blocks
    if (inDollarQuote && trimmed.includes('END$$;')) {
      current += line + '\n';
      statements.push(current.trim());
      current = '';
      inDollarQuote = false;
      dollarQuoteTag = '';
      continue;
    }

    // If inside a dollar quote block, keep accumulating
    if (inDollarQuote) {
      current += line + '\n';
      continue;
    }

    // Normal SQL - accumulate until semicolon
    current += line + '\n';

    if (trimmed.endsWith(';')) {
      statements.push(current.trim());
      current = '';
    }
  }

  if (current.trim().length > 0) {
    statements.push(current.trim());
  }

  return statements.filter(s => s.length > 0);
}

async function applyMigration(dbName: string, connectionUrl: string, migrationPath: string) {
  console.log(`\n🔧 Applying migration to ${dbName}...`);
  console.log(`   File: ${path.basename(migrationPath)}`);

  const sql = fs.readFileSync(migrationPath, 'utf-8');
  const statements = parseSQL(sql);

  console.log(`   Found ${statements.length} statements to execute`);

  const pool = new Pool({
    connectionString: connectionUrl,
    ssl: { rejectUnauthorized: false },
  });

  let successCount = 0;
  let skipCount = 0;

  const client = await pool.connect();

  try {
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Get statement type for logging
      let stmtType = 'SQL';
      if (statement.includes('CREATE TYPE')) {
        const match = statement.match(/CREATE TYPE [\w.]+\.(\w+)/);
        stmtType = match ? `CREATE TYPE ${match[1]}` : 'CREATE TYPE';
      } else if (statement.startsWith('DO $$')) {
        stmtType = 'CREATE ENUM';
      } else if (statement.includes('CREATE TABLE')) {
        const match = statement.match(/CREATE TABLE IF NOT EXISTS [\w.]+\.(\w+)/);
        stmtType = match ? `CREATE TABLE ${match[1]}` : 'CREATE TABLE';
      } else if (statement.includes('CREATE INDEX')) {
        const match = statement.match(/CREATE INDEX IF NOT EXISTS (\w+)/);
        stmtType = match ? `CREATE INDEX ${match[1]}` : 'CREATE INDEX';
      } else if (statement.includes('COMMENT ON')) {
        stmtType = 'COMMENT';
      }

      try {
        await client.query(statement);
        console.log(`   ✅ ${stmtType}`);
        successCount++;
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          console.log(`   ⏭️  ${stmtType} (already exists)`);
          skipCount++;
        } else {
          console.error(`   ❌ ${stmtType}: ${error.message}`);
          throw error;
        }
      }
    }

    console.log(`   📊 ${dbName}: ${successCount} applied, ${skipCount} skipped`);
  } finally {
    client.release();
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
    '20251022_add_portal_access_to_partner_contacts.sql',
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

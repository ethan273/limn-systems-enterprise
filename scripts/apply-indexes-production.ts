/**
 * Apply performance indexes to PRODUCTION database
 * CRITICAL: Run this after dev to ensure 100% sync
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Use production DATABASE_URL
const prodDatabaseUrl = process.env.PRODUCTION_DATABASE_URL || process.env.DATABASE_URL;

if (!prodDatabaseUrl) {
  console.error('❌ PRODUCTION_DATABASE_URL not found in environment');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: prodDatabaseUrl,
    },
  },
});

async function main() {
  console.log('🚀 Applying Performance Indexes to PRODUCTION');
  console.log('===============================================\n');

  console.log('⚠️  WARNING: This will modify the PRODUCTION database!');
  console.log(`📍 Database: ${prodDatabaseUrl.substring(0, 50)}...\n`);

  // Read migration file
  const migrationPath = path.join(
    __dirname,
    '../prisma/migrations/20251018_add_performance_indexes.sql'
  );

  console.log(`📄 Reading migration: ${migrationPath}\n`);

  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  // Split into individual CREATE INDEX statements
  const statements = migrationSQL
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.includes('CREATE INDEX'));

  console.log(`Found ${statements.length} index statements\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const statement of statements) {
    // Extract index name
    const match = statement.match(/CREATE INDEX CONCURRENTLY IF NOT EXISTS "([^"]+)"/);
    const indexName = match ? match[1] : 'unknown';

    try {
      await prisma.$executeRawUnsafe(statement + ';');
      console.log(`✅ Created: ${indexName}`);
      created++;
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log(`⏭️  Skipped: ${indexName} (already exists)`);
        skipped++;
      } else {
        console.error(`❌ Error: ${indexName} - ${error.message}`);
        errors++;
      }
    }
  }

  console.log('\n📊 PRODUCTION Results:');
  console.log(`   ✅ Created: ${created}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}\n`);

  if (errors > 0) {
    console.log('⚠️  Some indexes failed to create. Check errors above.');
  } else {
    console.log('✅ All indexes applied to PRODUCTION successfully!');
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ Migration failed:', error);
  prisma.$disconnect();
  process.exit(1);
});

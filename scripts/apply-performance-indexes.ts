/**
 * Apply performance indexes to database
 * Uses Prisma to execute raw SQL for index creation
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('🚀 Applying Performance Indexes');
  console.log('=================================\n');

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

  console.log('\n📊 Results:');
  console.log(`   ✅ Created: ${created}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}\n`);

  if (errors > 0) {
    console.log('⚠️  Some indexes failed to create. Check errors above.');
  } else {
    console.log('✅ All indexes applied successfully!');
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ Migration failed:', error);
  prisma.$disconnect();
  process.exit(1);
});

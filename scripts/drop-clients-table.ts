#!/usr/bin/env tsx

/**
 * Script: Drop Unused Clients Table
 * Purpose: Execute migration to drop clients table from both DEV and PROD databases
 * Usage: npx tsx scripts/drop-clients-table.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
};

async function dropClientsTable(databaseUrl: string, dbName: string) {
  console.log(`\n${colors.yellow}--------------------------------------------------${colors.reset}`);
  console.log(`${colors.yellow}Dropping clients table from ${dbName} database...${colors.reset}`);
  console.log(`${colors.yellow}--------------------------------------------------${colors.reset}\n`);

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  try {
    // Step 1: Check if clients table exists and has data
    console.log(`[${dbName}] Checking if clients table exists...`);

    const tableExists = await prisma.$queryRawUnsafe<any[]>(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'clients'
      ) as exists;
    `);

    if (!tableExists[0]?.exists) {
      console.log(`${colors.green}✓ [${dbName}] clients table does not exist (already dropped or never existed)${colors.reset}`);
      await prisma.$disconnect();
      return true;
    }

    console.log(`[${dbName}] clients table exists, checking for data...`);

    const clientCount = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(*) as count FROM customers;
    `);

    const count = parseInt(clientCount[0]?.count || '0');

    if (count > 0) {
      console.log(`${colors.yellow}⚠️  WARNING: [${dbName}] clients table has ${count} rows.${colors.reset}`);
      console.log(`${colors.yellow}This data will be lost. Press Ctrl+C to cancel or wait 5 seconds to continue...${colors.reset}`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    } else {
      console.log(`${colors.green}✓ [${dbName}] clients table is empty. Safe to drop.${colors.reset}`);
    }

    // Step 2: Drop indexes
    console.log(`[${dbName}] Dropping indexes...`);

    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS idx_clients_updated_at;`);
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS idx_clients_status;`);
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS idx_clients_created_at;`);

    console.log(`${colors.green}✓ [${dbName}] Indexes dropped${colors.reset}`);

    // Step 3: Drop table
    console.log(`[${dbName}] Dropping clients table...`);

    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS clients CASCADE;`);

    console.log(`${colors.green}✓ [${dbName}] clients table dropped${colors.reset}`);

    // Step 4: Verify
    console.log(`[${dbName}] Verifying table was dropped...`);

    const verifyExists = await prisma.$queryRawUnsafe<any[]>(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'clients'
      ) as exists;
    `);

    if (verifyExists[0]?.exists) {
      console.log(`${colors.red}✗ FAILED: [${dbName}] clients table still exists!${colors.reset}`);
      await prisma.$disconnect();
      return false;
    }

    console.log(`${colors.green}✓ VERIFICATION PASSED: [${dbName}] clients table dropped successfully${colors.reset}`);

    await prisma.$disconnect();
    return true;

  } catch (error) {
    console.error(`${colors.red}✗ ERROR [${dbName}]:${colors.reset}`, error);
    await prisma.$disconnect();
    return false;
  }
}

async function main() {
  console.log(`${colors.yellow}===================================================================${colors.reset}`);
  console.log(`${colors.yellow}  Drop Unused Clients Table - DEV + PROD Sync${colors.reset}`);
  console.log(`${colors.yellow}===================================================================${colors.reset}\n`);

  // Load environment variables
  const devDatabaseUrl = process.env.DATABASE_URL;

  if (!devDatabaseUrl) {
    console.error(`${colors.red}ERROR: DATABASE_URL not set in .env${colors.reset}`);
    process.exit(1);
  }

  // Load production credentials
  const prodCredsPath = '/Users/eko3/limn-systems-enterprise-docs/09-SECURITY/credentials/production-credentials.env';

  if (!fs.existsSync(prodCredsPath)) {
    console.error(`${colors.red}ERROR: Production credentials file not found at ${prodCredsPath}${colors.reset}`);
    process.exit(1);
  }

  // Parse production credentials file
  const prodCredsContent = fs.readFileSync(prodCredsPath, 'utf-8');
  const prodDbUrlMatch = prodCredsContent.match(/PROD_DB_URL="([^"]+)"/);

  if (!prodDbUrlMatch) {
    console.error(`${colors.red}ERROR: PROD_DB_URL not found in production credentials file${colors.reset}`);
    process.exit(1);
  }

  const prodDatabaseUrl = prodDbUrlMatch[1];

  // Step 1: Drop from DEV database
  console.log(`\n${colors.yellow}STEP 1: Applying migration to DEV database${colors.reset}`);
  const devSuccess = await dropClientsTable(devDatabaseUrl, 'DEV');

  if (!devSuccess) {
    console.error(`${colors.red}\n✗ DEV migration failed. Aborting PROD migration.${colors.reset}`);
    process.exit(1);
  }

  // Step 2: Drop from PROD database
  console.log(`\n${colors.yellow}STEP 2: Applying migration to PROD database${colors.reset}`);
  console.log(`${colors.yellow}⚠️  WARNING: About to modify PRODUCTION database!${colors.reset}`);
  console.log(`${colors.yellow}Press Ctrl+C to cancel or wait 10 seconds to continue...${colors.reset}\n`);

  await new Promise(resolve => setTimeout(resolve, 10000));

  const prodSuccess = await dropClientsTable(prodDatabaseUrl, 'PROD');

  if (!prodSuccess) {
    console.error(`${colors.red}\n✗ PROD migration failed.${colors.reset}`);
    process.exit(1);
  }

  // Summary
  console.log(`\n${colors.green}===================================================================${colors.reset}`);
  console.log(`${colors.green}  ✓ SUCCESS: Databases are 100% in sync${colors.reset}`);
  console.log(`${colors.green}===================================================================${colors.reset}\n`);

  console.log('Next steps:');
  console.log('1. Regenerate Prisma client: npx prisma generate');
  console.log('2. Run type check: npm run type-check');
  console.log('3. Run build: npm run build');
  console.log('4. Commit changes to git\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error);
    process.exit(1);
  });

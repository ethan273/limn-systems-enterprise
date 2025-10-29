#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
};

async function cleanup(prisma: PrismaClient, dbName: string) {
  console.log(`\n${colors.yellow}Cleaning up ${dbName}...${colors.reset}`);

  try {
    // Drop the invalid constraint
    await prisma.$executeRawUnsafe(`
      ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_number_format;
    `);
    console.log(`${colors.green}✓ Removed invalid orders_number_format constraint${colors.reset}`);

    // Verify we have exactly 4 using table_constraints with CHECK type filter
    const constraints = await prisma.$queryRawUnsafe<any[]>(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE constraint_type = 'CHECK'
        AND constraint_name IN (
          'orders_must_have_customer_or_project',
          'orders_total_amount_positive',
          'production_orders_total_cost_positive',
          'production_orders_deposit_amount_positive'
        );
    `);

    if (constraints.length === 4) {
      console.log(`${colors.green}✓ VERIFIED: All 4 correct constraints exist${colors.reset}\n`);
      return true;
    } else {
      console.log(`${colors.red}✗ Found ${constraints.length} constraints (expected 4)${colors.reset}\n`);
      return false;
    }
  } catch (error: any) {
    console.error(`${colors.red}✗ ERROR:${colors.reset}`, error.message);
    return false;
  }
}

async function main() {
  console.log(`${colors.yellow}Phase 2: Cleanup and Verify${colors.reset}`);

  const devUrl = process.env.DATABASE_URL;
  if (!devUrl) {
    console.error('ERROR: DATABASE_URL not set');
    process.exit(1);
  }

  // Cleanup DEV
  const devPrisma = new PrismaClient({ datasources: { db: { url: devUrl } } });
  const devOk = await cleanup(devPrisma, 'DEV');
  await devPrisma.$disconnect();

  if (!devOk) {
    console.error(`${colors.red}DEV cleanup failed${colors.reset}`);
    process.exit(1);
  }

  // Load PROD credentials
  const prodCredsPath = '/Users/eko3/limn-systems-enterprise-docs/09-SECURITY/credentials/production-credentials.env';
  const prodCredsContent = fs.readFileSync(prodCredsPath, 'utf-8');
  const prodDbUrlMatch = prodCredsContent.match(/PROD_DB_URL="([^"]+)"/);

  if (!prodDbUrlMatch) {
    console.error('ERROR: PROD_DB_URL not found');
    process.exit(1);
  }

  // Cleanup PROD
  const prodPrisma = new PrismaClient({ datasources: { db: { url: prodDbUrlMatch[1] } } });
  const prodOk = await cleanup(prodPrisma, 'PROD');
  await prodPrisma.$disconnect();

  if (!prodOk) {
    console.error(`${colors.red}PROD cleanup failed${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.green}✓✓✓ Phase 2 Complete: 4 constraints active on DEV and PROD ✓✓✓${colors.reset}\n`);
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });

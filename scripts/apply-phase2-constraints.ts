#!/usr/bin/env tsx

/**
 * Script: Apply Phase 2 Database Constraints
 * Purpose: Add 4 database constraints (without order_number format check)
 * Usage: npx tsx scripts/apply-phase2-constraints.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

async function applyConstraints(prisma: PrismaClient, dbName: string) {
  console.log(`\n${colors.yellow}--------------------------------------------------${colors.reset}`);
  console.log(`${colors.yellow}Applying constraints to ${dbName} database...${colors.reset}`);
  console.log(`${colors.yellow}--------------------------------------------------${colors.reset}\n`);

  try {
    // Constraint 1
    console.log(`[${dbName}] Adding: orders_must_have_customer_or_project`);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE orders
      ADD CONSTRAINT orders_must_have_customer_or_project
      CHECK (customer_id IS NOT NULL OR project_id IS NOT NULL);
    `);
    console.log(`${colors.green}✓ Added${colors.reset}`);

    // Constraint 2
    console.log(`[${dbName}] Adding: orders_total_amount_positive`);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE orders
      ADD CONSTRAINT orders_total_amount_positive
      CHECK (total_amount IS NULL OR total_amount >= 0);
    `);
    console.log(`${colors.green}✓ Added${colors.reset}`);

    // Constraint 3
    console.log(`[${dbName}] Adding: production_orders_total_cost_positive`);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE production_orders
      ADD CONSTRAINT production_orders_total_cost_positive
      CHECK (total_cost IS NULL OR total_cost >= 0);
    `);
    console.log(`${colors.green}✓ Added${colors.reset}`);

    // Constraint 4
    console.log(`[${dbName}] Adding: production_orders_deposit_amount_positive`);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE production_orders
      ADD CONSTRAINT production_orders_deposit_amount_positive
      CHECK (deposit_amount IS NULL OR deposit_amount >= 0);
    `);
    console.log(`${colors.green}✓ Added${colors.reset}`);

    // Verify
    console.log(`\n[${dbName}] Verifying...`);
    const constraints = await prisma.$queryRawUnsafe<any[]>(`
      SELECT constraint_name
      FROM information_schema.constraint_column_usage
      WHERE constraint_name IN (
        'orders_must_have_customer_or_project',
        'orders_total_amount_positive',
        'production_orders_total_cost_positive',
        'production_orders_deposit_amount_positive'
      );
    `);

    if (constraints.length === 4) {
      console.log(`${colors.green}✓ VERIFICATION PASSED: All 4 constraints exist${colors.reset}\n`);
      return true;
    } else {
      console.log(`${colors.red}✗ VERIFICATION FAILED: Expected 4, found ${constraints.length}${colors.reset}\n`);
      return false;
    }

  } catch (error: any) {
    console.error(`${colors.red}✗ ERROR [${dbName}]:${colors.reset}`, error.message);
    return false;
  }
}

async function main() {
  console.log(`${colors.yellow}===================================================================${colors.reset}`);
  console.log(`${colors.yellow}  Phase 2: Add Database Constraints (4 constraints)${colors.reset}`);
  console.log(`${colors.yellow}===================================================================${colors.reset}\n`);

  const devDatabaseUrl = process.env.DATABASE_URL;
  if (!devDatabaseUrl) {
    console.error(`${colors.red}ERROR: DATABASE_URL not set${colors.reset}`);
    process.exit(1);
  }

  // Apply to DEV
  console.log(`${colors.cyan}Applying to DEV database${colors.reset}`);
  const devPrisma = new PrismaClient({ datasources: { db: { url: devDatabaseUrl } } });
  const devSuccess = await applyConstraints(devPrisma, 'DEV');
  await devPrisma.$disconnect();

  if (!devSuccess) {
    console.error(`${colors.red}✗ DEV failed${colors.reset}`);
    process.exit(1);
  }

  // Load PROD credentials
  const prodCredsPath = '/Users/eko3/limn-systems-enterprise-docs/09-SECURITY/credentials/production-credentials.env';
  if (!fs.existsSync(prodCredsPath)) {
    console.error(`${colors.red}ERROR: Production credentials not found${colors.reset}`);
    process.exit(1);
  }

  const prodCredsContent = fs.readFileSync(prodCredsPath, 'utf-8');
  const prodDbUrlMatch = prodCredsContent.match(/PROD_DB_URL="([^"]+)"/);
  if (!prodDbUrlMatch) {
    console.error(`${colors.red}ERROR: PROD_DB_URL not found${colors.reset}`);
    process.exit(1);
  }

  // Apply to PROD
  console.log(`${colors.yellow}⚠️  Applying to PRODUCTION in 3 seconds...${colors.reset}`);
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log(`${colors.cyan}Applying to PROD database${colors.reset}`);
  const prodPrisma = new PrismaClient({ datasources: { db: { url: prodDbUrlMatch[1] } } });
  const prodSuccess = await applyConstraints(prodPrisma, 'PROD');
  await prodPrisma.$disconnect();

  if (!prodSuccess) {
    console.error(`${colors.red}✗ PROD failed${colors.reset}`);
    process.exit(1);
  }

  console.log(`\n${colors.green}===================================================================${colors.reset}`);
  console.log(`${colors.green}  ✓ SUCCESS: All constraints applied to DEV and PROD${colors.reset}`);
  console.log(`${colors.green}===================================================================${colors.reset}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error);
    process.exit(1);
  });

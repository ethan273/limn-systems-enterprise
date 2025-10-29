#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
};

async function applyConstraints(prisma: PrismaClient, dbName: string) {
  console.log(`\n${colors.yellow}Applying Phase 2 constraints to ${dbName}...${colors.reset}`);

  try {
    // Constraint 1: Require customer_id OR project_id
    await prisma.$executeRawUnsafe(`
      ALTER TABLE orders
      ADD CONSTRAINT orders_must_have_customer_or_project
      CHECK (customer_id IS NOT NULL OR project_id IS NOT NULL);
    `);
    console.log(`${colors.green}✓ orders_must_have_customer_or_project${colors.reset}`);

    // Constraint 2: Positive total_amount
    await prisma.$executeRawUnsafe(`
      ALTER TABLE orders
      ADD CONSTRAINT orders_total_amount_positive
      CHECK (total_amount IS NULL OR total_amount >= 0);
    `);
    console.log(`${colors.green}✓ orders_total_amount_positive${colors.reset}`);

    // Constraint 3: Positive total_cost
    await prisma.$executeRawUnsafe(`
      ALTER TABLE production_orders
      ADD CONSTRAINT production_orders_total_cost_positive
      CHECK (total_cost IS NULL OR total_cost >= 0);
    `);
    console.log(`${colors.green}✓ production_orders_total_cost_positive${colors.reset}`);

    // Constraint 4: Positive deposit_amount
    await prisma.$executeRawUnsafe(`
      ALTER TABLE production_orders
      ADD CONSTRAINT production_orders_deposit_amount_positive
      CHECK (deposit_amount IS NULL OR deposit_amount >= 0);
    `);
    console.log(`${colors.green}✓ production_orders_deposit_amount_positive${colors.reset}`);

    // Verify
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
      console.log(`${colors.green}✓ VERIFIED: All 4 constraints applied successfully${colors.reset}\n`);
      return true;
    } else {
      console.log(`${colors.red}✗ VERIFICATION FAILED: Found ${constraints.length} constraints (expected 4)${colors.reset}\n`);
      return false;
    }
  } catch (error: any) {
    console.error(`${colors.red}✗ ERROR:${colors.reset}`, error.message);
    return false;
  }
}

async function main() {
  console.log(`${colors.yellow}Phase 2: Apply Constraints to PROD${colors.reset}`);

  // Load PROD credentials
  const prodCredsPath = '/Users/eko3/limn-systems-enterprise-docs/09-SECURITY/credentials/production-credentials.env';
  const prodCredsContent = fs.readFileSync(prodCredsPath, 'utf-8');
  const prodDbUrlMatch = prodCredsContent.match(/PROD_DB_URL="([^"]+)"/);

  if (!prodDbUrlMatch) {
    console.error('ERROR: PROD_DB_URL not found');
    process.exit(1);
  }

  // Apply to PROD
  const prodPrisma = new PrismaClient({ datasources: { db: { url: prodDbUrlMatch[1] } } });
  const prodOk = await applyConstraints(prodPrisma, 'PROD');
  await prodPrisma.$disconnect();

  if (!prodOk) {
    console.error(`${colors.red}PROD application failed${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.green}✓✓✓ Phase 2 Complete: 4 constraints active on PROD ✓✓✓${colors.reset}\n`);
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });

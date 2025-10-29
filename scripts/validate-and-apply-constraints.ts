#!/usr/bin/env tsx

/**
 * Script: Validate and Apply Database Constraints
 * Phase: 2 of 9 (Order System 100% Production Ready)
 * Usage: npx tsx scripts/validate-and-apply-constraints.ts
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

async function validateData(prisma: PrismaClient, dbName: string) {
  console.log(`\n${colors.cyan}--------------------------------------------------${colors.reset}`);
  console.log(`${colors.cyan}Validating existing data in ${dbName} database...${colors.reset}`);
  console.log(`${colors.cyan}--------------------------------------------------${colors.reset}\n`);

  let totalIssues = 0;

  // Check 1: Orders without customer_id or project_id
  console.log(`[${dbName}] CHECK 1: Orders without customer_id or project_id`);
  const invalidOrders = await prisma.$queryRawUnsafe<any[]>(`
    SELECT COUNT(*) as count FROM orders
    WHERE customer_id IS NULL AND project_id IS NULL;
  `);
  const invalidOrderCount = parseInt(invalidOrders[0]?.count || '0');

  if (invalidOrderCount === 0) {
    console.log(`${colors.green}✓ PASS - No invalid orders (0)${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ FAIL - Found ${invalidOrderCount} orders without customer_id or project_id${colors.reset}`);
    totalIssues += invalidOrderCount;

    // Show details
    const details = await prisma.$queryRawUnsafe<any[]>(`
      SELECT id, order_number, customer_id, project_id, created_at
      FROM orders
      WHERE customer_id IS NULL AND project_id IS NULL
      LIMIT 5;
    `);
    console.log('Sample invalid orders:', details);
  }

  // Check 2: Invalid order number formats
  console.log(`\n[${dbName}] CHECK 2: Invalid order number formats (should be ORD-XXXXXX)`);
  const invalidFormats = await prisma.$queryRawUnsafe<any[]>(`
    SELECT COUNT(*) as count FROM orders
    WHERE order_number !~ '^ORD-[0-9]{6}$';
  `);
  const invalidFormatCount = parseInt(invalidFormats[0]?.count || '0');

  if (invalidFormatCount === 0) {
    console.log(`${colors.green}✓ PASS - All order numbers valid (0)${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ FAIL - Found ${invalidFormatCount} invalid order number formats${colors.reset}`);
    totalIssues += invalidFormatCount;

    // Show details
    const details = await prisma.$queryRawUnsafe<any[]>(`
      SELECT id, order_number, created_at
      FROM orders
      WHERE order_number !~ '^ORD-[0-9]{6}$'
      LIMIT 5;
    `);
    console.log('Sample invalid order numbers:', details);
  }

  // Check 3: Negative amounts in orders
  console.log(`\n[${dbName}] CHECK 3: Negative amounts in orders`);
  const negativeOrderAmounts = await prisma.$queryRawUnsafe<any[]>(`
    SELECT COUNT(*) as count FROM orders
    WHERE total_amount < 0 OR deposit_amount < 0;
  `);
  const negativeOrderCount = parseInt(negativeOrderAmounts[0]?.count || '0');

  if (negativeOrderCount === 0) {
    console.log(`${colors.green}✓ PASS - No negative amounts in orders (0)${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ FAIL - Found ${negativeOrderCount} orders with negative amounts${colors.reset}`);
    totalIssues += negativeOrderCount;
  }

  // Check 4: Negative amounts in production_orders
  console.log(`\n[${dbName}] CHECK 4: Negative amounts in production_orders`);
  const negativeProductionAmounts = await prisma.$queryRawUnsafe<any[]>(`
    SELECT COUNT(*) as count FROM production_orders
    WHERE total_cost < 0 OR deposit_amount < 0;
  `);
  const negativeProductionCount = parseInt(negativeProductionAmounts[0]?.count || '0');

  if (negativeProductionCount === 0) {
    console.log(`${colors.green}✓ PASS - No negative amounts in production_orders (0)${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ FAIL - Found ${negativeProductionCount} production orders with negative amounts${colors.reset}`);
    totalIssues += negativeProductionCount;
  }

  // Summary
  console.log(`\n${colors.cyan}--------------------------------------------------${colors.reset}`);
  console.log(`${colors.cyan}Validation Summary for ${dbName}${colors.reset}`);
  console.log(`${colors.cyan}--------------------------------------------------${colors.reset}`);
  console.log(`Total Issues Found: ${totalIssues}`);

  if (totalIssues === 0) {
    console.log(`${colors.green}✓✓✓ ALL CHECKS PASSED ✓✓✓${colors.reset}`);
    console.log(`${colors.green}Database is ready for constraint migration!${colors.reset}\n`);
    return true;
  } else {
    console.log(`${colors.red}✗✗✗ VALIDATION FAILED ✗✗✗${colors.reset}`);
    console.log(`${colors.red}You MUST fix the invalid data before applying constraints!${colors.reset}\n`);
    return false;
  }
}

async function applyConstraints(prisma: PrismaClient, dbName: string) {
  console.log(`\n${colors.yellow}--------------------------------------------------${colors.reset}`);
  console.log(`${colors.yellow}Applying constraints to ${dbName} database...${colors.reset}`);
  console.log(`${colors.yellow}--------------------------------------------------${colors.reset}\n`);

  try {
    // Constraint 1: orders_must_have_customer_or_project
    console.log(`[${dbName}] Adding constraint: orders_must_have_customer_or_project`);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE orders
      ADD CONSTRAINT orders_must_have_customer_or_project
      CHECK (customer_id IS NOT NULL OR project_id IS NOT NULL);
    `);
    console.log(`${colors.green}✓ Added: orders_must_have_customer_or_project${colors.reset}`);

    // Constraint 2: orders_number_format
    console.log(`[${dbName}] Adding constraint: orders_number_format`);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE orders
      ADD CONSTRAINT orders_number_format
      CHECK (order_number ~ '^ORD-[0-9]{6}$');
    `);
    console.log(`${colors.green}✓ Added: orders_number_format${colors.reset}`);

    // Constraint 3: orders_total_amount_positive
    console.log(`[${dbName}] Adding constraint: orders_total_amount_positive`);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE orders
      ADD CONSTRAINT orders_total_amount_positive
      CHECK (total_amount IS NULL OR total_amount >= 0);
    `);
    console.log(`${colors.green}✓ Added: orders_total_amount_positive${colors.reset}`);

    // Constraint 4: orders_deposit_amount_positive
    console.log(`[${dbName}] Adding constraint: orders_deposit_amount_positive`);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE orders
      ADD CONSTRAINT orders_deposit_amount_positive
      CHECK (deposit_amount IS NULL OR deposit_amount >= 0);
    `);
    console.log(`${colors.green}✓ Added: orders_deposit_amount_positive${colors.reset}`);

    // Constraint 5: production_orders_total_cost_positive
    console.log(`[${dbName}] Adding constraint: production_orders_total_cost_positive`);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE production_orders
      ADD CONSTRAINT production_orders_total_cost_positive
      CHECK (total_cost IS NULL OR total_cost >= 0);
    `);
    console.log(`${colors.green}✓ Added: production_orders_total_cost_positive${colors.reset}`);

    // Constraint 6: production_orders_deposit_amount_positive
    console.log(`[${dbName}] Adding constraint: production_orders_deposit_amount_positive`);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE production_orders
      ADD CONSTRAINT production_orders_deposit_amount_positive
      CHECK (deposit_amount IS NULL OR deposit_amount >= 0);
    `);
    console.log(`${colors.green}✓ Added: production_orders_deposit_amount_positive${colors.reset}`);

    // Verify all constraints were added
    console.log(`\n[${dbName}] Verifying constraints...`);
    const constraints = await prisma.$queryRawUnsafe<any[]>(`
      SELECT constraint_name
      FROM information_schema.constraint_column_usage
      WHERE constraint_name IN (
        'orders_must_have_customer_or_project',
        'orders_number_format',
        'orders_total_amount_positive',
        'orders_deposit_amount_positive',
        'production_orders_total_cost_positive',
        'production_orders_deposit_amount_positive'
      );
    `);

    if (constraints.length === 6) {
      console.log(`${colors.green}✓ VERIFICATION PASSED: All 6 constraints exist${colors.reset}\n`);
      return true;
    } else {
      console.log(`${colors.red}✗ VERIFICATION FAILED: Expected 6 constraints, found ${constraints.length}${colors.reset}\n`);
      return false;
    }

  } catch (error) {
    console.error(`${colors.red}✗ ERROR [${dbName}]:${colors.reset}`, error);
    return false;
  }
}

async function main() {
  console.log(`${colors.yellow}===================================================================${colors.reset}`);
  console.log(`${colors.yellow}  Phase 2: Add Database Constraints - DEV + PROD Sync${colors.reset}`);
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

  // Step 1: Validate DEV database
  console.log(`${colors.cyan}STEP 1: Validating DEV database${colors.reset}`);
  const devPrisma = new PrismaClient({
    datasources: { db: { url: devDatabaseUrl } }
  });

  const devValid = await validateData(devPrisma, 'DEV');

  if (!devValid) {
    console.error(`${colors.red}✗ DEV validation failed. Fix the data before proceeding.${colors.reset}`);
    await devPrisma.$disconnect();
    process.exit(1);
  }

  // Step 2: Apply constraints to DEV
  console.log(`${colors.cyan}STEP 2: Applying constraints to DEV database${colors.reset}`);
  const devSuccess = await applyConstraints(devPrisma, 'DEV');
  await devPrisma.$disconnect();

  if (!devSuccess) {
    console.error(`${colors.red}✗ DEV constraint application failed.${colors.reset}`);
    process.exit(1);
  }

  // Step 3: Validate PROD database
  console.log(`${colors.cyan}STEP 3: Validating PROD database${colors.reset}`);
  const prodPrisma = new PrismaClient({
    datasources: { db: { url: prodDatabaseUrl } }
  });

  const prodValid = await validateData(prodPrisma, 'PROD');

  if (!prodValid) {
    console.error(`${colors.red}✗ PROD validation failed. Fix the data before proceeding.${colors.reset}`);
    await prodPrisma.$disconnect();
    process.exit(1);
  }

  // Step 4: Apply constraints to PROD
  console.log(`${colors.yellow}⚠️  WARNING: About to apply constraints to PRODUCTION database!${colors.reset}`);
  console.log(`${colors.yellow}Press Ctrl+C to cancel or wait 5 seconds to continue...${colors.reset}\n`);
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log(`${colors.cyan}STEP 4: Applying constraints to PROD database${colors.reset}`);
  const prodSuccess = await applyConstraints(prodPrisma, 'PROD');
  await prodPrisma.$disconnect();

  if (!prodSuccess) {
    console.error(`${colors.red}✗ PROD constraint application failed.${colors.reset}`);
    process.exit(1);
  }

  // Summary
  console.log(`\n${colors.green}===================================================================${colors.reset}`);
  console.log(`${colors.green}  ✓ SUCCESS: All constraints applied to DEV and PROD${colors.reset}`);
  console.log(`${colors.green}===================================================================${colors.reset}\n`);

  console.log('Next steps:');
  console.log('1. Test order creation in application');
  console.log('2. Verify constraints work as expected');
  console.log('3. Proceed to Phase 3: Transaction Wrapping\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error);
    process.exit(1);
  });

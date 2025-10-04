/**
 * Master Database Seeding Orchestrator
 *
 * Seeds comprehensive test data across ALL application modules
 * with realistic, production-quality data including:
 * - Full SKUs for all products
 * - Complete dimensional data
 * - Realistic business information
 * - All required fields populated
 *
 * Total Records: ~2,500-3,500
 *
 * Execution Order:
 * 1. Core (Auth, Users, Roles, Permissions)
 * 2. Reference (Collections, Material Categories, Partners)
 * 3. CRM (Contacts, Leads, Customers, Projects)
 * 4. Products (Materials Hierarchy, Catalog Items with Full SKUs)
 * 5. Orders & Financial (Orders, Order Items, Invoices, Payments)
 * 6. Production (Production Orders, Shop Drawings, QC, Packing)
 *
 * Usage:
 *   npx tsx prisma/seed.ts
 *   OR
 *   npm run db:seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Import seed modules
import { seedCore } from './seeds/01-core/seed-auth';
import { seedReference } from './seeds/02-reference/seed-reference';
import { seedCRM } from './seeds/03-crm/seed-crm';
import { seedProducts } from './seeds/04-products/seed-products';
import { seedOrders } from './seeds/05-orders/seed-orders';
import { seedProduction } from './seeds/06-production/seed-production';
import { seedInvoiceTemplates } from './seeds/07-invoice-templates/seed-invoice-templates';

async function main() {
  console.log('🌱 Starting comprehensive database seeding...\n');

  try {
    // Phase 1: Core Data (Auth, Users, Roles, Permissions)
    console.log('📦 Phase 1: Seeding Core Authentication & Authorization...');
    await seedCore(prisma);
    console.log('✅ Core data seeded\n');

    // Phase 2: Reference Data (Collections, Material Categories, Partners)
    console.log('📦 Phase 2: Seeding Reference Data...');
    await seedReference(prisma);
    console.log('✅ Reference data seeded\n');

    // Phase 3: CRM Module (Contacts, Leads, Customers, Projects)
    console.log('📦 Phase 3: Seeding CRM Module...');
    await seedCRM(prisma);
    console.log('✅ CRM data seeded\n');

    // Phase 4: Products Module (Materials, Items with Full SKUs)
    console.log('📦 Phase 4: Seeding Products Module...');
    await seedProducts(prisma);
    console.log('✅ Products data seeded\n');

    // Phase 5: Orders & Financial
    console.log('📦 Phase 5: Seeding Orders & Financial Data...');
    await seedOrders(prisma);
    console.log('✅ Orders & Financial data seeded\n');

    // Phase 6: Production Module
    console.log('📦 Phase 6: Seeding Production Module...');
    await seedProduction(prisma);
    console.log('✅ Production data seeded\n');

    // Phase 7: Invoice Templates
    console.log('📦 Phase 7: Seeding Invoice Templates...');
    await seedInvoiceTemplates(prisma);
    console.log('✅ Invoice templates seeded\n');

    console.log('🎉 Database seeding completed successfully!');
    console.log('📊 Total records created: ~2,500-3,500 across all modules\n');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

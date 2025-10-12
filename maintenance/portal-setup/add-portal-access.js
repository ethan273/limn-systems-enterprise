#!/usr/bin/env node

/**
 * Add Portal Access for Test Users
 * Adds entries to customer_portal_access table for portal test users
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PORTAL_USER_IDS = {
  customer: '1032430e-54f1-4f86-98cd-fe3ab6a4781c',
  designer: 'f6f06dcc-1683-4d37-a3ef-9cf9029316b4',
  factory: '37084f25-c8d6-40cb-9a9c-d1d7f210627b'
};

async function addPortalAccess() {
  console.log('\n🔧 Adding Portal Access for Test Users');
  console.log('=' .repeat(60));

  try {
    // Customer portal access
    console.log('\n📝 Adding customer portal access...');
    const existingCustomer = await prisma.customer_portal_access.findFirst({
      where: { user_id: PORTAL_USER_IDS.customer }
    });

    if (existingCustomer) {
      console.log('   ℹ️  Customer portal access already exists');
    } else {
      await prisma.customer_portal_access.create({
        data: {
          user_id: PORTAL_USER_IDS.customer,
          customer_id: null, // nullable
          portal_role: 'viewer',
          is_active: true,
          invited_at: new Date(),
          accepted_at: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        }
      });
      console.log('   ✅ Customer portal access created');
    }

    // Designer - no special portal access table needed
    console.log('\n📝 Designer portal access...');
    console.log('   ℹ️  Designer uses standard authentication (no special table)');

    // Factory - no special portal access table needed
    console.log('\n📝 Factory portal access...');
    console.log('   ℹ️  Factory uses standard authentication (no special table)');

    console.log('\n' + '=' .repeat(60));
    console.log('✅ Portal access setup complete!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addPortalAccess().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

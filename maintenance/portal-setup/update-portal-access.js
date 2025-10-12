#!/usr/bin/env node

/**
 * Update Portal Access Customer ID
 * Links test customer portal user to an existing customer record
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const USER_ID = '1032430e-54f1-4f86-98cd-fe3ab6a4781c'; // test_customer@example.com
const CUSTOMER_ID = '010f783d-db30-4787-9f88-d99dafc2c21a'; // Marta Yundt

async function updatePortalAccess() {
  console.log('\n🔧 Updating Portal Access Customer ID');
  console.log('='.repeat(60));

  try {
    // Find the record
    const record = await prisma.customer_portal_access.findFirst({
      where: { user_id: USER_ID }
    });

    if (!record) {
      console.log('❌ No portal access record found for user');
      return;
    }

    console.log('\n📝 Found portal access record:');
    console.log(`   ID: ${record.id}`);
    console.log(`   User ID: ${record.user_id}`);
    console.log(`   Current Customer ID: ${record.customer_id || 'null'}`);

    // Update with customer ID
    const updated = await prisma.customer_portal_access.update({
      where: { id: record.id },
      data: {
        customer_id: CUSTOMER_ID,
        updated_at: new Date()
      }
    });

    console.log('\n✅ Portal access updated:');
    console.log(`   User ID: ${updated.user_id}`);
    console.log(`   Customer ID: ${updated.customer_id}`);
    console.log(`   Portal Role: ${updated.portal_role}`);
    console.log(`   Is Active: ${updated.is_active}`);

    // Verify by fetching customer name
    const customer = await prisma.customers.findUnique({
      where: { id: CUSTOMER_ID },
      select: { name: true, email: true }
    });

    console.log('\n📋 Linked to customer:');
    console.log(`   Name: ${customer?.name}`);
    console.log(`   Email: ${customer?.email}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Portal access update complete!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updatePortalAccess().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

#!/usr/bin/env node

/**
 * Delete and Recreate Test Users Properly
 *
 * This script:
 * 1. Deletes all existing test users and their portal access
 * 2. Creates proper customer/partner/QC records
 * 3. Creates test users with proper portal access linked to entities
 *
 * IMPORTANT: This creates test users with PROPER entity linkage
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_EMAILS = [
  'test_customer@limnsystems.com',
  'test_designer@limnsystems.com',
  'test_factory@limnsystems.com',
  'test_qc@limnsystems.com',
  'testuser@limnsystems.com'
];

async function deleteAllTestUsers() {
  console.log('\n🗑️  STEP 1: Delete all existing test users and entities');
  console.log('='.repeat(60));

  // Delete test entities from database
  console.log('\n📝 Deleting test entities...');

  // Delete test customers
  await prisma.customers.deleteMany({
    where: { email: { in: TEST_EMAILS } }
  });
  console.log('   ✅ Test customers deleted');

  // Delete test partners
  await prisma.partners.deleteMany({
    where: { primary_email: { in: TEST_EMAILS } }
  });
  console.log('   ✅ Test partners deleted');

  // Delete test QC testers
  await prisma.qc_testers.deleteMany({
    where: { primary_email: { in: TEST_EMAILS } }
  });
  console.log('   ✅ Test QC testers deleted');

  // Get all test users from auth
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('❌ Error listing users:', listError);
    throw listError;
  }

  const testUsers = users.filter(u => TEST_EMAILS.includes(u.email));
  console.log(`\n📋 Found ${testUsers.length} test auth users to delete:`);
  testUsers.forEach(u => console.log(`   - ${u.email}`));

  // Delete portal access records first
  for (const user of testUsers) {
    console.log(`\n   Deleting portal access for ${user.email}...`);
    await prisma.customer_portal_access.deleteMany({
      where: { user_id: user.id }
    });
    console.log(`   ✅ Portal access deleted`);
  }

  // Delete auth users
  for (const user of testUsers) {
    console.log(`\n   Deleting auth user ${user.email}...`);
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error(`   ❌ Error deleting user:`, deleteError);
    } else {
      console.log(`   ✅ Auth user deleted`);
    }
  }

  console.log(`\n✅ All test users and entities deleted\n`);
}

async function createTestCustomer() {
  console.log('\n👤 STEP 2: Create Test Customer User');
  console.log('='.repeat(60));

  // Create customer entity
  const customer = await prisma.customers.create({
    data: {
      name: 'Test Customer',
      email: 'test_customer@limnsystems.com',
      phone: '+1-555-0100',
      company_name: 'Test Customer Company',
      notes: 'Test customer for development',
      created_at: new Date(),
      updated_at: new Date()
    }
  });
  console.log(`\n✅ Customer created: ${customer.name} (ID: ${customer.id})`);

  // Create auth user
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: 'test_customer@limnsystems.com',
    password: 'TestPassword123!',
    email_confirm: true,
    user_metadata: { name: 'Test Customer' }
  });

  if (authError) {
    console.error('❌ Error creating auth user:', authError);
    throw authError;
  }
  console.log(`✅ Auth user created: ${authUser.user.email} (ID: ${authUser.user.id})`);

  // Create portal access with PROPER entity linkage
  const portalAccess = await prisma.customer_portal_access.create({
    data: {
      user_id: authUser.user.id,
      customer_id: customer.id,        // Legacy field
      entity_type: 'customer',          // Universal field
      entity_id: customer.id,           // Universal field - CRITICAL!
      portal_type: 'customer',
      portal_role: 'admin',
      is_active: true,
      invited_at: new Date(),
      accepted_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    }
  });
  console.log(`✅ Portal access created with entity linkage:`);
  console.log(`   - customer_id: ${portalAccess.customer_id}`);
  console.log(`   - entity_type: ${portalAccess.entity_type}`);
  console.log(`   - entity_id: ${portalAccess.entity_id}`);
}

async function createTestDesigner() {
  console.log('\n🎨 STEP 3: Create Test Designer User');
  console.log('='.repeat(60));

  // Create partner entity
  const partner = await prisma.partners.create({
    data: {
      type: 'designer',
      company_name: 'Test Design Studio',
      primary_contact: 'Test Designer',
      primary_email: 'test_designer@limnsystems.com',
      primary_phone: '+1-555-0101',
      address_line1: '123 Test Street',
      city: 'Los Angeles',
      postal_code: '90001',
      country: 'USA',
      currency: 'USD',
      status: 'active',
      portal_enabled: true,
      is_verified: false,
      created_at: new Date(),
      updated_at: new Date()
    }
  });
  console.log(`\n✅ Partner created: ${partner.company_name} (ID: ${partner.id})`);

  // Create auth user
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: 'test_designer@limnsystems.com',
    password: 'TestPassword123!',
    email_confirm: true,
    user_metadata: { name: 'Test Designer' }
  });

  if (authError) {
    console.error('❌ Error creating auth user:', authError);
    throw authError;
  }
  console.log(`✅ Auth user created: ${authUser.user.email} (ID: ${authUser.user.id})`);

  // Create portal access with PROPER entity linkage
  const portalAccess = await prisma.customer_portal_access.create({
    data: {
      user_id: authUser.user.id,
      customer_id: null,                // No customer for designer
      entity_type: 'partner',           // Universal field
      entity_id: partner.id,            // Universal field - CRITICAL!
      portal_type: 'designer',
      portal_role: 'admin',
      is_active: true,
      invited_at: new Date(),
      accepted_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    }
  });
  console.log(`✅ Portal access created with entity linkage:`);
  console.log(`   - customer_id: ${portalAccess.customer_id}`);
  console.log(`   - entity_type: ${portalAccess.entity_type}`);
  console.log(`   - entity_id: ${portalAccess.entity_id}`);
}

async function createTestFactory() {
  console.log('\n🏭 STEP 4: Create Test Factory User');
  console.log('='.repeat(60));

  // Create partner entity
  const partner = await prisma.partners.create({
    data: {
      type: 'factory',
      company_name: 'Test Factory Inc',
      primary_contact: 'Test Factory',
      primary_email: 'test_factory@limnsystems.com',
      primary_phone: '+1-555-0102',
      address_line1: '456 Factory Ave',
      city: 'Chicago',
      postal_code: '60601',
      country: 'USA',
      currency: 'USD',
      status: 'active',
      portal_enabled: true,
      is_verified: false,
      created_at: new Date(),
      updated_at: new Date()
    }
  });
  console.log(`\n✅ Partner created: ${partner.company_name} (ID: ${partner.id})`);

  // Create auth user
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: 'test_factory@limnsystems.com',
    password: 'TestPassword123!',
    email_confirm: true,
    user_metadata: { name: 'Test Factory' }
  });

  if (authError) {
    console.error('❌ Error creating auth user:', authError);
    throw authError;
  }
  console.log(`✅ Auth user created: ${authUser.user.email} (ID: ${authUser.user.id})`);

  // Create portal access with PROPER entity linkage
  const portalAccess = await prisma.customer_portal_access.create({
    data: {
      user_id: authUser.user.id,
      customer_id: null,                // No customer for factory
      entity_type: 'partner',           // Universal field
      entity_id: partner.id,            // Universal field - CRITICAL!
      portal_type: 'factory',
      portal_role: 'admin',
      is_active: true,
      invited_at: new Date(),
      accepted_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    }
  });
  console.log(`✅ Portal access created with entity linkage:`);
  console.log(`   - customer_id: ${portalAccess.customer_id}`);
  console.log(`   - entity_type: ${portalAccess.entity_type}`);
  console.log(`   - entity_id: ${portalAccess.entity_id}`);
}

async function createTestQC() {
  console.log('\n🔍 STEP 5: Create Test QC User');
  console.log('='.repeat(60));

  // Create QC tester entity
  const qcTester = await prisma.qc_testers.create({
    data: {
      company_name: 'Test QC Labs',
      primary_contact: 'Test QC',
      primary_email: 'test_qc@limnsystems.com',
      phone: '+1-555-0103',
      status: 'active',
      portal_enabled: true,
      created_at: new Date(),
      updated_at: new Date()
    }
  });
  console.log(`\n✅ QC Tester created: ${qcTester.company_name} (ID: ${qcTester.id})`);

  // Create auth user
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: 'test_qc@limnsystems.com',
    password: 'TestPassword123!',
    email_confirm: true,
    user_metadata: { name: 'Test QC' }
  });

  if (authError) {
    console.error('❌ Error creating auth user:', authError);
    throw authError;
  }
  console.log(`✅ Auth user created: ${authUser.user.email} (ID: ${authUser.user.id})`);

  // Create portal access with PROPER entity linkage
  const portalAccess = await prisma.customer_portal_access.create({
    data: {
      user_id: authUser.user.id,
      customer_id: null,                // No customer for QC
      entity_type: 'qc_tester',         // Universal field
      entity_id: qcTester.id,           // Universal field - CRITICAL!
      portal_type: 'qc',
      portal_role: 'admin',
      is_active: true,
      invited_at: new Date(),
      accepted_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    }
  });
  console.log(`✅ Portal access created with entity linkage:`);
  console.log(`   - customer_id: ${portalAccess.customer_id}`);
  console.log(`   - entity_type: ${portalAccess.entity_type}`);
  console.log(`   - entity_id: ${portalAccess.entity_id}`);
}

async function verifyPortalAccess() {
  console.log('\n✅ STEP 6: Verify Portal Access');
  console.log('='.repeat(60));

  const portalAccess = await prisma.customer_portal_access.findMany({
    orderBy: { portal_type: 'asc' }
  });

  console.log(`\nFound ${portalAccess.length} portal access records:\n`);

  for (const access of portalAccess) {
    // Get user info
    const { data: authUser } = await supabase.auth.admin.getUserById(access.user_id);

    console.log(`📋 ${authUser?.user?.email || 'Unknown'}`);
    console.log(`   Portal Type: ${access.portal_type}`);
    console.log(`   Entity Type: ${access.entity_type}`);
    console.log(`   Entity ID: ${access.entity_id}`);
    console.log(`   Customer ID: ${access.customer_id || 'null'}`);
    console.log(`   Role: ${access.portal_role}`);
    console.log(`   Active: ${access.is_active}`);
    console.log('');
  }
}

async function main() {
  try {
    console.log('\n🚀 Recreating Test Users with Proper Entity Linkage');
    console.log('='.repeat(60));
    console.log('\nThis will:');
    console.log('1. Delete all existing test users');
    console.log('2. Create proper customer/partner/QC entities');
    console.log('3. Create test users with proper portal access');
    console.log('');

    await deleteAllTestUsers();
    await createTestCustomer();
    await createTestDesigner();
    await createTestFactory();
    await createTestQC();
    await verifyPortalAccess();

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test users recreated successfully!');
    console.log('\nTest Credentials (all passwords: TestPassword123!):');
    console.log('  - test_customer@limnsystems.com');
    console.log('  - test_designer@limnsystems.com');
    console.log('  - test_factory@limnsystems.com');
    console.log('  - test_qc@limnsystems.com');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

/**
 * Reset Portal Test Users
 * Deletes and recreates portal test users with correct credentials
 *
 * Usage: npx tsx scripts/reset-portal-users.ts
 */

import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });
dotenv.config();

const prisma = new PrismaClient();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface PortalTestUser {
  email: string;
  password: string;
  portalType: 'customer' | 'designer' | 'factory' | 'qc';
  userType: 'customer' | 'employee';
  firstName: string;
  lastName: string;
}

const TEST_USERS: PortalTestUser[] = [
  {
    email: 'test_customer@limnsystems.com',
    password: 'TestCustomer123!',
    portalType: 'customer',
    userType: 'customer',
    firstName: 'Test',
    lastName: 'Customer',
  },
  {
    email: 'test_designer@limnsystems.com',
    password: 'TestDesigner123!',
    portalType: 'designer',
    userType: 'employee',
    firstName: 'Test',
    lastName: 'Designer',
  },
  {
    email: 'test_factory@limnsystems.com',
    password: 'TestFactory123!',
    portalType: 'factory',
    userType: 'employee',
    firstName: 'Test',
    lastName: 'Factory',
  },
  {
    email: 'test_qc@limnsystems.com',
    password: 'TestQC123!',
    portalType: 'qc',
    userType: 'employee',
    firstName: 'Test',
    lastName: 'QC',
  },
];

async function main() {
  console.log('🔄 Resetting portal test users...\n');

  // Step 1: Get all auth users and find ones to delete (with pagination)
  console.log('📋 Fetching existing users...');
  let allUsers: any[] = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data: { users: pageUsers } } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (pageUsers.length === 0) break;
    allUsers = [...allUsers, ...pageUsers];
    if (pageUsers.length < perPage) break; // Last page
    page++;
  }

  console.log(`   Found ${allUsers.length} total auth users`);

  const usersToDelete = allUsers.filter(u =>
    TEST_USERS.some(tu => tu.email === u.email)
  );
  console.log(`   Found ${usersToDelete.length} test users to reset`);

  // Step 2: Delete existing test users
  for (const user of usersToDelete) {
    console.log(`\n🗑️  Deleting ${user.email}...`);

    // Delete portal access records
    await prisma.customer_portal_access.deleteMany({
      where: { user_id: user.id },
    });
    console.log(`   ✅ Deleted portal access records`);

    // Delete customer records
    await prisma.customers.deleteMany({
      where: { email: user.email },
    });
    console.log(`   ✅ Deleted customer records`);

    // Delete user profile
    await prisma.user_profiles.deleteMany({
      where: { id: user.id },
    });
    console.log(`   ✅ Deleted user profile`);

    // Delete auth user
    await supabaseAdmin.auth.admin.deleteUser(user.id);
    console.log(`   ✅ Deleted auth user`);
  }

  // Step 3: Create new users with correct credentials
  console.log('\n\n🆕 Creating new portal test users...\n');

  for (const testUser of TEST_USERS) {
    console.log(`\n📧 Creating ${testUser.email}...`);

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      email_confirm: true,
      user_metadata: {
        portal_type: testUser.portalType,
      },
    });

    if (authError || !authData.user) {
      console.error(`   ❌ Failed to create auth user: ${authError?.message}`);
      continue;
    }

    const userId = authData.user.id;
    console.log(`   ✅ Auth user created: ${userId}`);

    // Create user profile
    await prisma.user_profiles.create({
      data: {
        id: userId,
        email: testUser.email,
        user_type: testUser.userType,
        first_name: testUser.firstName,
        last_name: testUser.lastName,
        full_name: `${testUser.firstName} ${testUser.lastName}`,
        created_at: new Date(),
      },
    });
    console.log(`   ✅ User profile created`);

    // Create customer
    const customer = await prisma.customers.create({
      data: {
        name: `${testUser.firstName} ${testUser.lastName}`,
        email: testUser.email,
        phone: '555-TEST-0000',
        status: 'active',
        portal_access: true,
        portal_access_granted_at: new Date(),
        type: 'business',
        company: `Test ${testUser.portalType} Company`,
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        country: 'USA',
      },
    });
    console.log(`   ✅ Customer created: ${customer.id}`);

    // Create portal access
    await prisma.customer_portal_access.create({
      data: {
        user_id: userId,
        customer_id: customer.id,
        portal_type: testUser.portalType,
        portal_role: 'admin',
        is_active: true,
        login_count: 0,
        invited_at: new Date(),
        accepted_at: new Date(),
      },
    });
    console.log(`   ✅ Portal access created`);

    console.log(`   ✅ ${testUser.email} fully configured`);
  }

  console.log('\n\n✨ All portal test users reset successfully!\n');
  console.log('📝 Test Credentials:');
  TEST_USERS.forEach((user) => {
    console.log(`   ${user.email} / ${user.password} (${user.portalType} portal)`);
  });
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error resetting portal test users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

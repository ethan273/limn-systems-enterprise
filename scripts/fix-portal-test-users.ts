/**
 * Fix Portal Test Users
 * Manually creates user_profiles and portal_access records for existing auth users
 *
 * This script assumes the Supabase auth users already exist with these emails:
 * - test_customer@limnsystems.com
 * - test_designer@limnsystems.com
 * - test_factory@limnsystems.com
 * - test_qc@limnsystems.com
 *
 * It will:
 * 1. Fetch the user IDs from Supabase auth
 * 2. Create user_profiles records
 * 3. Create customers records
 * 4. Create customer_portal_access records
 *
 * Usage: npx tsx scripts/fix-portal-test-users.ts
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
  console.log('🔧 Fixing portal test users...\n');

  // Get all auth users
  const { data: { users: allUsers } } = await supabaseAdmin.auth.admin.listUsers();

  for (const testUser of TEST_USERS) {
    console.log(`\n📧 Processing ${testUser.email}...`);

    // Find auth user by email
    const authUser = allUsers.find(u => u.email === testUser.email);

    if (!authUser) {
      console.log(`   ⚠️  Auth user not found - creating...`);

      // Create auth user
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true,
        user_metadata: {
          portal_type: testUser.portalType,
        },
      });

      if (error || !data.user) {
        console.error(`   ❌ Failed to create auth user: ${error?.message}`);
        continue;
      }

      console.log(`   ✅ Auth user created: ${data.user.id}`);
    } else {
      console.log(`   ✅ Found auth user: ${authUser.id}`);

      // Update password to ensure it's correct
      await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
        password: testUser.password,
      });
      console.log(`   ✅ Password updated`);
    }

    const userId = authUser?.id || (await supabaseAdmin.auth.admin.listUsers()).data.users.find(u => u.email === testUser.email)!.id;

    // Create or update user_profile
    const existingProfile = await prisma.user_profiles.findUnique({
      where: { id: userId },
    });

    if (!existingProfile) {
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
    } else {
      console.log(`   ℹ️  User profile already exists`);
    }

    // Create or find customer
    let customer = await prisma.customers.findFirst({
      where: { email: testUser.email },
    });

    if (!customer) {
      customer = await prisma.customers.create({
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
    } else {
      console.log(`   ℹ️  Customer already exists: ${customer.id}`);
    }

    // Create or update portal access
    const existingAccess = await prisma.customer_portal_access.findFirst({
      where: {
        user_id: userId,
        customer_id: customer.id,
      },
    });

    if (!existingAccess) {
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
    } else {
      // Update to ensure correct portal_type and is_active
      await prisma.customer_portal_access.update({
        where: { id: existingAccess.id },
        data: {
          portal_type: testUser.portalType,
          is_active: true,
          updated_at: new Date(),
        },
      });
      console.log(`   ✅ Portal access updated`);
    }

    console.log(`   ✅ ${testUser.email} fully configured`);
  }

  console.log('\n✨ All portal test users fixed successfully!\n');
  console.log('📝 Test Credentials:');
  TEST_USERS.forEach((user) => {
    console.log(`   ${user.email} / ${user.password} (${user.portalType} portal)`);
  });
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error fixing portal test users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

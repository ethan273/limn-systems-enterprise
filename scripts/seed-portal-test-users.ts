/**
 * Seed Portal Test Users
 * Creates the test users required for E2E portal authentication tests
 *
 * This script creates 4 portal users with hardcoded credentials for testing:
 * - test_customer@limnsystems.com (customer portal)
 * - test_designer@limnsystems.com (designer portal)
 * - test_factory@limnsystems.com (factory portal)
 * - test_qc@limnsystems.com (qc portal)
 *
 * Usage: npx tsx scripts/seed-portal-test-users.ts
 */

import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });
dotenv.config(); // Also load .env for fallback

const prisma = new PrismaClient();

// Initialize Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

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
  console.log('🌱 Seeding portal test users...\n');

  for (const testUser of TEST_USERS) {
    console.log(`\n📧 Processing ${testUser.email} (${testUser.portalType} portal)...`);

    // Step 1: Try to create auth user (will fail if exists, that's ok)
    let userId: string;
    const { data: newAuthUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      email_confirm: true, // Auto-confirm
      user_metadata: {
        portal_type: testUser.portalType,
      },
    });

    if (authError) {
      if (authError.message.includes('already been registered')) {
        // User exists, fetch by email using user_profiles
        console.log(`   ℹ️  Auth user already exists, fetching ID...`);

        // Query user_profiles to get the user ID by email
        const profile = await prisma.user_profiles.findFirst({
          where: { email: testUser.email },
        });

        if (profile) {
          userId = profile.id;
          console.log(`   ✅ Found existing user: ${userId}`);

          // Update password
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: testUser.password,
          });
          console.log(`   ✅ Password updated`);
        } else {
          console.error(`   ❌ User exists in auth but not in user_profiles - manual cleanup needed`);
          continue;
        }
      } else {
        console.error(`   ❌ Failed to create auth user: ${authError.message}`);
        continue;
      }
    } else if (newAuthUser?.user) {
      userId = newAuthUser.user.id;
      console.log(`   ✅ Auth user created: ${userId}`);
    } else {
      console.error(`   ❌ No user data returned`);
      continue;
    }

    // Step 2: Create/update user profile
    const existingProfile = await prisma.user_profiles.findUnique({
      where: { id: userId },
    });

    if (existingProfile) {
      console.log(`   ℹ️  User profile already exists`);
    } else {
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
    }

    // Step 3: Create customer (for linking to portal access)
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

    // Step 4: Create/update portal access
    const existingAccess = await prisma.customer_portal_access.findFirst({
      where: {
        user_id: userId,
        customer_id: customer.id,
      },
    });

    if (existingAccess) {
      // Update to ensure it's active and has correct portal type
      await prisma.customer_portal_access.update({
        where: { id: existingAccess.id },
        data: {
          portal_type: testUser.portalType,
          is_active: true,
          updated_at: new Date(),
        },
      });
      console.log(`   ✅ Portal access updated`);
    } else {
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
    }

    console.log(`   ✅ ${testUser.email} setup complete`);
  }

  console.log('\n✨ All portal test users seeded successfully!\n');
  console.log('📝 Test Credentials:');
  TEST_USERS.forEach((user) => {
    console.log(`   ${user.email} / ${user.password} (${user.portalType} portal)`);
  });
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding portal test users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

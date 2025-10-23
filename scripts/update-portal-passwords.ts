/**
 * Update Portal Test User Passwords
 * Updates passwords for existing test users and creates/updates required database records
 *
 * This script:
 * 1. Tries to sign in with OLD password to get user IDs
 * 2. If that fails, tries CORRECT password (user may already be set up)
 * 3. Updates password to ensure it's correct
 * 4. Creates/updates user_profiles, customers, and customer_portal_access
 *
 * Usage: npx tsx scripts/update-portal-passwords.ts
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
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface PortalTestUser {
  email: string;
  correctPassword: string;
  oldPasswords: string[];  // Possible old passwords to try
  portalType: 'customer' | 'designer' | 'factory' | 'qc';
  userType: 'customer' | 'employee';
  firstName: string;
  lastName: string;
}

const TEST_USERS: PortalTestUser[] = [
  {
    email: 'test_customer@limnsystems.com',
    correctPassword: 'TestCustomer123!',
    oldPasswords: ['Test123!@#', 'password', 'test123'],
    portalType: 'customer',
    userType: 'customer',
    firstName: 'Test',
    lastName: 'Customer',
  },
  {
    email: 'test_designer@limnsystems.com',
    correctPassword: 'TestDesigner123!',
    oldPasswords: ['Test123!@#', 'password', 'test123'],
    portalType: 'designer',
    userType: 'employee',
    firstName: 'Test',
    lastName: 'Designer',
  },
  {
    email: 'test_factory@limnsystems.com',
    correctPassword: 'TestFactory123!',
    oldPasswords: ['Test123!@#', 'password', 'test123'],
    portalType: 'factory',
    userType: 'employee',
    firstName: 'Test',
    lastName: 'Factory',
  },
  {
    email: 'test_qc@limnsystems.com',
    correctPassword: 'TestQC123!',
    oldPasswords: ['Test123!@#', 'password', 'test123'],
    portalType: 'qc',
    userType: 'employee',
    firstName: 'Test',
    lastName: 'QC',
  },
];

async function main() {
  console.log('🔑 Updating portal test user passwords...\n');

  for (const testUser of TEST_USERS) {
    console.log(`\n📧 Processing ${testUser.email}...`);

    let userId: string | null = null;

    // Try correct password first
    console.log(`   🔍 Trying correct password...`);
    const { data: correctData } = await supabaseClient.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.correctPassword,
    });

    if (correctData?.user) {
      userId = correctData.user.id;
      console.log(`   ✅ Already has correct password, user ID: ${userId}`);
      await supabaseClient.auth.signOut();
    } else {
      // Try old passwords
      for (const oldPassword of testUser.oldPasswords) {
        console.log(`   🔍 Trying old password...`);
        const { data } = await supabaseClient.auth.signInWithPassword({
          email: testUser.email,
          password: oldPassword,
        });

        if (data?.user) {
          userId = data.user.id;
          console.log(`   ✅ Signed in with old password, user ID: ${userId}`);

          // Update to correct password
          await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: testUser.correctPassword,
          });
          console.log(`   ✅ Password updated to correct value`);

          await supabaseClient.auth.signOut();
          break;
        }
      }
    }

    if (!userId) {
      console.log(`   ❌ Could not sign in with any password - user may not exist`);
      console.log(`   ℹ️  Creating new user...`);

      // Create new auth user
      const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
        email: testUser.email,
        password: testUser.correctPassword,
        email_confirm: true,
        user_metadata: {
          portal_type: testUser.portalType,
        },
      });

      if (error) {
        console.error(`   ❌ Failed to create user: ${error.message}`);
        continue;
      }

      userId = newUser.user!.id;
      console.log(`   ✅ New user created: ${userId}`);
    }

    // Create/update user profile
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

    // Create/find customer
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

    // Create/update portal access
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

  console.log('\n\n✨ All portal test users configured successfully!\n');
  console.log('📝 Test Credentials:');
  TEST_USERS.forEach((user) => {
    console.log(`   ${user.email} / ${user.correctPassword} (${user.portalType} portal)`);
  });
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error updating portal test users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

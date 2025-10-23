/**
 * Playwright Global Setup
 * Runs once before all tests to ensure portal test users exist with correct credentials
 */

import { FullConfig } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load test environment
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

const prisma = new PrismaClient();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables for test setup');
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

async function globalSetup(config: FullConfig) {
  console.log('\n🔧 [Global Setup] Ensuring portal test users exist...\n');

  for (const testUser of TEST_USERS) {
    console.log(`📧 [Setup] Processing ${testUser.email}...`);

    try {
      // Look up user in auth.users table directly (Supabase admin API is broken)
      const authUsers = await prisma.$queryRaw<Array<{ id: string; email: string }>>`
        SELECT id, email
        FROM auth.users
        WHERE email = ${testUser.email}
        LIMIT 1
      `;

      let userId: string;

      if (authUsers.length > 0) {
        // User exists in Supabase auth
        userId = authUsers[0].id;
        console.log(`   ℹ️  [Setup] Found existing auth user: ${userId}`);

        // Update password to ensure it matches test expectations
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: testUser.password,
          email_confirm: true,
        });

        if (updateError) {
          console.error(`   ⚠️  [Setup] Could not update password: ${updateError.message}`);
        } else {
          console.log(`   ✅ [Setup] Password updated`);
        }
      } else {
        // User doesn't exist in auth - create fresh
        console.log(`   📝 [Setup] Creating new auth user...`);

        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: testUser.email,
          password: testUser.password,
          email_confirm: true,
          user_metadata: {
            portal_type: testUser.portalType,
          },
        });

        if (error) {
          console.error(`   ❌ [Setup] Failed to create auth user: ${error.message}`);
          continue;
        }

        if (!data?.user?.id) {
          console.error(`   ❌ [Setup] No user ID returned from createUser`);
          continue;
        }

        userId = data.user.id;
        console.log(`   ✅ [Setup] Created new auth user: ${userId}`);
      }

      // Create user profile (works for both new and existing users)
      // Note: full_name is a generated column, don't include it
      await prisma.user_profiles.upsert({
        where: { id: userId },
        update: {},
        create: {
          id: userId,
          email: testUser.email,
          user_type: testUser.userType,
          first_name: testUser.firstName,
          last_name: testUser.lastName,
          created_at: new Date(),
        },
      });
      console.log(`   ✅ [Setup] User profile ensured`);

      // Create customer (works for both new and existing users)
      const customer = await prisma.customers.upsert({
        where: { email: testUser.email },
        update: {},
        create: {
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
      console.log(`   ✅ [Setup] Customer ensured: ${customer.id}`);

      // Create portal access (works for both new and existing users)
      await prisma.customer_portal_access.upsert({
        where: {
          customer_id_user_id: {
            customer_id: customer.id,
            user_id: userId,
          },
        },
        update: {
          portal_type: testUser.portalType,
          is_active: true,
          updated_at: new Date(),
        },
        create: {
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
      console.log(`   ✅ [Setup] Portal access ensured`);
      console.log(`   ✅ [Setup] ${testUser.email} fully configured`);
    } catch (err) {
      console.error(`   ❌ [Setup] Error processing ${testUser.email}:`, err);
    }
  }

  console.log('\n✅ [Global Setup] Portal test users ready\n');

  await prisma.$disconnect();
}

export default globalSetup;

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
    email: 'admin@test.com',
    password: 'password',
    portalType: 'qc',
    userType: 'employee', // Will be set to admin in user_roles table
    firstName: 'Admin',
    lastName: 'User',
  },
  {
    email: 'customer-user@limn.us.com',
    password: 'password',
    portalType: 'customer',
    userType: 'customer',
    firstName: 'Customer',
    lastName: 'User',
  },
  {
    email: 'designer-user@limn.us.com',
    password: 'password',
    portalType: 'designer',
    userType: 'employee',
    firstName: 'Designer',
    lastName: 'User',
  },
  {
    email: 'factory-user@limn.us.com',
    password: 'password',
    portalType: 'factory',
    userType: 'employee',
    firstName: 'Factory',
    lastName: 'User',
  },
  {
    email: 'dev-user@limn.us.com',
    password: 'password',
    portalType: 'qc',
    userType: 'employee',
    firstName: 'Dev',
    lastName: 'User',
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

      // Create user_roles entry for admin users (admin@test.com should have admin role)
      if (testUser.email === 'admin@test.com') {
        await prisma.user_roles.upsert({
          where: {
            user_id_role: {
              user_id: userId,
              role: 'admin',
            },
          },
          update: {},
          create: {
            user_id: userId,
            role: 'admin',
          },
        });
        console.log(`   ✅ [Setup] Admin role assigned in user_roles table`);
      }

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
      // IMPORTANT: For customer portal types, set customer_id. For other types (designer, factory, QC), leave customer_id as null
      // This ensures the enforcePortalAccess middleware can properly validate portal access

      // Delete any existing portal_access records for this user to ensure clean state
      await prisma.customer_portal_access.deleteMany({
        where: { user_id: userId },
      });

      // Create fresh portal access record with correct customer_id based on portal type
      await prisma.customer_portal_access.create({
        data: {
          user_id: userId,
          customer_id: testUser.portalType === 'customer' ? customer.id : null,
          portal_type: testUser.portalType,
          portal_role: 'admin',
          is_active: true,
          login_count: 0,
          invited_at: new Date(),
          accepted_at: new Date(),
        },
      });
      console.log(`   ✅ [Setup] Portal access ensured`);

      // Create test orders for customer portal users (to enable order detail tests)
      if (testUser.portalType === 'customer' && testUser.email === 'customer-user@limn.us.com') {
        // First create a project for this customer (portal uses project_id, not customer_id directly)
        const testProject = await prisma.projects.upsert({
          where: { id: '00000000-0000-0000-0000-000000000001' }, // Fixed UUID for test project
          update: {},
          create: {
            id: '00000000-0000-0000-0000-000000000001',
            name: 'Test Portal Project',
            customer_id: customer.id,
            status: 'active',
            created_at: new Date(),
            updated_at: new Date(),
          },
        });

        // Create an `orders` record (optional parent, links via customers table)
        const testOrder = await prisma.orders.upsert({
          where: { order_number: 'TEST-ORDER-001' },
          update: {},
          create: {
            order_number: 'TEST-ORDER-001',
            customer_id: customer.id, // Link to customers table (correct for production queries)
            status: 'in_production',
            total_amount: 1500.00,
            notes: 'Test order for portal E2E tests',
            created_at: new Date(),
            updated_at: new Date(),
          },
        });

        // Create production_orders record linked to both project and orders
        await prisma.production_orders.upsert({
          where: { order_number: 'TEST-PROD-ORDER-001' },
          update: {},
          create: {
            order_number: 'TEST-PROD-ORDER-001',
            product_type: 'custom',
            item_name: 'Test Product',
            item_description: 'Test product for portal E2E tests',
            quantity: 100,
            unit_price: 15.00,
            total_cost: 1500.00,
            status: 'in_production',
            order_date: new Date(),
            project_id: testProject.id, // Link to project (for portal queries)
            order_id: testOrder.id, // Link to orders (for test queries via orders.customer_id)
          },
        });
        console.log(`   ✅ [Setup] Test orders created for ${testUser.email}`);
      }

      console.log(`   ✅ [Setup] ${testUser.email} fully configured`);
    } catch (err) {
      console.error(`   ❌ [Setup] Error processing ${testUser.email}:`, err);
    }
  }

  console.log('\n✅ [Global Setup] Portal test users ready\n');

  await prisma.$disconnect();
}

export default globalSetup;

#!/usr/bin/env tsx

/**
 * Create Test Users in Supabase Auth
 *
 * Creates the deterministic test users needed for Playwright/functional tests
 * Uses Supabase Admin API to bypass email verification
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE environment variables');
  process.exit(1);
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Test users with deterministic UUIDs
const TEST_USERS = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'dev-user@limn.us.com',
    password: 'test123456',
    user_type: 'super_admin',
    first_name: 'Dev',
    last_name: 'User',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'designer-user@limn.us.com',
    password: 'test123456',
    user_type: 'designer',
    first_name: 'Designer',
    last_name: 'User',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'customer-user@limn.us.com',
    password: 'test123456',
    user_type: 'customer',
    first_name: 'Customer',
    last_name: 'User',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    email: 'factory-user@limn.us.com',
    password: 'test123456',
    user_type: 'manufacturer',
    first_name: 'Factory',
    last_name: 'User',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    email: 'contractor-user@limn.us.com',
    password: 'test123456',
    user_type: 'contractor',
    first_name: 'Contractor',
    last_name: 'User',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    email: 'regular-user@limn.us.com',
    password: 'test123456',
    user_type: 'employee',
    first_name: 'Regular',
    last_name: 'User',
  },
];

async function createTestUsers() {
  console.log('🚀 Creating test users in Supabase Auth...\n');

  let created = 0;
  let exists = 0;
  let errors = 0;

  for (const user of TEST_USERS) {
    try {
      // Try to create user with admin API
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          first_name: user.first_name,
          last_name: user.last_name,
        },
      });

      if (authError) {
        if (authError.message.includes('already exists') || authError.message.includes('already registered')) {
          console.log(`✓ ${user.email} - Already exists`);
          exists++;

          // Get the user ID from auth
          const { data: existingUsers } = await supabase.auth.admin.listUsers();
          const existingUser = existingUsers?.users?.find((u: any) => u.email === user.email);

          if (existingUser) {
            // Update user profile if exists
            const { error: profileError } = await supabase
              .from('user_profiles')
              .upsert({
                id: existingUser.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                user_type: user.user_type,
              }, {
                onConflict: 'id',
              });

            if (profileError) {
              console.log(`  ⚠️  Profile update failed: ${profileError.message}`);
            } else {
              console.log(`  ✓ User profile updated (ID: ${existingUser.id})`);
            }
          }
        } else {
          console.log(`✗ ${user.email} - Error: ${authError.message}`);
          errors++;
        }
        continue;
      }

      console.log(`✓ ${user.email} - Created with ID: ${authData.user?.id}`);
      created++;

      // Create user profile
      const userId = authData.user?.id;
      if (userId) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            id: userId,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            user_type: user.user_type,
          }, {
            onConflict: 'id',
          });

        if (profileError) {
          console.log(`  ⚠️  Profile creation failed: ${profileError.message}`);
        } else {
          console.log(`  ✓ User profile created`);
        }
      }

    } catch (error: any) {
      console.log(`✗ ${user.email} - Exception: ${error.message}`);
      errors++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`  Created: ${created}`);
  console.log(`  Already Existed: ${exists}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Total: ${TEST_USERS.length}`);

  if (created > 0 || exists === TEST_USERS.length) {
    console.log('\n✅ Test users ready for testing!');
    return 0;
  } else {
    console.log('\n❌ Failed to create all test users');
    return 1;
  }
}

// Run
createTestUsers()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

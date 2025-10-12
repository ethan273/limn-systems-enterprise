#!/usr/bin/env node

/**
 * Create Test Users in Supabase
 * Creates users needed for the test suite
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUsers() {
  console.log('\n🔧 Creating Test Users in Supabase');
  console.log('=' .repeat(70));

  const testUsers = [
    {
      email: 'admin@limnsystems.com',
      password: 'Admin123!Test',
      user_metadata: {
        full_name: 'Test Admin',
        role: 'admin',
        email_verified: true
      }
    },
    {
      email: 'testuser@limnsystems.com',
      password: 'User123!Test',
      user_metadata: {
        full_name: 'Test User',
        role: 'user',
        email_verified: true
      }
    },
    {
      email: 'manager@limnsystems.com',
      password: 'Manager123!Test',
      user_metadata: {
        full_name: 'Test Manager',
        role: 'manager',
        email_verified: true
      }
    }
  ];

  for (const user of testUsers) {
    try {
      console.log(`\nCreating: ${user.email}...`);

      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Auto-confirm the email
        user_metadata: user.user_metadata
      });

      if (error) {
        if (error.message.includes('already registered')) {
          console.log(`  ⚠️  User already exists - updating password...`);

          // Get existing user
          const { data: users } = await supabase.auth.admin.listUsers();
          const existingUser = users.users.find(u => u.email === user.email);

          if (existingUser) {
            // Update user password and metadata
            const { error: updateError } = await supabase.auth.admin.updateUserById(
              existingUser.id,
              {
                password: user.password,
                user_metadata: user.user_metadata,
                email_confirm: true
              }
            );

            if (updateError) {
              console.log(`  ❌ Error updating: ${updateError.message}`);
            } else {
              console.log(`  ✅ Updated successfully`);
            }
          }
        } else {
          console.log(`  ❌ Error: ${error.message}`);
        }
      } else {
        console.log(`  ✅ Created successfully (ID: ${data.user.id})`);
      }
    } catch (err) {
      console.log(`  ❌ Unexpected error: ${err.message}`);
    }
  }

  console.log('\n' + '=' .repeat(70));
  console.log('✅ Test user setup complete!\n');
  console.log('Credentials for .env.test:');
  console.log('ADMIN_EMAIL="admin@limnsystems.com"');
  console.log('ADMIN_PASSWORD="Admin123!Test"');
  console.log('USER_EMAIL="testuser@limnsystems.com"');
  console.log('USER_PASSWORD="User123!Test"');
  console.log('MANAGER_EMAIL="manager@limnsystems.com"');
  console.log('MANAGER_PASSWORD="Manager123!Test"\n');
}

createTestUsers().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

#!/usr/bin/env node

/**
 * Verify Test Users in Supabase
 * This script checks if the test users exist and can authenticate
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load test environment
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration in .env.test');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyTestUsers() {
  console.log('\n🔍 Verifying Test Users in Supabase');
  console.log('=' .repeat(60));

  const users = [
    {
      role: 'Admin',
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD
    },
    {
      role: 'User',
      email: process.env.USER_EMAIL,
      password: process.env.USER_PASSWORD
    },
    {
      role: 'Manager',
      email: process.env.MANAGER_EMAIL,
      password: process.env.MANAGER_PASSWORD
    }
  ];

  let allValid = true;

  for (const user of users) {
    if (!user.email || !user.password) {
      console.log(`⚠️  ${user.role}: Not configured in .env.test`);
      continue;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password
      });

      if (error) {
        console.log(`❌ ${user.role} (${user.email}): ${error.message}`);
        allValid = false;
      } else {
        console.log(`✅ ${user.role} (${user.email}): Login successful`);
        // Sign out after verification
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.log(`❌ ${user.role} (${user.email}): ${err.message}`);
      allValid = false;
    }
  }

  console.log('=' .repeat(60));

  if (allValid) {
    console.log('✅ All test users verified successfully!\n');
    console.log('You can now run the test suite:');
    console.log('  npx playwright test\n');
  } else {
    console.log('\n⚠️  Some test users need to be created.\n');
    console.log('Options to fix this:\n');
    console.log('1. Create users in Supabase Dashboard:');
    console.log(`   ${supabaseUrl}/project/auth/users\n`);
    console.log('2. Update .env.test with existing user credentials\n');
    console.log('3. Create users programmatically (see docs)\n');
  }
}

verifyTestUsers().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

#!/usr/bin/env node

/**
 * Check Existing Users in Supabase Auth
 * Lists all users so we can use existing credentials for testing
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
  console.error('Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Use service role key to access admin functions
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function listUsers() {
  console.log('\n👥 Checking Existing Users in Supabase Auth');
  console.log('=' .repeat(70));

  try {
    const { data: users, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('❌ Error fetching users:', error.message);
      return;
    }

    if (!users || users.users.length === 0) {
      console.log('\n⚠️  No users found in Supabase Auth');
      console.log('\nYou need to create test users. Options:\n');
      console.log('1. Go to Supabase Dashboard → Authentication → Users');
      console.log(`   ${supabaseUrl}/project/auth/users\n`);
      console.log('2. Click "Add User" and create test users\n');
      console.log('3. Then update .env.test with their credentials\n');
      return;
    }

    console.log(`\nFound ${users.users.length} user(s):\n`);

    users.users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleDateString()}`);
      console.log(`   Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
      if (user.user_metadata && Object.keys(user.user_metadata).length > 0) {
        console.log(`   Metadata: ${JSON.stringify(user.user_metadata)}`);
      }
      console.log('');
    });

    console.log('=' .repeat(70));
    console.log('\n💡 To use existing users for testing:');
    console.log('   Update .env.test with the email addresses above');
    console.log('   and the correct passwords for those accounts\n');

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

listUsers().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

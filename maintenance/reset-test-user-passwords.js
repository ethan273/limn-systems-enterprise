#!/usr/bin/env node

/**
 * Reset Test User Passwords
 * Updates passwords for test users to ensure they can log in
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_USERS = [
  { email: 'test_customer@limnsystems.com', password: 'LimnTest2025!Customer$Secure' },
  { email: 'test_designer@limnsystems.com', password: 'LimnTest2025!Designer$Secure' },
  { email: 'test_factory@limnsystems.com', password: 'LimnTest2025!Factory$Secure' },
  { email: 'test_qc@limnsystems.com', password: 'LimnTest2025!QcTester$Secure' },
];

async function resetPasswords() {
  console.log('\n🔐 Resetting Test User Passwords');
  console.log('='.repeat(60));

  for (const user of TEST_USERS) {
    console.log(`\n📝 Resetting password for ${user.email}...`);

    // Get user by email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error(`   ❌ Error listing users:`, listError);
      continue;
    }

    const authUser = users.find(u => u.email === user.email);

    if (!authUser) {
      console.error(`   ❌ User not found: ${user.email}`);
      continue;
    }

    // Update user password
    const { data, error } = await supabase.auth.admin.updateUserById(
      authUser.id,
      { password: user.password }
    );

    if (error) {
      console.error(`   ❌ Error updating password:`, error);
    } else {
      console.log(`   ✅ Password reset successfully`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🔑 Password: ${user.password}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Password reset complete!');
  console.log('\nTest Credentials:');
  TEST_USERS.forEach(u => {
    console.log(`  - ${u.email} / ${u.password}`);
  });
  console.log('');
}

resetPasswords().catch(console.error);

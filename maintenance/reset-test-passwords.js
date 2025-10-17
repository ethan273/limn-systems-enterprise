// Reset all test user passwords to documented values
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_USERS = [
  { email: 'test_customer@limnsystems.com', password: 'TestCustomer123!' },
  { email: 'test_designer@limnsystems.com', password: 'TestDesigner123!' },
  { email: 'test_factory@limnsystems.com', password: 'TestFactory123!' },
  { email: 'test_qc@limnsystems.com', password: 'TestQC123!' },
];

async function resetPasswords() {
  console.log('\n🔧 Resetting test user passwords...\n');

  // Get all users
  const { data: users } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });

  for (const testUser of TEST_USERS) {
    const user = users.users.find(u => u.email === testUser.email);

    if (!user) {
      console.log(`⚠️  ${testUser.email} - NOT FOUND (skipping)`);
      continue;
    }

    // Reset password
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: testUser.password,
    });

    if (error) {
      console.log(`❌ ${testUser.email} - FAILED: ${error.message}`);
    } else {
      console.log(`✅ ${testUser.email} - Password reset to ${testUser.password}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ PASSWORD RESET COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\nAll test users now have passwords matching:');
  console.log('maintenance/TEST-USER-CREDENTIALS.md');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

resetPasswords().catch(console.error);

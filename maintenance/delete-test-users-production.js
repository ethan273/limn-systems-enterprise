/**
 * DELETE TEST USERS - PRODUCTION DEPLOYMENT SCRIPT
 *
 * ⚠️  WARNING: This script will PERMANENTLY DELETE test users from the database.
 *
 * Run this script BEFORE deploying to production to remove all test users.
 *
 * Test users to be deleted:
 * - admin@test.com (SUPER_ADMIN - CRITICAL)
 * - test_designer@limnsystems.com
 * - test_factory@limnsystems.com
 * - test_qc@limnsystems.com
 * - test_customer@limnsystems.com
 * - rls-test-* users
 * - test@example.com
 */

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

// Test user patterns to identify test users
const TEST_USER_PATTERNS = [
  '@test.com',
  '@limnsystems.com',
  'rls-test-',
  'test@',
  'test_'
];

async function deleteTestUsers() {
  console.log('\n' + '='.repeat(80));
  console.log('⚠️  DELETE TEST USERS - PRODUCTION DEPLOYMENT');
  console.log('='.repeat(80));
  console.log('\n⚠️  WARNING: This will PERMANENTLY DELETE test users!\n');

  // Get all user profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('id, email, user_type');

  if (profilesError) {
    console.error('❌ Error fetching profiles:', profilesError);
    return;
  }

  // Identify test users
  const testUsers = profiles.filter(p =>
    TEST_USER_PATTERNS.some(pattern => p.email.includes(pattern))
  );

  if (testUsers.length === 0) {
    console.log('✅ No test users found. Database is clean!');
    return;
  }

  console.log(`Found ${testUsers.length} test user(s) to delete:\n`);
  testUsers.forEach((u, i) => {
    const isCritical = u.user_type === 'super_admin' ? ' 🚨 CRITICAL - SUPER_ADMIN' : '';
    console.log(`${i + 1}. ${u.email} (${u.user_type})${isCritical}`);
    console.log(`   ID: ${u.id}`);
  });

  console.log('\n' + '-'.repeat(80));
  console.log('Proceeding with deletion in 5 seconds...');
  console.log('Press Ctrl+C to cancel');
  console.log('-'.repeat(80));

  // Wait 5 seconds before proceeding
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('\n🗑️  Starting deletion...\n');

  // Get all auth users for reference
  const { data: authUsers } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });

  for (const testUser of testUsers) {
    console.log(`Deleting ${testUser.email}...`);

    // Find auth user
    const authUser = authUsers.users.find(u => u.email === testUser.email);

    if (!authUser) {
      console.log(`  ⚠️  Auth user not found, skipping`);
      continue;
    }

    // Delete in correct order to avoid FK violations
    // 1. Delete portal access
    const { error: portalError } = await supabase
      .from('customer_portal_access')
      .delete()
      .eq('user_id', testUser.id);

    if (portalError && portalError.code !== 'PGRST116') {
      console.log(`  ⚠️  Error deleting portal access: ${portalError.message}`);
    } else {
      console.log(`  ✅ Portal access deleted`);
    }

    // 2. Delete user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', testUser.id);

    if (profileError) {
      console.log(`  ❌ Error deleting profile: ${profileError.message}`);
      continue;
    } else {
      console.log(`  ✅ User profile deleted`);
    }

    // 3. Delete auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(authUser.id);

    if (authError) {
      console.log(`  ❌ Error deleting auth user: ${authError.message}`);
    } else {
      console.log(`  ✅ Auth user deleted`);
    }

    console.log('');
  }

  console.log('='.repeat(80));
  console.log('✅ DELETION COMPLETE');
  console.log('='.repeat(80));

  // Verify deletion
  console.log('\n📊 Running verification...\n');

  const { data: remainingProfiles } = await supabase
    .from('user_profiles')
    .select('id, email, user_type');

  const remainingTestUsers = remainingProfiles.filter(p =>
    TEST_USER_PATTERNS.some(pattern => p.email.includes(pattern))
  );

  if (remainingTestUsers.length === 0) {
    console.log('✅ SUCCESS: All test users have been deleted!');
    console.log('✅ Database is clean and ready for production deployment.');
  } else {
    console.log(`⚠️  WARNING: ${remainingTestUsers.length} test user(s) still remain:`);
    remainingTestUsers.forEach(u => {
      console.log(`  - ${u.email} (${u.user_type})`);
    });
    console.log('\nPlease investigate and delete manually if needed.');
  }

  console.log('\n' + '='.repeat(80));
}

// Only run if NODE_ENV is not production (safety check)
if (process.env.NODE_ENV === 'production') {
  console.error('❌ ERROR: This script should NOT be run in production environment!');
  console.error('   Run this locally against production database, or in staging.');
  process.exit(1);
}

deleteTestUsers().catch(console.error);

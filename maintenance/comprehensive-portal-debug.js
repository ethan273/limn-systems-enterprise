// Comprehensive Portal Access Debugging Script
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

const PORTAL_USERS = [
  {
    name: 'Customer',
    email: 'test_customer@limnsystems.com',
    password: 'TestCustomer123!',
    portalType: 'customer',
  },
  {
    name: 'Designer',
    email: 'test_designer@limnsystems.com',
    password: 'TestDesigner123!',
    portalType: 'designer',
  },
  {
    name: 'Factory',
    email: 'test_factory@limnsystems.com',
    password: 'TestFactory123!',
    portalType: 'factory',
  },
  {
    name: 'QC',
    email: 'test_qc@limnsystems.com',
    password: 'TestQC123!',
    portalType: 'qc',
  },
];

async function debugPortalAccess() {
  console.log('\n' + '='.repeat(80));
  console.log('COMPREHENSIVE PORTAL ACCESS DEBUGGING');
  console.log('='.repeat(80));

  for (const user of PORTAL_USERS) {
    console.log('\n' + '-'.repeat(80));
    console.log(`TESTING: ${user.name} Portal (${user.email})`);
    console.log('-'.repeat(80));

    // Step 1: Verify user exists in auth.users
    console.log('\n1️⃣  Checking auth.users...');
    const { data: users } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const authUser = users.users.find(u => u.email === user.email);

    if (!authUser) {
      console.log(`   ❌ User NOT found in auth.users`);
      console.log(`   ⚠️  BLOCKER: User must be created first`);
      continue;
    }

    console.log(`   ✅ User exists in auth.users`);
    console.log(`      User ID: ${authUser.id}`);
    console.log(`      Email: ${authUser.email}`);
    console.log(`      Email confirmed: ${authUser.email_confirmed_at ? 'Yes' : 'No'}`);
    console.log(`      Created: ${authUser.created_at}`);

    // Step 2: Verify user profile exists
    console.log('\n2️⃣  Checking user_profiles...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) {
      console.log(`   ❌ User profile NOT found`);
      console.log(`      Error: ${profileError?.message || 'No profile'}`);
      console.log(`   ⚠️  BLOCKER: User profile must exist`);
      continue;
    }

    console.log(`   ✅ User profile exists`);
    console.log(`      Full name: ${profile.first_name} ${profile.last_name}`);
    console.log(`      User type: ${profile.user_type}`);
    console.log(`      Active: ${profile.is_active}`);

    // Step 3: Check portal access records (ALL of them)
    console.log('\n3️⃣  Checking customer_portal_access...');
    const { data: allPortalAccess, error: accessError } = await supabase
      .from('customer_portal_access')
      .select('*')
      .eq('user_id', authUser.id);

    if (accessError) {
      console.log(`   ❌ Error querying portal access: ${accessError.message}`);
      continue;
    }

    if (!allPortalAccess || allPortalAccess.length === 0) {
      console.log(`   ❌ NO portal access records found`);
      console.log(`   ⚠️  BLOCKER: User needs portal access entries`);
      continue;
    }

    console.log(`   ✅ Found ${allPortalAccess.length} portal access record(s)`);
    allPortalAccess.forEach((access, idx) => {
      console.log(`      ${idx + 1}. Portal: ${access.portal_type}, Role: ${access.portal_role}, Active: ${access.is_active}`);
    });

    // Step 4: Check specific portal type access
    console.log(`\n4️⃣  Checking access for ${user.portalType} portal specifically...`);
    const specificAccess = allPortalAccess.filter(
      a => a.portal_type === user.portalType && a.is_active
    );

    if (specificAccess.length === 0) {
      console.log(`   ❌ NO active access for ${user.portalType} portal`);
      console.log(`   ⚠️  BLOCKER: User needs ${user.portalType} portal access`);
      continue;
    }

    console.log(`   ✅ Found ${specificAccess.length} active ${user.portalType} portal access record(s)`);
    specificAccess.forEach((access, idx) => {
      console.log(`      ${idx + 1}. Role: ${access.portal_role}`);
    });

    // Step 5: Test OLD middleware query (with .single())
    console.log('\n5️⃣  Testing OLD middleware query (.single())...');
    const { data: oldQuery, error: oldError } = await supabase
      .from('customer_portal_access')
      .select('portal_type, is_active')
      .eq('user_id', authUser.id)
      .eq('portal_type', user.portalType)
      .eq('is_active', true)
      .single();

    if (oldError) {
      console.log(`   ❌ OLD query FAILED (expected)`);
      console.log(`      Error code: ${oldError.code}`);
      console.log(`      Error message: ${oldError.message}`);
      console.log(`      This is WHY middleware was blocking access!`);
    } else {
      console.log(`   ⚠️  OLD query succeeded (unexpected - only 1 record?)`);
      console.log(`      Data: ${JSON.stringify(oldQuery)}`);
    }

    // Step 6: Test NEW middleware query (without .single())
    console.log('\n6️⃣  Testing NEW middleware query (no .single())...');
    const { data: newQuery, error: newError } = await supabase
      .from('customer_portal_access')
      .select('portal_type, is_active')
      .eq('user_id', authUser.id)
      .eq('portal_type', user.portalType)
      .eq('is_active', true);

    if (newError) {
      console.log(`   ❌ NEW query FAILED`);
      console.log(`      Error: ${newError.message}`);
      console.log(`   ⚠️  BLOCKER: Query should work`);
      continue;
    }

    console.log(`   ✅ NEW query succeeded`);
    console.log(`      Records found: ${newQuery.length}`);
    console.log(`      Would middleware allow? ${newQuery && newQuery.length > 0 ? 'YES ✅' : 'NO ❌'}`);

    // Step 7: Test authentication
    console.log('\n7️⃣  Testing authentication...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    });

    if (authError) {
      console.log(`   ❌ Authentication FAILED`);
      console.log(`      Error: ${authError.message}`);
      console.log(`   ⚠️  BLOCKER: Cannot login - password may be wrong`);

      // Sign out to clean up
      await supabase.auth.signOut();
      continue;
    }

    console.log(`   ✅ Authentication succeeded`);
    console.log(`      Session exists: ${authData.session ? 'Yes' : 'No'}`);

    // Clean up - sign out
    await supabase.auth.signOut();

    // Step 8: Final verdict
    console.log('\n8️⃣  FINAL VERDICT');
    const allChecks = [
      authUser !== null,
      profile !== null,
      allPortalAccess.length > 0,
      specificAccess.length > 0,
      newQuery && newQuery.length > 0,
      authData?.session !== null,
    ];

    const passedChecks = allChecks.filter(c => c).length;
    const totalChecks = allChecks.length;

    if (passedChecks === totalChecks) {
      console.log(`   ✅ ALL CHECKS PASSED (${passedChecks}/${totalChecks})`);
      console.log(`   ✅ ${user.name} portal should work AFTER middleware fix`);
    } else {
      console.log(`   ⚠️  SOME CHECKS FAILED (${passedChecks}/${totalChecks})`);
      console.log(`   ❌ ${user.name} portal will NOT work until fixed`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('DEBUGGING COMPLETE');
  console.log('='.repeat(80));

  // Summary
  console.log('\n📊 SUMMARY');
  console.log('-'.repeat(80));
  console.log('Middleware Fix Status:');
  console.log('  - Login page: FIXED (removed .single())');
  console.log('  - Middleware: FIXED (removed .single())');
  console.log('  - Server restart: Required for middleware changes');
  console.log('\nNext Steps:');
  console.log('  1. Ensure middleware.ts fix is deployed');
  console.log('  2. Restart dev server (already done)');
  console.log('  3. Clear browser cookies/cache');
  console.log('  4. Test login for each portal type');
  console.log('-'.repeat(80));
}

debugPortalAccess().catch(console.error);

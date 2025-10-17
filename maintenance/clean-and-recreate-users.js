// Clean up and recreate all test users with proper configurations
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
  {
    email: 'test_customer@limnsystems.com',
    password: 'TestCustomer123!',
    firstName: 'Customer',
    lastName: 'Test User',
    userType: 'customer',
    portalType: 'customer',
  },
  {
    email: 'test_designer@limnsystems.com',
    password: 'TestDesigner123!',
    firstName: 'Designer',
    lastName: 'Test User',
    userType: 'employee',
    portalType: 'designer',
  },
  {
    email: 'test_factory@limnsystems.com',
    password: 'TestFactory123!',
    firstName: 'Factory',
    lastName: 'Test User',
    userType: 'employee',
    portalType: 'factory',
  },
  {
    email: 'test_qc@limnsystems.com',
    password: 'TestQC123!',
    firstName: 'QC',
    lastName: 'Test User',
    userType: 'employee',
    portalType: 'qc',
  },
];

async function cleanAndRecreate() {
  console.log('\n' + '='.repeat(80));
  console.log('CLEAN UP AND RECREATE TEST USERS');
  console.log('='.repeat(80));

  // Step 1: Get all users
  console.log('\n📋 Step 1: Fetching all users...');
  const { data: allUsers } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  console.log(`   Found ${allUsers.users.length} total users in database`);

  // Step 2: Delete existing test users
  console.log('\n🗑️  Step 2: Deleting existing test users...\n');

  for (const testUser of TEST_USERS) {
    const existingUser = allUsers.users.find(u => u.email === testUser.email);

    if (!existingUser) {
      console.log(`   ⏭️  ${testUser.email} - doesn't exist (skipping)`);
      continue;
    }

    console.log(`   Processing ${testUser.email} (ID: ${existingUser.id})`);

    // Delete in correct order to avoid FK violations
    // 1. Delete portal access
    const { error: portalError } = await supabase
      .from('customer_portal_access')
      .delete()
      .eq('user_id', existingUser.id);

    if (portalError) {
      console.log(`      ⚠️  Error deleting portal access: ${portalError.message}`);
    } else {
      console.log(`      ✅ Portal access deleted`);
    }

    // 2. Delete user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', existingUser.id);

    if (profileError) {
      console.log(`      ⚠️  Error deleting user profile: ${profileError.message}`);
    } else {
      console.log(`      ✅ User profile deleted`);
    }

    // 3. Delete auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(existingUser.id);

    if (authError) {
      console.log(`      ❌ Error deleting auth user: ${authError.message}`);
    } else {
      console.log(`      ✅ Auth user deleted`);
    }

    console.log('');
  }

  // Step 3: Create fresh users
  console.log('🆕 Step 3: Creating fresh test users...\n');

  for (const testUser of TEST_USERS) {
    console.log(`   Creating ${testUser.email}...`);

    // 1. Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      email_confirm: true,
    });

    if (authError) {
      console.log(`      ❌ Failed to create auth user: ${authError.message}`);
      continue;
    }

    console.log(`      ✅ Auth user created (ID: ${authUser.user.id})`);

    // 2. Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authUser.user.id,
        email: testUser.email,
        first_name: testUser.firstName,
        last_name: testUser.lastName,
        user_type: testUser.userType,
        is_active: true,
      });

    if (profileError) {
      console.log(`      ❌ Failed to create user profile: ${profileError.message}`);
      continue;
    }

    console.log(`      ✅ User profile created`);

    // 3. Create portal access (admin + viewer roles)
    const portalAccess = [
      {
        user_id: authUser.user.id,
        portal_type: testUser.portalType,
        portal_role: 'admin',
        is_active: true,
      },
      {
        user_id: authUser.user.id,
        portal_type: testUser.portalType,
        portal_role: 'viewer',
        is_active: true,
      },
    ];

    const { error: accessError } = await supabase
      .from('customer_portal_access')
      .insert(portalAccess);

    if (accessError) {
      console.log(`      ❌ Failed to create portal access: ${accessError.message}`);
      continue;
    }

    console.log(`      ✅ Portal access created (admin + viewer)`);
    console.log('');
  }

  // Step 4: Verify all users
  console.log('✅ Step 4: Verifying all users...\n');

  const { data: newUsers } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });

  for (const testUser of TEST_USERS) {
    const user = newUsers.users.find(u => u.email === testUser.email);

    if (!user) {
      console.log(`   ❌ ${testUser.email} - NOT FOUND`);
      continue;
    }

    // Check profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Check portal access
    const { data: access } = await supabase
      .from('customer_portal_access')
      .select('*')
      .eq('user_id', user.id);

    const status = profile && access && access.length === 2 ? '✅' : '❌';
    console.log(`   ${status} ${testUser.email}`);
    console.log(`      Profile: ${profile ? 'Yes' : 'No'}`);
    console.log(`      Portal Access: ${access?.length || 0} records`);
    console.log('');
  }

  console.log('='.repeat(80));
  console.log('✅ CLEANUP AND RECREATION COMPLETE');
  console.log('='.repeat(80));
  console.log('\n📝 Test User Credentials:\n');

  TEST_USERS.forEach(u => {
    console.log(`${u.portalType.toUpperCase()} Portal:`);
    console.log(`  Email:    ${u.email}`);
    console.log(`  Password: ${u.password}`);
    console.log(`  URL:      /portal/${u.portalType}`);
    console.log('');
  });
}

cleanAndRecreate().catch(console.error);

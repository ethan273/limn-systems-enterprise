// Update customer test user email from @example.com to @limnsystems.com
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

const OLD_EMAIL = 'test_customer@example.com';
const NEW_EMAIL = 'test_customer@limnsystems.com';

async function updateCustomerEmail() {
  console.log('\n🔧 Updating customer test user email...\n');
  console.log(`From: ${OLD_EMAIL}`);
  console.log(`To:   ${NEW_EMAIL}\n`);

  // 1. Find existing customer user
  console.log('Step 1: Finding existing customer user...');
  const { data: users } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const customerUser = users.users.find(u => u.email === OLD_EMAIL);

  if (!customerUser) {
    console.error(`❌ User ${OLD_EMAIL} not found`);
    process.exit(1);
  }

  console.log(`✅ Found user (ID: ${customerUser.id})`);

  // 2. Check if new email already exists
  console.log('\nStep 2: Checking if new email already exists...');
  const existingNewEmail = users.users.find(u => u.email === NEW_EMAIL);
  if (existingNewEmail) {
    console.error(`❌ Email ${NEW_EMAIL} already exists (ID: ${existingNewEmail.id})`);
    console.log('\nOptions:');
    console.log('1. Delete the existing user and retry');
    console.log('2. Keep the old email address');
    process.exit(1);
  }
  console.log('✅ New email is available');

  // 3. Update auth user email
  console.log('\nStep 3: Updating auth user email...');
  const { error: authError } = await supabase.auth.admin.updateUserById(
    customerUser.id,
    { email: NEW_EMAIL }
  );

  if (authError) {
    console.error('❌ Error updating auth user:', authError);
    process.exit(1);
  }
  console.log('✅ Auth user email updated');

  // 4. Update user profile email
  console.log('\nStep 4: Updating user profile email...');
  const { error: profileError } = await supabase
    .from('user_profiles')
    .update({ email: NEW_EMAIL })
    .eq('id', customerUser.id);

  if (profileError) {
    console.error('❌ Error updating user profile:', profileError);
    process.exit(1);
  }
  console.log('✅ User profile email updated');

  // 5. Verify update
  console.log('\nStep 5: Verifying update...');
  const { data: updatedUsers } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const verifyUser = updatedUsers.users.find(u => u.id === customerUser.id);

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('email')
    .eq('id', customerUser.id)
    .single();

  console.log(`✅ Auth email: ${verifyUser?.email}`);
  console.log(`✅ Profile email: ${profile?.email}`);

  // 6. Check portal access still works
  console.log('\nStep 6: Verifying portal access...');
  const { data: portalAccess } = await supabase
    .from('customer_portal_access')
    .select('*')
    .eq('user_id', customerUser.id);

  console.log(`✅ Portal access entries: ${portalAccess?.length || 0}\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ CUSTOMER EMAIL UPDATE COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Old Email: ${OLD_EMAIL}`);
  console.log(`New Email: ${NEW_EMAIL}`);
  console.log(`Password:  TestCustomer123!`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

updateCustomerEmail().catch(console.error);

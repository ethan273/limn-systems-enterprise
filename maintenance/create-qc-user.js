// Create QC test user with portal access
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

const QC_USER_EMAIL = 'test_qc@limnsystems.com';
const QC_USER_PASSWORD = 'TestQC123!';

async function createQCUser() {
  console.log('\n🔧 Creating QC test user...\n');

  // 1. Create auth user
  console.log('Step 1: Creating auth user...');
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: QC_USER_EMAIL,
    password: QC_USER_PASSWORD,
    email_confirm: true,
  });

  if (authError) {
    console.error('❌ Error creating auth user:', authError);
    process.exit(1);
  }

  console.log(`✅ Auth user created (ID: ${authUser.user.id})`);

  // 2. Create user profile
  console.log('\nStep 2: Creating user profile...');
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      id: authUser.user.id,
      email: QC_USER_EMAIL,
      first_name: 'QC',
      last_name: 'Test User',
      user_type: 'employee',
      is_active: true,
    });

  if (profileError) {
    console.error('❌ Error creating user profile:', profileError);
    process.exit(1);
  }

  console.log('✅ User profile created');

  // 3. Create portal access entries (admin and viewer roles)
  console.log('\nStep 3: Creating portal access entries...');

  const portalEntries = [
    {
      user_id: authUser.user.id,
      portal_type: 'qc',
      portal_role: 'admin',
      is_active: true,
    },
    {
      user_id: authUser.user.id,
      portal_type: 'qc',
      portal_role: 'viewer',
      is_active: true,
    },
  ];

  const { error: portalError } = await supabase
    .from('customer_portal_access')
    .insert(portalEntries);

  if (portalError) {
    console.error('❌ Error creating portal access:', portalError);
    process.exit(1);
  }

  console.log('✅ Portal access entries created (admin + viewer)');

  // 4. Verify creation
  console.log('\nStep 4: Verifying...');
  const { data: verification } = await supabase
    .from('customer_portal_access')
    .select('*')
    .eq('user_id', authUser.user.id);

  console.log(`✅ Verification complete: ${verification?.length || 0} portal access entries found\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ QC TEST USER CREATED SUCCESSFULLY');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Email:    ${QC_USER_EMAIL}`);
  console.log(`Password: ${QC_USER_PASSWORD}`);
  console.log(`Roles:    admin, viewer`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

createQCUser().catch(console.error);

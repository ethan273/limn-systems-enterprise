// Complete QC test user setup (user already exists from partial creation)
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

async function completeQCUser() {
  console.log('\n🔧 Completing QC test user setup...\n');

  // 1. Find existing auth user
  console.log('Step 1: Finding existing auth user...');
  const { data: users } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const qcUser = users.users.find(u => u.email === QC_USER_EMAIL);

  if (!qcUser) {
    console.error('❌ User not found. Run create-qc-user.js instead.');
    process.exit(1);
  }

  console.log(`✅ Found auth user (ID: ${qcUser.id})`);

  // 2. Check if user profile exists
  console.log('\nStep 2: Checking user profile...');
  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', qcUser.id)
    .single();

  if (!existingProfile) {
    console.log('Creating user profile...');
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: qcUser.id,
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
  } else {
    console.log('✅ User profile already exists');
  }

  // 3. Check and create portal access entries
  console.log('\nStep 3: Checking portal access...');
  const { data: existingAccess } = await supabase
    .from('customer_portal_access')
    .select('*')
    .eq('user_id', qcUser.id);

  if (!existingAccess || existingAccess.length === 0) {
    console.log('Creating portal access entries...');
    const portalEntries = [
      {
        user_id: qcUser.id,
        portal_type: 'qc',
        portal_role: 'admin',
        is_active: true,
      },
      {
        user_id: qcUser.id,
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
  } else {
    console.log(`✅ Portal access already exists (${existingAccess.length} entries)`);
  }

  // 4. Final verification
  console.log('\nStep 4: Final verification...');
  const { data: verification } = await supabase
    .from('customer_portal_access')
    .select('*')
    .eq('user_id', qcUser.id);

  console.log(`✅ Verification complete: ${verification?.length || 0} portal access entries\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ QC TEST USER SETUP COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Email:    ${QC_USER_EMAIL}`);
  console.log(`Password: TestQC123!`);
  console.log(`Roles:    ${verification?.map(v => v.portal_role).join(', ')}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

completeQCUser().catch(console.error);

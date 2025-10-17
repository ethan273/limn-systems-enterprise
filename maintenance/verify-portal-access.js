// Verify portal access entries exist
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

async function verifyPortalAccess() {
  console.log('\n🔍 Verifying portal access entries...\n');

  // First, get ALL users (handle pagination)
  const testEmails = [
    'test_customer@example.com',
    'test_designer@limnsystems.com',
    'test_factory@limnsystems.com'
  ];

  console.log(`Looking for test emails: ${testEmails.join(', ')}\n`);

  let allUsers = [];
  let page = 1;
  let perPage = 1000; // Max page size for Supabase

  while (true) {
    const { data: users, error: userError } = await supabase.auth.admin.listUsers({
      page,
      perPage
    });

    if (userError) {
      console.error('❌ Error fetching users:', userError);
      process.exit(1);
    }

    allUsers = allUsers.concat(users.users);

    console.log(`Fetched page ${page}: ${users.users.length} users`);

    if (users.users.length < perPage) {
      // Last page
      break;
    }

    page++;
  }

  console.log(`\nTotal users in database: ${allUsers.length}\n`);

  const testUsers = allUsers.filter(u => testEmails.includes(u.email || ''));
  const userIds = testUsers.map(u => u.id);

  if (testUsers.length === 0) {
    console.log('❌ No test users found in auth.users');
    console.log('\nSearching all emails for matches:');
    const customerMatches = allUsers.filter(u => (u.email || '').includes('customer'));
    const designerMatches = allUsers.filter(u => (u.email || '').includes('designer'));
    const factoryMatches = allUsers.filter(u => (u.email || '').includes('factory'));

    console.log(`\nCustomer-related (${customerMatches.length}):`);
    customerMatches.slice(0, 5).forEach(u => console.log(`  - ${u.email}`));

    console.log(`\nDesigner-related (${designerMatches.length}):`);
    designerMatches.slice(0, 5).forEach(u => console.log(`  - ${u.email}`));

    console.log(`\nFactory-related (${factoryMatches.length}):`);
    factoryMatches.slice(0, 5).forEach(u => console.log(`  - ${u.email}`));

    process.exit(1);
  }

  console.log(`Found ${testUsers.length} test users in auth.users\n`);

  // Now get portal access entries for these users
  const { data: portalAccess, error } = await supabase
    .from('customer_portal_access')
    .select('*')
    .in('user_id', userIds)
    .order('portal_type');

  if (error) {
    console.error('❌ Error fetching portal access:', error);
    process.exit(1);
  }

  if (!portalAccess || portalAccess.length === 0) {
    console.log('❌ No portal access entries found');
    console.log('   Test users exist in auth.users but have no portal access entries\n');
    process.exit(1);
  }

  console.log(`✅ Found ${portalAccess.length} portal access entries:\n`);

  portalAccess.forEach((entry, index) => {
    const user = testUsers.find(u => u.id === entry.user_id);
    console.log(`${index + 1}. Email: ${user?.email}`);
    console.log(`   Portal Type: ${entry.portal_type}`);
    console.log(`   Role: ${entry.portal_role}`);
    console.log(`   Active: ${entry.is_active}`);
    console.log(`   Created: ${new Date(entry.created_at).toLocaleString()}\n`);
  });

  console.log('✅ Portal access verification complete!\n');
}

verifyPortalAccess().catch(console.error);

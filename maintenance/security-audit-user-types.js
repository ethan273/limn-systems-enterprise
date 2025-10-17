// Security Audit: User Type Assignments
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

async function auditUserTypes() {
  console.log('\n' + '='.repeat(80));
  console.log('SECURITY AUDIT: USER_TYPE ASSIGNMENTS');
  console.log('='.repeat(80));

  // Get all user profiles with their user_type
  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select('id, email, user_type, is_active, created_at')
    .order('user_type', { ascending: true });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  // Group by user_type
  const byType = {};
  profiles.forEach(p => {
    if (!byType[p.user_type]) byType[p.user_type] = [];
    byType[p.user_type].push(p);
  });

  console.log(`\nTotal Users: ${profiles.length}`);
  console.log('');

  // Report by type
  Object.keys(byType).sort().forEach(type => {
    const users = byType[type];
    console.log(`\n📊 ${type.toUpperCase()}: ${users.length} user(s)`);
    console.log('-'.repeat(80));

    users.forEach(u => {
      const status = u.is_active ? '✅' : '❌';
      const isTestUser = u.email.includes('test') || u.email.includes('limnsystems.com') || u.email.includes('@test.com');
      const testFlag = isTestUser ? ' [TEST USER]' : '';
      console.log(`  ${status} ${u.email}${testFlag}`);
      console.log(`     ID: ${u.id}`);
      console.log(`     Created: ${new Date(u.created_at).toLocaleDateString()}`);
    });
  });

  // Security warnings
  console.log(`\n\n⚠️  SECURITY WARNINGS`);
  console.log('='.repeat(80));

  const superAdmins = byType['super_admin'] || [];
  const testSuperAdmins = superAdmins.filter(u =>
    u.email.includes('test') || u.email.includes('@test.com')
  );

  if (testSuperAdmins.length > 0) {
    console.log(`\n🚨 CRITICAL: ${testSuperAdmins.length} TEST USER(S) WITH SUPER_ADMIN ACCESS:`);
    testSuperAdmins.forEach(u => {
      console.log(`   - ${u.email} (ID: ${u.id})`);
    });
    console.log(`   ⚠️  These MUST be deleted before production deployment!`);
  }

  const allTestUsers = profiles.filter(u =>
    u.email.includes('test') || u.email.includes('limnsystems.com') || u.email.includes('@test.com')
  );

  if (allTestUsers.length > 0) {
    console.log(`\n⚠️  Total test users in database: ${allTestUsers.length}`);
    console.log('   These should be deleted before production deployment.');
    console.log('\nTest users found:');
    allTestUsers.forEach(u => {
      console.log(`   - ${u.email} (${u.user_type})`);
    });
  }

  console.log(`\n✅ Audit complete`);
  console.log('='.repeat(80));
}

auditUserTypes().catch(console.error);

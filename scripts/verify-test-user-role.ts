import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load test environment
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTestUserRole() {
  console.log('\n🔍 Checking test user roles in database...\n');

  const testUsers = [
    { email: process.env.ADMIN_EMAIL || 'admin@test.com', expectedRole: 'super_admin' },
    { email: process.env.USER_EMAIL || 'user@test.com', expectedRole: 'employee' }
  ];

  for (const testUser of testUsers) {
    console.log(`📧 Checking: ${testUser.email}`);
    console.log(`   Expected role: ${testUser.expectedRole}`);

    // Query user_profiles directly with email
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('id, user_type, email, name')
      .eq('email', testUser.email);

    if (error) {
      console.log(`   ❌ Error querying user_profiles: ${error.message}`);
      continue;
    }

    if (!profiles || profiles.length === 0) {
      console.log(`   ❌ No profile found in user_profiles table`);
      continue;
    }

    const profile = profiles[0];
    console.log(`   ✅ Found in user_profiles (id: ${profile.id})`);
    console.log(`   Current role: ${profile.user_type}`);

    if (profile.user_type === testUser.expectedRole) {
      console.log(`   ✅ Role matches expected`);
    } else {
      console.log(`   ⚠️  MISMATCH: Expected ${testUser.expectedRole}, got ${profile.user_type}`);
      if (testUser.email === process.env.USER_EMAIL && profile.user_type === 'super_admin') {
        console.log(`   🚨 TEST CONFIGURATION ISSUE: Regular test user has super_admin privileges!`);
        console.log(`   📝 This is why the "Non-admin users cannot access admin portal" test is failing.`);
        console.log(`   ✅ The middleware is CORRECTLY allowing this user to access /admin routes.`);
        console.log(`   💡 The test user SHOULD have role 'employee' for the test to pass correctly.`);
      }
    }
    console.log('');
  }
}

verifyTestUserRole()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });

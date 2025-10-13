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

async function checkAllUsers() {
  console.log('\n🔍 Checking all users in database...\n');

  // Query all user profiles
  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select('id, user_type, email, name')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.log(`❌ Error querying user_profiles: ${error.message}`);
    return;
  }

  if (!profiles || profiles.length === 0) {
    console.log('❌ No users found in user_profiles table');
    return;
  }

  console.log(`Found ${profiles.length} users in database:\n`);
  console.log('Email                          | User Type       | ID');
  console.log('-'.repeat(80));

  for (const profile of profiles) {
    const email = (profile.email || 'N/A').padEnd(30);
    const userType = (profile.user_type || 'N/A').padEnd(15);
    const id = profile.id.substring(0, 36);
    console.log(`${email} | ${userType} | ${id}`);
  }

  console.log('\n📧 Test configuration:');
  console.log(`   ADMIN_EMAIL: ${process.env.ADMIN_EMAIL}`);
  console.log(`   USER_EMAIL: ${process.env.USER_EMAIL}`);

  // Check if configured test users exist
  console.log('\n🔍 Checking configured test users:');

  const adminEmail = process.env.ADMIN_EMAIL;
  const userEmail = process.env.USER_EMAIL;

  if (adminEmail) {
    const { data: adminProfile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('email', adminEmail)
      .single();

    if (adminProfile) {
      console.log(`   ✅ ${adminEmail}: ${adminProfile.user_type}`);
      if (adminProfile.user_type !== 'super_admin') {
        console.log(`      ⚠️  Expected 'super_admin', got '${adminProfile.user_type}'`);
      }
    } else {
      console.log(`   ❌ ${adminEmail}: NOT FOUND`);
    }
  }

  if (userEmail) {
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('email', userEmail)
      .single();

    if (userProfile) {
      console.log(`   ✅ ${userEmail}: ${userProfile.user_type}`);
      if (userProfile.user_type === 'super_admin') {
        console.log(`      🚨 ISSUE: Test user should NOT be 'super_admin'`);
        console.log(`      💡 This is why "Non-admin cannot access admin portal" test fails`);
        console.log(`      ✅ Middleware is CORRECTLY allowing admin access`);
      } else {
        console.log(`      ✅ Correct role for non-admin test user`);
      }
    } else {
      console.log(`   ❌ ${userEmail}: NOT FOUND`);
    }
  }
}

checkAllUsers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });

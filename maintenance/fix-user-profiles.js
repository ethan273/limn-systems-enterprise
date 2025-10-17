// Fix user profiles - remove duplicates and ensure one profile per user
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
  { email: 'test_designer@limnsystems.com', firstName: 'Designer', lastName: 'Test User' },
  { email: 'test_factory@limnsystems.com', firstName: 'Factory', lastName: 'Test User' },
];

async function fixUserProfiles() {
  console.log('\n🔧 Fixing user profiles...\n');

  // Get all test users
  const { data: users } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });

  for (const testUser of PORTAL_USERS) {
    const authUser = users.users.find(u => u.email === testUser.email);

    if (!authUser) {
      console.log(`⚠️  ${testUser.email} - not found in auth.users (skipping)`);
      continue;
    }

    console.log(`Processing ${testUser.email} (ID: ${authUser.id})`);

    // Check existing profiles
    const { data: existingProfiles } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.id);

    console.log(`  Found ${existingProfiles?.length || 0} existing profile(s)`);

    if (existingProfiles && existingProfiles.length > 1) {
      console.log(`  ❌ MULTIPLE PROFILES FOUND - Deleting all and recreating...`);

      // Delete all existing profiles
      const { error: deleteError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', authUser.id);

      if (deleteError) {
        console.log(`  ❌ Error deleting profiles: ${deleteError.message}`);
        continue;
      }

      console.log(`  ✅ Deleted all ${existingProfiles.length} profile(s)`);
    } else if (existingProfiles && existingProfiles.length === 1) {
      console.log(`  ✅ Single profile exists - updating it...`);

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          email: testUser.email,
          first_name: testUser.firstName,
          last_name: testUser.lastName,
          user_type: 'employee',
          is_active: true,
        })
        .eq('id', authUser.id);

      if (updateError) {
        console.log(`  ❌ Error updating profile: ${updateError.message}`);
      } else {
        console.log(`  ✅ Profile updated successfully`);
      }
      continue;
    }

    // Create new profile
    console.log(`  Creating new profile...`);
    const { error: createError } = await supabase
      .from('user_profiles')
      .insert({
        id: authUser.id,
        email: testUser.email,
        first_name: testUser.firstName,
        last_name: testUser.lastName,
        user_type: 'employee',
        is_active: true,
      });

    if (createError) {
      console.log(`  ❌ Error creating profile: ${createError.message}`);
    } else {
      console.log(`  ✅ Profile created successfully`);
    }

    // Verify
    const { data: verifyProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (verifyProfile) {
      console.log(`  ✅ Verification: ${verifyProfile.first_name} ${verifyProfile.last_name} (${verifyProfile.user_type})`);
    } else {
      console.log(`  ❌ Verification failed`);
    }

    console.log('');
  }

  console.log('✅ User profile fixes complete\n');
}

fixUserProfiles().catch(console.error);

#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function verifyTestUsers() {
  console.log('🔍 Verifying test users...\n');

  // Get all auth users
  const { data: authData } = await supabase.auth.admin.listUsers();
  const testUsers = authData?.users?.filter(u => u.email?.includes('limn.us.com')) || [];

  console.log(`Found ${testUsers.length} test users in auth.users:\n`);

  for (const user of testUsers) {
    console.log(`✓ ${user.email}`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);

    // Check if user_profile exists
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile) {
      console.log(`  Profile: ✓ (user_type: ${profile.user_type})`);
    } else {
      console.log(`  Profile: ✗ MISSING`);
    }
    console.log();
  }

  console.log('\n✅ Verification complete!');
}

verifyTestUsers().catch(console.error);

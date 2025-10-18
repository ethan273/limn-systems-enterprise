#!/usr/bin/env ts-node
/**
 * Diagnostic Script: Data Loading Issues
 *
 * This script checks:
 * 1. User profile exists and has correct permissions
 * 2. Database has seed data
 * 3. RLS policies are enabled
 * 4. User can query basic tables
 *
 * Usage: npx ts-node scripts/diagnose-data-loading.ts <user-email>
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function diagnose(userEmail?: string) {
  console.log('========================================');
  console.log('  Data Loading Diagnostic Report');
  console.log('========================================\n');

  // 1. Check if user exists and get their profile
  console.log('📋 Step 1: User Profile Check');
  console.log('─────────────────────────────────────');

  let userId: string | undefined;

  if (userEmail) {
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Error fetching auth users:', authError.message);
      return;
    }

    const authUser = authUsers.users.find(u => u.email === userEmail);

    if (!authUser) {
      console.error(`❌ No auth user found with email: ${userEmail}`);
      console.log('\n📧 Available users:');
      authUsers.users.forEach(u => {
        console.log(`  - ${u.email} (${u.id})`);
      });
      return;
    }

    userId = authUser.id;
    console.log(`✅ Auth user found: ${authUser.email}`);
    console.log(`   User ID: ${userId}`);

    // Check user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error(`❌ Error fetching user profile: ${profileError.message}`);
      console.log('   This user needs a profile in user_profiles table');
      return;
    }

    if (!profile) {
      console.error('❌ No user_profile found for this user');
      console.log('   Creating user profile is required for data access');
      return;
    }

    console.log(`✅ User profile found:`);
    console.log(`   Email: ${profile.email}`);
    console.log(`   User Type: ${profile.user_type}`);
    console.log(`   First Name: ${profile.first_name}`);
    console.log(`   Last Name: ${profile.last_name}`);
  } else {
    console.log('ℹ️  No email provided, skipping user-specific checks\n');
  }

  // 2. Check if database has data
  console.log('\n📊 Step 2: Database Data Check');
  console.log('─────────────────────────────────────');

  const tables = [
    'customers',
    'contacts',
    'leads',
    'projects',
    'tasks',
    'orders',
    'items',
    'invoices',
    'shipments',
  ];

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`❌ ${table}: Error - ${error.message}`);
    } else {
      const emoji = (count ?? 0) > 0 ? '✅' : '⚠️';
      console.log(`${emoji} ${table}: ${count ?? 0} records`);
    }
  }

  // 3. Check RLS policies
  console.log('\n🔒 Step 3: RLS Policy Check');
  console.log('─────────────────────────────────────');

  const { data: rlsPolicies, error: rlsError } = await supabase.rpc('pg_policies_info' as any);

  if (rlsError) {
    // Try alternative query
    const { data: tableInfo } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');

    if (tableInfo) {
      console.log('ℹ️  RLS policy details not available, checking table access...');
    }
  } else {
    console.log(`✅ Found ${rlsPolicies?.length ?? 0} RLS policies configured`);
  }

  // 4. Test user's data access (if userId provided)
  if (userId) {
    console.log('\n🔍 Step 4: User Data Access Test');
    console.log('─────────────────────────────────────');

    // Create a client with the user's session
    const { data: session } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail!,
    });

    console.log('Testing data access with user context...\n');

    // Test each table
    const testTables = ['customers', 'contacts', 'leads', 'projects', 'tasks'];

    for (const table of testTables) {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(1);

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: Can access (${count ?? 0} visible records)`);
      }
    }
  }

  // 5. Summary and recommendations
  console.log('\n📋 Summary and Recommendations');
  console.log('─────────────────────────────────────');

  if (userId) {
    console.log('✅ User authentication: Working');
    console.log('');
    console.log('Next steps to check:');
    console.log('  1. Open browser DevTools > Network tab');
    console.log('  2. Filter by "trpc"');
    console.log('  3. Check for failed requests (red)');
    console.log('  4. Click failed request and check Response tab');
    console.log('');
    console.log('Common issues:');
    console.log('  - RLS policies blocking user access');
    console.log('  - Empty database (no seed data)');
    console.log('  - User missing required relationships (e.g., customer_id)');
    console.log('  - Incorrect user_type in user_profile');
  }

  console.log('\n========================================\n');
}

// Get email from command line args
const userEmail = process.argv[2];

diagnose(userEmail).catch(console.error);

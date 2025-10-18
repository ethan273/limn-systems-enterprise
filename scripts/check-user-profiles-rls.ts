#!/usr/bin/env ts-node
/**
 * Check RLS status on user_profiles table
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkRLS() {
  console.log('========================================');
  console.log('  user_profiles RLS Diagnostic');
  console.log('========================================\n');

  // Check if RLS is enabled on user_profiles
  const { data: rlsStatus, error: rlsError } = await supabase.rpc('check_table_rls' as any, {
    table_name: 'user_profiles'
  });

  if (rlsError) {
    console.log('ℹ️  Using alternative query to check RLS...\n');
  }

  // Check if we can query user_profiles with service role
  console.log('📋 Test 1: Service role can query user_profiles?');
  const { data: profiles, error: profileError, count } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact' })
    .limit(5);

  if (profileError) {
    console.error('❌ FAILED:', profileError.message);
    console.error('   Code:', profileError.code);
    console.error('   This suggests the service role key is INVALID\n');
    return;
  }

  console.log(`✅ SUCCESS: Service role can query user_profiles`);
  console.log(`   Found ${count} total profiles`);
  console.log(`   Sample profiles:`, profiles?.map(p => ({ id: p.id, email: p.email, user_type: p.user_type })));
  console.log('');

  // Check if dev user exists
  console.log('📋 Test 2: Dev user profile exists?');
  const { data: devUser, error: devUserError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('email', 'dev-user@limn.us.com')
    .single();

  if (devUserError) {
    console.error('❌ FAILED:', devUserError.message);
  } else {
    console.log('✅ SUCCESS: Dev user exists');
    console.log(`   ID: ${devUser.id}`);
    console.log(`   User Type: ${devUser.user_type}`);
    console.log(`   Name: ${devUser.name}`);
  }

  console.log('\n========================================\n');
  console.log('🔍 DIAGNOSIS:\n');

  if (!profileError) {
    console.log('✅ Service role key is VALID and working');
    console.log('✅ user_profiles table is accessible\n');
    console.log('⚠️  If you still see 500 errors in production:');
    console.log('   1. Check if you REDEPLOYED Vercel after updating the key');
    console.log('   2. Environment variables only take effect after redeploy');
    console.log('   3. Go to Vercel → Deployments → Redeploy (disable cache)');
  } else {
    console.log('❌ Service role key is INVALID or missing');
    console.log('   1. Go to Supabase Dashboard → API Settings');
    console.log('   2. Copy the NEW service_role key');
    console.log('   3. Update SUPABASE_SERVICE_ROLE_KEY in Vercel');
    console.log('   4. Redeploy Vercel');
  }

  console.log('\n========================================\n');
}

checkRLS().catch(console.error);

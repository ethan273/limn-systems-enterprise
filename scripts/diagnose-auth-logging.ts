/**
 * Diagnose Auth Logging Issues
 *
 * Tests all aspects of auth callback logging to identify failures
 */

import { getSupabaseAdmin } from '@/lib/supabase';

async function diagnoseAuthLogging() {
  console.log('🔍 Diagnosing Auth Logging System\n');

  const supabase = getSupabaseAdmin();

  // Test 1: Verify constraint allows all login types
  console.log('Test 1: Checking login_type constraint...');
  const loginTypes = [
    'magic_link',
    'google_oauth_employee',
    'google_oauth_customer',
    'google_oauth',
    'saml',
    'oauth',
    'password',
  ];

  for (const loginType of loginTypes) {
    try {
      const { data, error } = await (supabase as any)
        .from('sso_login_audit')
        .insert({
          user_id: 'dac75270-87a0-4311-81b6-71941491d151', // existing user
          google_email: `test-${loginType}@test.com`,
          login_type: loginType,
          success: true,
          login_time: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.log(`  ❌ ${loginType}: ${error.message}`);
      } else {
        console.log(`  ✅ ${loginType}: OK`);
        // Cleanup
        await (supabase as any).from('sso_login_audit').delete().eq('id', data.id);
      }
    } catch (err) {
      console.log(`  ❌ ${loginType}: ${err}`);
    }
  }
  console.log('');

  // Test 2: Test with NULL user_id (for failed logins)
  console.log('Test 2: Testing NULL user_id (failed login scenario)...');
  try {
    const { data, error } = await (supabase as any)
      .from('sso_login_audit')
      .insert({
        user_id: null,
        google_email: 'failed-login@test.com',
        login_type: 'magic_link',
        success: false,
        error_message: 'Test failed login',
        login_time: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.log(`  ❌ Failed: ${error.message}`);
    } else {
      console.log(`  ✅ NULL user_id works`);
      await (supabase as any).from('sso_login_audit').delete().eq('id', data.id);
    }
  } catch (err) {
    console.log(`  ❌ Exception: ${err}`);
  }
  console.log('');

  // Test 3: Check RLS policies
  console.log('Test 3: Checking RLS policies on sso_login_audit...');
  try {
    const { data: policies } = await (supabase as any)
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'sso_login_audit');

    console.log(`  Found ${policies?.length || 0} RLS policies`);
    policies?.forEach((policy: any) => {
      console.log(`    - ${policy.policyname} (${policy.cmd})`);
    });
  } catch (err) {
    console.log(`  ⚠️  Could not query policies: ${err}`);
  }
  console.log('');

  // Test 4: Check if service role can bypass RLS
  console.log('Test 4: Testing service role INSERT permission...');
  try {
    const testId = crypto.randomUUID();
    const { error } = await (supabase as any)
      .from('sso_login_audit')
      .insert({
        id: testId,
        user_id: 'dac75270-87a0-4311-81b6-71941491d151',
        google_email: 'service-role-test@test.com',
        login_type: 'magic_link',
        success: true,
        login_time: new Date().toISOString(),
      });

    if (error) {
      console.log(`  ❌ Service role BLOCKED: ${error.message}`);
      console.log(`     This means RLS is blocking the service role!`);
    } else {
      console.log(`  ✅ Service role can INSERT`);
      await (supabase as any).from('sso_login_audit').delete().eq('id', testId);
    }
  } catch (err) {
    console.log(`  ❌ Exception: ${err}`);
  }
  console.log('');

  // Test 5: Simulate exactly what auth callback does
  console.log('Test 5: Simulating exact auth callback flow...');
  try {
    const params = {
      userId: 'dac75270-87a0-4311-81b6-71941491d151',
      email: 'daniel@limn.us.com',
      loginType: 'google_oauth_employee',
      success: true,
      ipAddress: '192.168.1.1',
      userAgent: 'Test User Agent',
    };

    const { data, error } = await (supabase as any).from('sso_login_audit').insert({
      user_id: params.userId,
      google_email: params.email,
      login_type: params.loginType,
      success: params.success,
      error_message: null,
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null,
      login_time: new Date().toISOString(),
    }).select().single();

    if (error) {
      console.log(`  ❌ Auth callback simulation FAILED:`);
      console.log(`     Error code: ${error.code}`);
      console.log(`     Error message: ${error.message}`);
      console.log(`     Error details: ${JSON.stringify(error.details)}`);
      console.log('');
      console.log('  🚨 THIS IS THE PROBLEM! Auth callback logging is failing!');
    } else {
      console.log(`  ✅ Auth callback simulation SUCCESS`);
      console.log(`     Created log ID: ${data.id}`);
      await (supabase as any).from('sso_login_audit').delete().eq('id', data.id);
    }
  } catch (err) {
    console.log(`  ❌ Exception thrown: ${err}`);
  }
  console.log('');

  console.log('📊 Diagnosis Complete');
}

diagnoseAuthLogging()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

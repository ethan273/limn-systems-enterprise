/**
 * Test Auth Provisioning
 *
 * Tests if the service role key can create user_profiles and login logs
 * This will reveal the actual error that's happening in production
 */

import { getSupabaseAdmin } from '@/lib/supabase';

async function testProvisioning() {
  console.log('🔍 Testing auth provisioning with current service role key...\n');

  const supabase = getSupabaseAdmin();

  // Test 1: Insert into user_profiles
  console.log('Test 1: Creating test user profile...');
  try {
    const testUserId = '00000000-0000-0000-0000-000000000999';
    const testEmail = 'auth-test-' + Date.now() + '@test.com';

    const { data, error } = await (supabase as any)
      .from('user_profiles')
      .insert({
        id: testUserId,
        email: testEmail,
        name: 'Auth Test User',
        first_name: 'Auth',
        last_name: 'Test',
        user_type: 'customer',
        department: 'Testing',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('❌ FAILED to create user profile');
      console.error('   Error code:', error.code);
      console.error('   Error message:', error.message);
      console.error('   Error details:', error.details);
      console.error('   Error hint:', error.hint);

      if (error.code === '42501') {
        console.error('\n🚨 PERMISSION DENIED - Service role key does NOT have access!');
        console.error('   This means either:');
        console.error('   1. Wrong key is configured (anon key instead of service role)');
        console.error('   2. RLS policy is blocking service_role');
        console.error('   3. Service role key is from wrong Supabase project');
      }

      return false;
    }

    console.log('✅ SUCCESS - Created user profile:', data.email);

    // Cleanup
    await (supabase as any).from('user_profiles').delete().eq('id', testUserId);
    console.log('   Cleaned up test profile\n');

  } catch (err) {
    console.error('❌ Exception thrown:', err);
    return false;
  }

  // Test 2: Insert into sso_login_audit
  console.log('Test 2: Creating test login log...');
  try {
    const { data, error } = await (supabase as any)
      .from('sso_login_audit')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000999',
        google_email: 'auth-test@test.com',
        login_type: 'magic_link',
        success: true,
        login_time: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('❌ FAILED to create login log');
      console.error('   Error code:', error.code);
      console.error('   Error message:', error.message);
      console.error('   Error details:', error.details);

      if (error.code === '42501') {
        console.error('\n🚨 PERMISSION DENIED on sso_login_audit table');
      }

      return false;
    }

    console.log('✅ SUCCESS - Created login log');

    // Cleanup
    await (supabase as any).from('sso_login_audit').delete().eq('id', data.id);
    console.log('   Cleaned up test log\n');

  } catch (err) {
    console.error('❌ Exception thrown:', err);
    return false;
  }

  console.log('✅ ALL TESTS PASSED - Auth provisioning should work!');
  return true;
}

testProvisioning()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

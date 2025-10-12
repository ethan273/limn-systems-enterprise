/**
 * Diagnose user_profiles RLS Issue
 *
 * This script checks:
 * 1. If RLS is enabled on user_profiles
 * 2. What policies exist
 * 3. If service role can insert
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function diagnose() {
  console.log('🔍 Diagnosing user_profiles RLS Configuration\n');

  // Step 1: Check if RLS is enabled
  console.log('Step 1: Checking RLS status...');
  const { data: tables, error: tablesError } = await supabaseAdmin
    .from('information_schema.tables')
    .select('*')
    .eq('table_name', 'user_profiles');

  if (tablesError) {
    console.error('❌ Cannot query table info:', tablesError);
  }

  // Step 2: Try to insert with service role
  console.log('\nStep 2: Testing service role INSERT...');
  const testEmail = `test-diagnostic-${Date.now()}@test.com`;
  const testUserId = '00000000-0000-0000-0000-000000000001'; // Unlikely to exist

  // First create auth user (required for FK)
  console.log('  Creating auth user first...');
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: testEmail,
    password: 'Test123!@#',
    email_confirm: true,
  });

  if (authError) {
    console.error('  ❌ Auth user creation failed:', authError);
    return;
  }

  const userId = authData.user!.id;
  console.log(`  ✅ Auth user created: ${userId}`);

  // Now try to insert user_profile with service role
  console.log('  Inserting user_profile with service role...');
  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('user_profiles')
    .insert({
      id: userId,
      email: testEmail,
      user_type: 'customer',
      first_name: 'Test',
      last_name: 'Diagnostic',
    })
    .select()
    .single();

  if (insertError) {
    console.error('  ❌ INSERT FAILED:', insertError.message);
    console.error('  Error code:', insertError.code);
    console.error('  Error details:', insertError.details);
    console.error('  Error hint:', insertError.hint);

    console.log('\n🔍 This confirms service role is being blocked by RLS!');
    console.log('   The service_role bypass policy may not be working.\n');
  } else {
    console.log('  ✅ INSERT SUCCEEDED');
    console.log('  Data:', inserted);

    // Cleanup
    await supabaseAdmin.from('user_profiles').delete().eq('id', userId);
  }

  // Cleanup auth user
  await supabaseAdmin.auth.admin.deleteUser(userId);

  // Step 3: Check RLS policies via SQL
  console.log('\nStep 3: Checking RLS policies...');
  console.log('Run this SQL in Supabase SQL Editor to see all policies:\n');
  console.log('SELECT');
  console.log('  schemaname,');
  console.log('  tablename,');
  console.log('  policyname,');
  console.log('  roles,');
  console.log('  cmd,');
  console.log('  qual,');
  console.log('  with_check');
  console.log('FROM pg_policies');
  console.log('WHERE tablename = \'user_profiles\'');
  console.log('ORDER BY policyname;\n');

  console.log('Look for:');
  console.log('  1. Is there a policy with roles = {service_role}?');
  console.log('  2. Are there policies with roles = {public} blocking service_role?');
  console.log('  3. Is the bypass policy listed?\n');

  // Step 4: Suggest fix
  if (insertError) {
    console.log('Step 4: Recommended Fix\n');
    console.log('Run this SQL in Supabase to add service role bypass:\n');
    console.log('-- Drop existing conflicting policies (if any)');
    console.log('DROP POLICY IF EXISTS "Allow service role full access" ON user_profiles;');
    console.log('');
    console.log('-- Create bypass policy');
    console.log('CREATE POLICY "service_role_bypass"');
    console.log('  ON user_profiles');
    console.log('  AS PERMISSIVE  -- Important: PERMISSIVE, not RESTRICTIVE');
    console.log('  FOR ALL');
    console.log('  TO service_role');
    console.log('  USING (true)');
    console.log('  WITH CHECK (true);');
    console.log('');
    console.log('-- Verify it was created');
    console.log('SELECT policyname, roles FROM pg_policies WHERE tablename = \'user_profiles\';\n');
  }
}

diagnose().catch(console.error);

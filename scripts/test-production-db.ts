#!/usr/bin/env ts-node
/**
 * Test if production Supabase database has data
 * Uses the same service role key as production
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testProductionDB() {
  console.log('========================================');
  console.log('  Production Database Test');
  console.log('========================================\n');

  console.log('Environment:');
  console.log(`  URL: ${supabaseUrl}`);
  console.log(`  Key: ${supabaseServiceKey.substring(0, 15)}...`);
  console.log('');

  // Test 1: Can we query user_profiles?
  console.log('📋 Test 1: Query user_profiles');
  const { data: profiles, error: profileError, count } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact' })
    .limit(5);

  if (profileError) {
    console.error('❌ FAILED:', profileError.message);
    console.error('   Code:', profileError.code);
    return;
  }

  console.log(`✅ SUCCESS: Found ${count} profiles`);
  console.log('   Sample:', profiles?.map(p => ({ email: p.email, user_type: p.user_type })));
  console.log('');

  // Test 2: Does dev user exist?
  console.log('📋 Test 2: Dev user exists?');
  const { data: devUser, error: devError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('email', 'dev-user@limn.us.com')
    .single();

  if (devError) {
    console.error('❌ FAILED:', devError.message);
  } else {
    console.log('✅ SUCCESS: Dev user found');
    console.log(`   User Type: ${devUser.user_type}`);
    console.log(`   ID: ${devUser.id}`);
  }
  console.log('');

  // Test 3: Check other tables
  console.log('📋 Test 3: Check tables have data');
  const tables = ['customers', 'orders', 'tasks', 'projects', 'leads'];

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`   ${table}: ❌ ${error.message}`);
    } else {
      const emoji = (count ?? 0) > 0 ? '✅' : '⚠️';
      console.log(`   ${table}: ${emoji} ${count ?? 0} records`);
    }
  }

  console.log('\n========================================\n');
}

testProductionDB().catch(console.error);

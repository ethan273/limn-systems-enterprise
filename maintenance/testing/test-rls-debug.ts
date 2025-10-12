/**
 * RLS Debugging Script
 * Tests if RLS policies are correctly checking auth.uid() against customer ownership
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

async function testRLSSetup() {
  console.log('🔍 RLS Debugging Script\n');

  // Step 1: Create auth user
  console.log('Step 1: Creating auth user...');
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: `rls-test-${Date.now()}@test.com`,
    password: 'Test123!@#',
    email_confirm: true,
  });

  if (authError || !authData.user) {
    console.error('❌ Failed to create auth user:', authError);
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log(`✅ Auth user created: ${userId}\n`);

  // Step 2: Create user_profile
  console.log('Step 2: Creating user_profile...');
  const { error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .insert({
      id: userId,
      email: authData.user.email,
      user_type: 'customer',
      first_name: 'RLS',
      last_name: 'Test',
    });

  if (profileError) {
    console.error('❌ Failed to create user_profile:', profileError);
    process.exit(1);
  }
  console.log('✅ User profile created\n');

  // Step 3: Create customer linked to auth user
  console.log('Step 3: Creating customer...');
  const { data: customer, error: customerError } = await supabaseAdmin
    .from('customers')
    .insert({
      user_id: userId,
      name: 'RLS Test Customer',
      email: authData.user.email,
      status: 'active',
    })
    .select()
    .single();

  if (customerError || !customer) {
    console.error('❌ Failed to create customer:', customerError);
    process.exit(1);
  }
  console.log(`✅ Customer created: ${customer.id}`);
  console.log(`   customer.user_id = ${customer.user_id}\n`);

  // Step 4: Create order for this customer
  console.log('Step 4: Creating order...');
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      customer_id: customer.id,
      order_number: `RLS-TEST-${Date.now()}`,
      status: 'pending',
      total_amount: 1000,
    })
    .select()
    .single();

  if (orderError || !order) {
    console.error('❌ Failed to create order:', orderError);
    process.exit(1);
  }
  console.log(`✅ Order created: ${order.id}`);
  console.log(`   order.customer_id = ${order.customer_id}\n`);

  // Step 5: Get access token by signing in
  console.log('Step 5: Signing in to get access token...');
  const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
    email: authData.user.email!,
    password: 'Test123!@#',
  });

  if (signInError || !signInData?.session) {
    console.error('❌ Failed to sign in:', signInError);
    process.exit(1);
  }
  console.log('✅ Access token obtained\n');

  // Step 6: Create user client with session
  console.log('Step 6: Creating user client with session...');
  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error: sessionError } = await userClient.auth.setSession({
    access_token: signInData.session.access_token,
    refresh_token: signInData.session.refresh_token,
  });

  if (sessionError) {
    console.error('❌ Failed to set session:', sessionError);
    process.exit(1);
  }
  console.log('✅ Session set\n');

  // Step 7: Verify auth.uid() is set
  console.log('Step 7: Verifying auth.uid()...');
  const { data: sessionUser } = await userClient.auth.getUser();
  console.log(`   auth.uid() = ${sessionUser.user?.id}`);
  console.log(`   Expected   = ${userId}`);
  console.log(`   Match? ${sessionUser.user?.id === userId ? '✅' : '❌'}\n`);

  // Step 8: Query orders as user (RLS enforced)
  console.log('Step 8: Querying orders as user (RLS enforced)...');
  const { data: orders, error: queryError } = await userClient
    .from('orders')
    .select('*')
    .eq('id', order.id);

  console.log(`   Query result: ${orders?.length || 0} orders`);
  if (queryError) {
    console.log(`   Query error: ${queryError.message}`);
  }

  if (orders && orders.length > 0) {
    console.log('   ✅ SUCCESS: User can see their own order!');
  } else {
    console.log('   ❌ FAILED: User cannot see their own order!');
    console.log('\n🔍 Debugging RLS policy logic:');
    console.log('   The RLS policy for orders should check:');
    console.log('   1. auth.uid() is set (we verified this above)');
    console.log('   2. orders.customer_id matches a customer where user_id = auth.uid()');
    console.log(`   3. order.customer_id = ${order.customer_id}`);
    console.log(`   4. customer.user_id = ${customer.user_id}`);
    console.log(`   5. auth.uid() = ${userId}`);
    console.log('   All IDs match, so RLS policy may need to be reviewed.');
  }

  // Cleanup
  console.log('\n🧹 Cleaning up...');
  await supabaseAdmin.from('orders').delete().eq('id', order.id);
  await supabaseAdmin.from('customers').delete().eq('id', customer.id);
  await supabaseAdmin.from('user_profiles').delete().eq('id', userId);
  await supabaseAdmin.auth.admin.deleteUser(userId);
  console.log('✅ Cleanup complete\n');
}

testRLSSetup().catch(console.error);

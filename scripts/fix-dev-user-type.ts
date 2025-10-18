#!/usr/bin/env ts-node
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fix() {
  console.log('Updating dev user to super_admin...');

  const { error } = await supabase
    .from('user_profiles')
    .update({ user_type: 'super_admin' })
    .eq('email', 'dev-user@limn.us.com');

  if (error) {
    console.error('❌ Error:', error.message);
  } else {
    console.log('✅ Updated dev-user@limn.us.com to super_admin');
  }

  // Verify
  const { data } = await supabase
    .from('user_profiles')
    .select('email, user_type')
    .eq('email', 'dev-user@limn.us.com')
    .single();

  console.log('Current value:', data);
}

fix();

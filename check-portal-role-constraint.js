#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkConstraint() {
  const { data, error } = await supabase.rpc('get_constraint_definition', {
    table_name: 'customer_portal_access',
    constraint_name: 'customer_portal_access_portal_role_check'
  }).catch(() => {
    // If function doesn't exist, query pg_constraint directly
    return supabase.from('pg_constraint').select('*').eq('conname', 'customer_portal_access_portal_role_check');
  });

  // Alternative: Just try with 'viewer' which is the default
  console.log('Trying with viewer role...');
}

checkConstraint();

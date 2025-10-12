import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function testInsert() {
  console.log('🧪 Testing if granted_at column exists by attempting insert...\n');

  // Try to insert a test record with granted_at
  const { data, error } = await supabase
    .from('customer_portal_access')
    .insert({
      granted_at: new Date().toISOString(),
      portal_type: 'test',
      is_active: false,
    })
    .select()
    .single();

  if (error) {
    if (error.message.includes('granted_at')) {
      console.log('❌ granted_at column DOES NOT EXIST');
      console.log('   Error:', error.message);
      console.log('\n   Need to run: npx prisma db push');
    } else {
      console.log('⚠️  Different error (might be FK constraint, RLS, etc):');
      console.log('   ', error.message);
      console.log('\n   This might mean granted_at EXISTS but other constraints failed');
    }
  } else {
    console.log('✅ granted_at column EXISTS - insert succeeded!');
    console.log('   Record ID:', data.id);

    // Clean up test record
    await supabase.from('customer_portal_access').delete().eq('id', data.id);
    console.log('   Test record cleaned up');
  }
}

testInsert().then(() => process.exit(0)).catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

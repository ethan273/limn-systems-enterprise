import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function cleanupTestUsers() {
  console.log('🧹 Cleaning up test users from Supabase...\n');

  const testEmails = [
    'dev-user@limn.us.com',
    'designer-user@limn.us.com',
    'customer-user@limn.us.com',
    'factory-user@limn.us.com',
    'contractor-user@limn.us.com',
    'regular-user@limn.us.com',
  ];

  for (const email of testEmails) {
    console.log(`🔍 Looking for user: ${email}`);

    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users?.users?.find(u => u.email === email);

    if (user) {
      console.log(`   Found user ID: ${user.id}`);

      await supabase.from('user_profiles').delete().eq('id', user.id);
      console.log(`   ✅ Deleted user_profiles entry`);

      await supabase.from('customer_portal_access').delete().eq('user_id', user.id);
      console.log(`   ✅ Deleted portal access records`);

      await supabase.auth.admin.deleteUser(user.id);
      console.log(`   ✅ Deleted auth user`);
    } else {
      console.log(`   ℹ️  User not found (already clean)`);
    }
    console.log('');
  }

  console.log('✅ Cleanup complete!\n');
}

cleanupTestUsers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Cleanup failed:', err);
    process.exit(1);
  });

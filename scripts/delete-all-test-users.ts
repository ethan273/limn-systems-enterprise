import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function deleteAllTestUsers() {
  console.log('🗑️  Deleting ALL test users...\n');

  // List all users
  const { data: allUsers } = await supabase.auth.admin.listUsers();
  
  let deleted = 0;
  
  for (const user of allUsers?.users || []) {
    // Delete user profile first
    await supabase.from('user_profiles').delete().eq('id', user.id);
    
    // Delete portal access
    await supabase.from('customer_portal_access').delete().eq('user_id', user.id);
    
    // Delete auth user
    await supabase.auth.admin.deleteUser(user.id);
    
    deleted++;
    if (deleted % 10 === 0) {
      console.log(`   Deleted ${deleted} users...`);
    }
  }

  console.log(`\n✅ Deleted ${deleted} total users\n`);
}

deleteAllTestUsers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Failed:', err);
    process.exit(1);
  });

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * Delete ONLY the 6 fixed test users used by Playwright session warmup
 * These are the ONLY users that should be deleted for a clean slate
 */
async function deleteFixedTestUsers() {
  console.log('🗑️  Deleting ONLY the 6 fixed test users for clean slate...\n');

  const fixedEmails = [
    'dev-user@limn.us.com',
    'designer-user@limn.us.com',
    'customer-user@limn.us.com',
    'factory-user@limn.us.com',
    'contractor-user@limn.us.com',
    'regular-user@limn.us.com',
  ];

  let deletedCount = 0;

  for (const email of fixedEmails) {
    console.log(`🔍 Looking for fixed user: ${email}`);

    // Search with pagination to find user
    let foundUser: any = null;
    let page = 1;
    const perPage = 50;

    while (page <= 20 && !foundUser) {
      const { data: users } = await supabase.auth.admin.listUsers({ page, perPage });

      foundUser = users?.users?.find((u: any) => u.email === email);

      if (!users?.users || users.users.length < perPage) {
        break; // End of results
      }

      page++;
    }

    if (foundUser) {
      console.log(`   Found user ID: ${foundUser.id}`);

      // Delete in order: portal access → profile → auth user
      try {
        await supabase.from('customer_portal_access').delete().eq('user_id', foundUser.id);
        console.log(`   ✅ Deleted portal access records`);
      } catch (e) {
        console.log(`   ℹ️  No portal access to delete`);
      }

      try {
        await supabase.from('user_profiles').delete().eq('id', foundUser.id);
        console.log(`   ✅ Deleted user_profiles entry`);
      } catch (e) {
        console.log(`   ℹ️  No user profile to delete`);
      }

      await supabase.auth.admin.deleteUser(foundUser.id);
      console.log(`   ✅ Deleted auth user`);

      deletedCount++;
    } else {
      console.log(`   ℹ️  User not found (already clean)`);
    }
    console.log('');
  }

  console.log(`✅ Cleanup complete! Deleted ${deletedCount}/6 fixed users\n`);
  console.log('💡 Next step: Run warmup script to recreate users with correct UUIDs');
  console.log('   npx ts-node scripts/warmup-test-sessions.ts\n');
}

deleteFixedTestUsers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Deletion failed:', err);
    process.exit(1);
  });

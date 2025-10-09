import { supabaseAdmin } from './tests/helpers/database-helper.js';

async function cleanup() {
  console.log('Cleaning up all test data...');

  // Delete test user_profiles (this cascades to other tables)
  const { error: userError, count: userCount } = await supabaseAdmin
    .from('user_profiles')
    .delete()
    .ilike('email', '%test-%@test.com');

  if (userError) {
    console.error('Error deleting user_profiles:', userError);
  } else {
    console.log(`Deleted ${userCount || 0} test user_profiles`);
  }

  // Delete test customers
  const { error: custError, count: custCount } = await supabaseAdmin
    .from('customers')
    .delete()
    .ilike('email', '%@test.com');

  if (custError) {
    console.error('Error deleting customers:', custError);
  } else {
    console.log(`Deleted ${custCount || 0} test customers`);
  }

  console.log('Cleanup complete!');
  process.exit(0);
}

cleanup().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});

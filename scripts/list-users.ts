import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function listUsers() {
  const data = await supabase.auth.admin.listUsers();
  
  if (data.error) {
    console.error('Error:', data.error);
    return;
  }

  console.log('Total users:', data.data?.users?.length || 0);
  console.log('');
  
  data.data?.users?.forEach((user: any, i: number) => {
    console.log(i + 1 + '. Email:', user.email);
    console.log('   ID:', user.id);
    console.log('   Created:', user.created_at);
    console.log('');
  });
}

listUsers().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});

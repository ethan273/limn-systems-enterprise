import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verify() {
  console.log('🔍 Checking customer_portal_access table schema...\n');

  const { data, error } = await supabase
    .from('customer_portal_access')
    .select('*')
    .limit(0);

  if (error) {
    console.error('❌ Error querying table:', error.message);
    return;
  }

  // Try to query columns from information_schema
  const { data: columns } = await supabase.rpc('exec_sql', {
    sql_query: `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'customer_portal_access'
      ORDER BY ordinal_position;
    `
  });

  if (columns) {
    console.log('📋 Columns in customer_portal_access:');
    console.table(columns);

    const hasGrantedAt = columns.some((col: any) => col.column_name === 'granted_at');
    if (hasGrantedAt) {
      console.log('\n✅ granted_at column EXISTS in database');
    } else {
      console.log('\n❌ granted_at column MISSING from database');
      console.log('   Run: npx prisma db push');
    }
  }
}

verify().catch(console.error);

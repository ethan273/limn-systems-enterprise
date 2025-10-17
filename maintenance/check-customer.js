const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCustomerAccess() {
  const { data } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const customerUser = data.users.find(u => u.email === 'test_customer@example.com');
  
  if (!customerUser) {
    console.log('❌ test_customer@example.com not found');
    return;
  }
  
  console.log('Found test_customer@example.com (ID:', customerUser.id + ')');
  
  const { data: access } = await supabase
    .from('customer_portal_access')
    .select('*')
    .eq('user_id', customerUser.id);
    
  console.log('\nPortal access records:', access?.length || 0);
  if (access && access.length > 0) {
    access.forEach(a => {
      console.log(' -', a.portal_type, '/', a.portal_role, '(active:', a.is_active + ')');
    });
  } else {
    console.log('❌ No portal access records found');
  }
}

checkCustomerAccess();

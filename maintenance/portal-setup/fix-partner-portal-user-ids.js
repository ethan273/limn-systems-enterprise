#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixPartnerPortalUserIds() {
  console.log('\n🔧 Updating partner records with portal_user_id...');
  
  try {
    // Get users
    const { data: users } = await supabase.auth.admin.listUsers();
    const designerUser = users.users.find(u => u.email === 'test_designer@limnsystems.com');
    const factoryUser = users.users.find(u => u.email === 'test_factory@limnsystems.com');

    // Update designer partner
    const { error: designerError } = await supabase
      .from('partners')
      .update({ portal_user_id: designerUser.id })
      .eq('company_name', 'Test Designer Studio');

    if (designerError) throw designerError;
    console.log('✅ Designer partner updated');

    // Update factory partner
    const { error: factoryError } = await supabase
      .from('partners')
      .update({ portal_user_id: factoryUser.id })
      .eq('company_name', 'Test Manufacturing Co');

    if (factoryError) throw factoryError;
    console.log('✅ Factory partner updated');

    console.log('\n✅ Done!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixPartnerPortalUserIds();

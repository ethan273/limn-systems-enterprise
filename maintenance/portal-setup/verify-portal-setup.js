#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifySetup() {
  console.log('\n🔍 Verifying Portal Setup...\n');

  // Get users
  const { data: users } = await supabase.auth.admin.listUsers();
  const designerUser = users.users.find(u => u.email === 'test_designer@limnsystems.com');
  const factoryUser = users.users.find(u => u.email === 'test_factory@limnsystems.com');

  console.log('👤 Users:');
  console.log(`   Designer: ${designerUser?.id}`);
  console.log(`   Factory: ${factoryUser?.id}\n`);

  // Check partner records
  const { data: designerPartner } = await supabase
    .from('partners')
    .select('*')
    .eq('portal_user_id', designerUser.id)
    .single();

  const { data: factoryPartner } = await supabase
    .from('partners')
    .select('*')
    .eq('portal_user_id', factoryUser.id)
    .single();

  console.log('🏢 Partner Records:');
  console.log(`   Designer Partner: ${designerPartner ? designerPartner.id : 'NOT FOUND'}`);
  console.log(`     - Type: ${designerPartner?.type}`);
  console.log(`     - Company: ${designerPartner?.company_name}`);
  console.log(`     - Portal Enabled: ${designerPartner?.portal_enabled}\n`);

  console.log(`   Factory Partner: ${factoryPartner ? factoryPartner.id : 'NOT FOUND'}`);
  console.log(`     - Type: ${factoryPartner?.type}`);
  console.log(`     - Company: ${factoryPartner?.company_name}`);
  console.log(`     - Portal Enabled: ${factoryPartner?.portal_enabled}\n`);

  // Check portal access
  const { data: designerAccess } = await supabase
    .from('customer_portal_access')
    .select('*')
    .eq('user_id', designerUser.id)
    .single();

  const { data: factoryAccess } = await supabase
    .from('customer_portal_access')
    .select('*')
    .eq('user_id', factoryUser.id)
    .single();

  console.log('🔑 Portal Access:');
  console.log(`   Designer Access: ${designerAccess ? 'FOUND' : 'NOT FOUND'}`);
  if (designerAccess) {
    console.log(`     - Portal Type: ${designerAccess.portal_type}`);
    console.log(`     - Entity Type: ${designerAccess.entity_type}`);
    console.log(`     - Entity ID: ${designerAccess.entity_id}`);
    console.log(`     - Portal Role: ${designerAccess.portal_role}`);
    console.log(`     - Is Active: ${designerAccess.is_active}\n`);
  }

  console.log(`   Factory Access: ${factoryAccess ? 'FOUND' : 'NOT FOUND'}`);
  if (factoryAccess) {
    console.log(`     - Portal Type: ${factoryAccess.portal_type}`);
    console.log(`     - Entity Type: ${factoryAccess.entity_type}`);
    console.log(`     - Entity ID: ${factoryAccess.entity_id}`);
    console.log(`     - Portal Role: ${factoryAccess.portal_role}`);
    console.log(`     - Is Active: ${factoryAccess.is_active}\n`);
  }

  // Check if entity_id matches partner id
  console.log('✅ Validation:');
  if (designerAccess && designerPartner) {
    const match = designerAccess.entity_id === designerPartner.id;
    console.log(`   Designer: entity_id matches partner id: ${match ? '✓' : '✗'}`);
    if (!match) {
      console.log(`     Expected: ${designerPartner.id}`);
      console.log(`     Got: ${designerAccess.entity_id}`);
    }
  }

  if (factoryAccess && factoryPartner) {
    const match = factoryAccess.entity_id === factoryPartner.id;
    console.log(`   Factory: entity_id matches partner id: ${match ? '✓' : '✗'}`);
    if (!match) {
      console.log(`     Expected: ${factoryPartner.id}`);
      console.log(`     Got: ${factoryAccess.entity_id}`);
    }
  }
}

verifySetup().catch(console.error);

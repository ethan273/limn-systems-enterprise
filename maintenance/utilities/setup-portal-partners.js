#!/usr/bin/env node

/**
 * Setup Partner Records and Portal Access for Designer/Factory Test Users
 * This script creates proper partner records and links them to portal users
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env.local');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupPortalPartners() {
  console.log('\n🔧 Setting up Partner Records and Portal Access');
  console.log('=' .repeat(60));

  try {
    // Get test users
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

    if (usersError) throw usersError;

    const designerUser = users.users.find(u => u.email === 'test_designer@limnsystems.com');
    const factoryUser = users.users.find(u => u.email === 'test_factory@limnsystems.com');

    if (!designerUser || !factoryUser) {
      console.error('❌ Test users not found. Run create-portal-test-users.js first.');
      process.exit(1);
    }

    console.log(`\n✅ Found designer user: ${designerUser.id}`);
    console.log(`✅ Found factory user: ${factoryUser.id}`);

    // Create/update designer partner record
    console.log('\n📝 Creating Designer Partner Record...');

    const { data: existingDesigner } = await supabaseAdmin
      .from('partners')
      .select('*')
      .eq('portal_user_id', designerUser.id)
      .single();

    let designerPartner;

    if (existingDesigner) {
      console.log(`   ℹ️  Designer partner already exists (ID: ${existingDesigner.id})`);
      designerPartner = existingDesigner;
    } else {
      const { data: newDesigner, error: designerError } = await supabaseAdmin
        .from('partners')
        .insert({
          type: 'designer',
          company_name: 'Test Designer Studio',
          primary_contact: 'Test Designer',
          primary_email: 'test_designer@limnsystems.com',
          primary_phone: '+1-555-0001',
          address_line1: '123 Design Street',
          city: 'Los Angeles',
          state: 'CA',
          postal_code: '90001',
          country: 'USA',
          specializations: ['custom_furniture', 'interior_design'],
          capabilities: ['3d_modeling', 'technical_drawings'],
          certifications: ['asid'],
          languages: ['English'],
          currency: 'USD',
          status: 'active',
          portal_enabled: true,
          portal_user_id: designerUser.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (designerError) throw designerError;

      designerPartner = newDesigner;
      console.log(`   ✅ Designer partner created (ID: ${designerPartner.id})`);
    }

    // Create/update factory partner record
    console.log('\n📝 Creating Factory Partner Record...');

    const { data: existingFactory } = await supabaseAdmin
      .from('partners')
      .select('*')
      .eq('portal_user_id', factoryUser.id)
      .single();

    let factoryPartner;

    if (existingFactory) {
      console.log(`   ℹ️  Factory partner already exists (ID: ${existingFactory.id})`);
      factoryPartner = existingFactory;
    } else {
      const { data: newFactory, error: factoryError } = await supabaseAdmin
        .from('partners')
        .insert({
          type: 'factory',
          company_name: 'Test Manufacturing Co',
          primary_contact: 'Test Factory Manager',
          primary_email: 'test_factory@limnsystems.com',
          primary_phone: '+1-555-0002',
          address_line1: '456 Industrial Blvd',
          city: 'Guangzhou',
          state: 'Guangdong',
          postal_code: '510000',
          country: 'China',
          specializations: ['wood_furniture', 'metal_fabrication'],
          capabilities: ['cnc_machining', 'powder_coating', 'assembly'],
          certifications: ['iso_9001', 'fsc'],
          languages: ['English', 'Chinese'],
          production_capacity: 1000,
          lead_time_days: 45,
          minimum_order: 10,
          payment_terms: '30% deposit, 70% before shipment',
          currency: 'USD',
          status: 'active',
          portal_enabled: true,
          portal_user_id: factoryUser.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (factoryError) throw factoryError;

      factoryPartner = newFactory;
      console.log(`   ✅ Factory partner created (ID: ${factoryPartner.id})`);
    }

    // Create/update portal access entries
    console.log('\n📋 Setting up Portal Access...');

    // Designer portal access
    const { data: existingDesignerAccess } = await supabaseAdmin
      .from('customer_portal_access')
      .select('*')
      .eq('user_id', designerUser.id)
      .single();

    if (existingDesignerAccess) {
      console.log(`   ℹ️  Updating designer portal access...`);
      const { error: updateError } = await supabaseAdmin
        .from('customer_portal_access')
        .update({
          portal_type: 'designer',
          entity_type: 'partner',
          entity_id: designerPartner.id,
          portal_role: 'viewer',
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingDesignerAccess.id);

      if (updateError) throw updateError;
      console.log(`   ✅ Designer portal access updated`);
    } else {
      const { error: insertError } = await supabaseAdmin
        .from('customer_portal_access')
        .insert({
          user_id: designerUser.id,
          portal_type: 'designer',
          entity_type: 'partner',
          entity_id: designerPartner.id,
          portal_role: 'viewer',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) throw insertError;
      console.log(`   ✅ Designer portal access created`);
    }

    // Factory portal access
    const { data: existingFactoryAccess } = await supabaseAdmin
      .from('customer_portal_access')
      .select('*')
      .eq('user_id', factoryUser.id)
      .single();

    if (existingFactoryAccess) {
      console.log(`   ℹ️  Updating factory portal access...`);
      const { error: updateError } = await supabaseAdmin
        .from('customer_portal_access')
        .update({
          portal_type: 'factory',
          entity_type: 'partner',
          entity_id: factoryPartner.id,
          portal_role: 'viewer',
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingFactoryAccess.id);

      if (updateError) throw updateError;
      console.log(`   ✅ Factory portal access updated`);
    } else {
      const { error: insertError } = await supabaseAdmin
        .from('customer_portal_access')
        .insert({
          user_id: factoryUser.id,
          portal_type: 'factory',
          entity_type: 'partner',
          entity_id: factoryPartner.id,
          portal_role: 'viewer',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) throw insertError;
      console.log(`   ✅ Factory portal access created`);
    }

    console.log('\n' + '=' .repeat(60));
    console.log('✅ Portal Partner Setup Complete!\n');
    console.log('📊 Summary:');
    console.log(`   Designer Partner ID: ${designerPartner.id}`);
    console.log(`   Factory Partner ID: ${factoryPartner.id}`);
    console.log(`   Portal Access: Configured for both portals`);
    console.log('\n🧪 Ready to run portal tests:');
    console.log('   npx playwright test tests/16-designer-portal.spec.ts');
    console.log('   npx playwright test tests/17-factory-portal.spec.ts\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.details) console.error('Details:', error.details);
    if (error.hint) console.error('Hint:', error.hint);
    process.exit(1);
  }
}

setupPortalPartners();

#!/usr/bin/env node

/**
 * Create Portal Test Users in Supabase
 * This script creates test users for customer, designer, and factory portals
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
  console.error('   Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create admin client with service role for user creation
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const PORTAL_USERS = [
  {
    email: 'test_customer@example.com',
    password: 'TestPassword123!',
    role: 'Customer Portal',
    user_type: 'customer',
    metadata: {
      name: 'Test Customer',
      company: 'Test Customer Company'
    }
  },
  {
    email: 'test_designer@limnsystems.com',
    password: 'TestPassword123!',
    role: 'Designer Portal',
    user_type: 'designer',
    metadata: {
      name: 'Test Designer',
      company: 'Limn Systems'
    }
  },
  {
    email: 'test_factory@limnsystems.com',
    password: 'TestPassword123!',
    role: 'Factory Portal',
    user_type: 'factory',
    metadata: {
      name: 'Test Factory User',
      company: 'Limn Systems'
    }
  }
];

async function createPortalUsers() {
  console.log('\n🔧 Creating Portal Test Users in Supabase');
  console.log('=' .repeat(60));

  const createdUsers = [];

  for (const user of PORTAL_USERS) {
    console.log(`\n📝 Creating ${user.role} (${user.email})...`);

    try {
      // Check if user already exists
      const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();

      if (listError) {
        console.log(`⚠️  Could not check existing users: ${listError.message}`);
      }

      const existingUser = existingUsers?.users?.find(u => u.email === user.email);

      let authUser;

      if (existingUser) {
        console.log(`   ℹ️  User already exists (ID: ${existingUser.id})`);
        authUser = existingUser;

        // Update password in case it changed
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          existingUser.id,
          { password: user.password }
        );

        if (updateError) {
          console.log(`   ⚠️  Could not update password: ${updateError.message}`);
        } else {
          console.log(`   ✅ Password updated`);
        }
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: user.metadata
        });

        if (createError) {
          console.log(`   ❌ Failed to create user: ${createError.message}`);
          continue;
        }

        authUser = newUser.user;
        console.log(`   ✅ User created (ID: ${authUser.id})`);
      }

      // Now add to customer_portal_access table if it's a customer
      if (user.user_type === 'customer') {
        console.log(`   📋 Adding to customer_portal_access table...`);

        // Check if entry already exists
        const { data: existingAccess, error: checkError } = await supabaseAdmin
          .from('customer_portal_access')
          .select('id')
          .eq('user_id', authUser.id)
          .single();

        if (existingAccess) {
          console.log(`   ℹ️  Portal access already configured`);
        } else {
          // Create entry
          const { error: accessError } = await supabaseAdmin
            .from('customer_portal_access')
            .insert({
              user_id: authUser.id,
              email: user.email,
              company_name: user.metadata.company,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (accessError) {
            console.log(`   ⚠️  Could not add portal access: ${accessError.message}`);
            console.log(`      (This is OK if table doesn't exist yet)`);
          } else {
            console.log(`   ✅ Portal access configured`);
          }
        }
      }

      createdUsers.push({
        ...user,
        id: authUser.id,
        created: !existingUser
      });

      console.log(`   ✅ ${user.role} setup complete`);

    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`);
    }
  }

  console.log('\n' + '=' .repeat(60));
  console.log('📊 Summary:');
  console.log('=' .repeat(60));

  for (const user of createdUsers) {
    console.log(`${user.created ? '🆕' : '♻️ '} ${user.role}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: ${user.password}`);
    console.log(`   Type: ${user.user_type}`);
    console.log(`   Status: ${user.created ? 'Created' : 'Already existed'}`);
    console.log('');
  }

  console.log('=' .repeat(60));
  console.log('✅ Portal user setup complete!\n');

  // Verify by attempting to sign in
  console.log('🔐 Verifying portal users can authenticate...\n');

  const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  let allValid = true;

  for (const user of createdUsers) {
    try {
      const { data, error } = await supabaseAnon.auth.signInWithPassword({
        email: user.email,
        password: user.password
      });

      if (error) {
        console.log(`❌ ${user.role}: Authentication failed - ${error.message}`);
        allValid = false;
      } else {
        console.log(`✅ ${user.role}: Authentication successful`);
        await supabaseAnon.auth.signOut();
      }
    } catch (err) {
      console.log(`❌ ${user.role}: ${err.message}`);
      allValid = false;
    }
  }

  console.log('');
  console.log('=' .repeat(60));

  if (allValid) {
    console.log('✅ All portal users verified successfully!\n');
    console.log('📝 Next steps:');
    console.log('   1. Update tests/helpers/portal-auth-helper.ts with these credentials');
    console.log('   2. Run portal tests:');
    console.log('      npx playwright test tests/15-customer-portal.spec.ts');
    console.log('      npx playwright test tests/16-designer-portal.spec.ts');
    console.log('      npx playwright test tests/17-factory-portal.spec.ts\n');
  } else {
    console.log('⚠️  Some users could not authenticate.');
    console.log('   Check Supabase dashboard to verify users were created:\n');
    console.log(`   ${supabaseUrl}/project/auth/users\n`);
  }

  console.log('🔑 Credentials have been created:');
  console.log('   All passwords: TestPassword123!\n');
}

createPortalUsers().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});

/**
 * Fix Production Database Constraints
 *
 * Applies all necessary constraint fixes to the PRODUCTION database:
 * 1. user_roles constraint - allow all role types
 * 2. sso_login_audit constraint - allow all login types
 *
 * USAGE:
 * PROD_DB_PASSWORD="your-password" npx tsx scripts/fix-production-database.ts
 */

import { Pool } from 'pg';

const PROD_DB_URL = process.env.PROD_DB_URL ||
  `postgresql://postgres:${process.env.PROD_DB_PASSWORD}@db.hwaxogapihsqleyzpqtj.supabase.co:5432/postgres`;

async function fixProductionDatabase() {
  console.log('🔧 Fixing Production Database Constraints\n');

  if (!process.env.PROD_DB_PASSWORD && !process.env.PROD_DB_URL) {
    console.error('❌ ERROR: PROD_DB_PASSWORD or PROD_DB_URL environment variable required');
    console.error('');
    console.error('Usage:');
    console.error('  PROD_DB_PASSWORD="your-password" npx tsx scripts/fix-production-database.ts');
    console.error('');
    console.error('Get password from:');
    console.error('  https://supabase.com/dashboard/project/hwaxogapihsqleyzpqtj/settings/database');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: PROD_DB_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to production database\n');

    // Fix 1: user_roles constraint
    console.log('Fix 1: Updating user_roles role constraint...');
    await client.query(`
      ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
    `);
    await client.query(`
      ALTER TABLE user_roles
      ADD CONSTRAINT user_roles_role_check
      CHECK (role IN (
        'admin',
        'super_admin',
        'manager',
        'team_lead',
        'developer',
        'designer',
        'analyst',
        'viewer',
        'user'
      ));
    `);
    console.log('✅ user_roles constraint updated\n');

    // Fix 2: sso_login_audit constraint
    console.log('Fix 2: Updating sso_login_audit login_type constraint...');
    await client.query(`
      ALTER TABLE sso_login_audit DROP CONSTRAINT IF EXISTS sso_login_audit_login_type_check;
    `);
    await client.query(`
      ALTER TABLE sso_login_audit
      ADD CONSTRAINT sso_login_audit_login_type_check
      CHECK (login_type IN (
        'saml',
        'oauth',
        'password',
        'magic_link',
        'google_oauth',
        'google_oauth_employee',
        'google_oauth_customer'
      ));
    `);
    console.log('✅ sso_login_audit constraint updated\n');

    // Verify constraints
    console.log('Verifying constraints...');
    const { rows } = await client.query(`
      SELECT
        conname as constraint_name,
        conrelid::regclass as table_name,
        pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid IN ('public.user_roles'::regclass, 'public.sso_login_audit'::regclass)
        AND contype = 'c'
      ORDER BY conrelid::regclass::text, conname;
    `);

    console.log('\nCurrent Constraints:');
    rows.forEach((row) => {
      console.log(`  ${row.table_name}.${row.constraint_name}`);
      console.log(`    ${row.definition}`);
      console.log('');
    });

    client.release();
    await pool.end();

    console.log('✅ Production database fixes applied successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Update Vercel DATABASE_URL to point to this production database');
    console.log('2. Redeploy application');
    console.log('3. Test auth callback and role assignment');

  } catch (error) {
    console.error('❌ Error fixing production database:', error);
    await pool.end();
    process.exit(1);
  }
}

fixProductionDatabase();

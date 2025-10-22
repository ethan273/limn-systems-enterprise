/**
 * Verify partner_contacts.user_id foreign key constraint
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// Load environment variables
const prodCredsPath = path.join(__dirname, '../production-credentials.env');
if (fs.existsSync(prodCredsPath)) {
  const prodCreds = fs.readFileSync(prodCredsPath, 'utf-8');
  prodCreds.split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=["']?([^"'\n]+)["']?$/);
    if (match) {
      process.env[match[1]] = match[2];
    }
  });
}

async function verify() {
  const devUrl = process.env.DEV_DB_URL || process.env.DATABASE_URL;

  const pool = new Pool({
    connectionString: devUrl,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();

  try {
    // Check if user_id column exists
    const columnQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'partner_contacts'
      AND column_name = 'user_id';
    `;

    const columnResult = await client.query(columnQuery);
    console.log('\n📋 Column Check:');
    console.log(columnResult.rows);

    // Check for FK constraint
    const fkQuery = `
      SELECT
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          rc.delete_rule,
          rc.update_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      JOIN information_schema.referential_constraints AS rc
          ON rc.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = 'partner_contacts'
      AND kcu.column_name = 'user_id';
    `;

    const fkResult = await client.query(fkQuery);
    console.log('\n🔗 Foreign Key Check:');
    if (fkResult.rows.length === 0) {
      console.log('❌ NO FOREIGN KEY CONSTRAINT FOUND');
    } else {
      console.log(fkResult.rows);
    }

    // Check auth.users table exists
    const authUsersQuery = `
      SELECT table_schema, table_name
      FROM information_schema.tables
      WHERE table_name = 'users'
      AND table_schema = 'auth';
    `;

    const authUsersResult = await client.query(authUsersQuery);
    console.log('\n👤 auth.users Table Check:');
    if (authUsersResult.rows.length === 0) {
      console.log('❌ auth.users TABLE DOES NOT EXIST');
    } else {
      console.log('✅ auth.users table exists');
    }
  } finally {
    client.release();
    await pool.end();
  }
}

verify().catch(console.error);

/**
 * Debug FK constraint issue
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

async function debug() {
  const devUrl = process.env.DEV_DB_URL || process.env.DATABASE_URL;

  const pool = new Pool({
    connectionString: devUrl,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();

  try {
    console.log('\n🔍 Attempting to add FK constraint...\n');

    const sql = `
      ALTER TABLE public.partner_contacts
        ADD CONSTRAINT fk_partner_contacts_user
          FOREIGN KEY (user_id)
          REFERENCES auth.users(id)
          ON DELETE SET NULL;
    `;

    try {
      await client.query(sql);
      console.log('✅ FK constraint created successfully');
    } catch (error: any) {
      console.log('❌ Error creating FK:');
      console.log('Message:', error.message);
      console.log('Code:', error.code);
      console.log('Detail:', error.detail);
      console.log('Hint:', error.hint);
    }

    // Check if constraint exists
    const checkQuery = `
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
      AND table_name = 'partner_contacts'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name = 'fk_partner_contacts_user';
    `;

    const result = await client.query(checkQuery);
    console.log('\n🔍 Constraint check:');
    if (result.rows.length > 0) {
      console.log('✅ Constraint exists:', result.rows[0]);
    } else {
      console.log('❌ Constraint does NOT exist');
    }

    // List ALL constraints on partner_contacts
    const allConstraintsQuery = `
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
      AND table_name = 'partner_contacts';
    `;

    const allResult = await client.query(allConstraintsQuery);
    console.log('\n📋 All constraints on partner_contacts:');
    console.log(allResult.rows);
  } finally {
    client.release();
    await pool.end();
  }
}

debug().catch(console.error);

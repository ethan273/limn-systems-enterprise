/**
 * Fix missing partner_contacts.user_id foreign key constraint
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

async function applyFKConstraint(dbName: string, connectionUrl: string) {
  console.log(`\n🔧 Applying FK constraint to ${dbName}...`);

  const pool = new Pool({
    connectionString: connectionUrl,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();

  try {
    // Add foreign key constraint
    const sql = `
      ALTER TABLE public.partner_contacts
        ADD CONSTRAINT fk_partner_contacts_user
          FOREIGN KEY (user_id)
          REFERENCES auth.users(id)
          ON DELETE SET NULL;
    `;

    await client.query(sql);
    console.log('✅ Foreign key constraint created successfully');

    // Verify it was created
    const verifyQuery = `
      SELECT
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          rc.delete_rule
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

    const result = await client.query(verifyQuery);
    if (result.rows.length > 0) {
      console.log('✅ Verification passed:', result.rows[0]);
    } else {
      console.log('❌ Verification failed: FK not found');
    }
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log('⏭️  FK constraint already exists');
    } else {
      console.error('❌ Error:', error.message);
      throw error;
    }
  } finally {
    client.release();
    await pool.end();
  }
}

async function main() {
  const devUrl = process.env.DEV_DB_URL || process.env.DATABASE_URL;
  const prodUrl = process.env.PROD_DB_URL;

  if (!devUrl || !prodUrl) {
    throw new Error('Missing database URLs');
  }

  console.log('🚀 FIXING MISSING FK CONSTRAINT\n');

  // Apply to dev
  await applyFKConstraint('DEV', devUrl);

  // Apply to prod
  await applyFKConstraint('PROD', prodUrl);

  console.log('\n✅ FK CONSTRAINT FIX COMPLETE\n');
}

main().catch((error) => {
  console.error('\n❌ Fix failed:', error.message);
  process.exit(1);
});

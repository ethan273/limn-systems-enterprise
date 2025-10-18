/**
 * Migration: Add specifications column to items table
 *
 * This script adds a JSONB specifications column to the items table,
 * aligning it with concepts, order_items, and prototypes tables.
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function runMigration() {
  console.log('Adding specifications column to items table...');

  try {
    const { Client } = require('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await client.connect();
    console.log('Connected to database');

    await client.query(`
      ALTER TABLE public.items
      ADD COLUMN IF NOT EXISTS specifications JSONB;
    `);

    await client.query(`
      COMMENT ON COLUMN public.items.specifications IS 'Product specifications stored as JSON (materials, finishes, construction details, etc.)';
    `);

    await client.end();
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();

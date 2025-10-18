import { readFileSync } from 'fs';
import { join } from 'path';
import pg from 'pg';
import { config } from 'dotenv';

// Load environment variables
config();

const { Pool } = pg;

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable not set');
  process.exit(1);
}

async function runMigration() {
  console.log('Running time_entries table migration...\n');

  const pool = new Pool({
    connectionString: databaseUrl,
  });

  try {
    const migrationSQL = readFileSync(
      join(process.cwd(), 'prisma/migrations/20251018_create_time_entries_table.sql'),
      'utf-8'
    );

    console.log('Executing migration SQL...');

    // Execute the entire migration as a transaction
    await pool.query(migrationSQL);

    console.log('✅ Migration completed successfully!');
    console.log('\nVerifying table creation...');

    // Verify the table exists
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'time_entries'
      )
    `);

    const tableExists = result.rows[0]?.exists || false;

    if (tableExists) {
      console.log('✅ time_entries table verified');

      // Get row count
      const countResult = await pool.query('SELECT COUNT(*) FROM time_entries');
      console.log('Initial row count:', countResult.rows[0]?.count || 0);

      // Show table structure
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'time_entries'
        ORDER BY ordinal_position
      `);

      console.log('\nTable columns:');
      columnsResult.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
    } else {
      console.log('❌ Table verification failed');
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigration().catch(console.error);

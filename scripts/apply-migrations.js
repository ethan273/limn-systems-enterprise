#!/usr/bin/env node

/**
 * Database Migration Script
 * Applies pending schema migrations to dev or prod database
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

// Migration files to apply
const MIGRATIONS = [
  'prisma/migrations/add_project_id_to_orders.sql',
  'prisma/migrations/create_pending_sign_up_table.sql',
];

async function loadEnv(environment) {
  const envFile = environment === 'prod' ? '.env' : '.env.local';
  const envPath = path.join(__dirname, '..', envFile);

  if (!fs.existsSync(envPath)) {
    throw new Error(`Environment file not found: ${envFile}`);
  }

  // Read and parse env file
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};

  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        let value = valueParts.join('=').trim();
        // Remove quotes if present
        value = value.replace(/^["']|["']$/g, '');
        envVars[key] = value;
      }
    }
  });

  return envVars;
}

async function applyMigration(dbUrl, migrationFile) {
  const fullPath = path.join(__dirname, '..', migrationFile);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Migration file not found: ${migrationFile}`);
  }

  console.log(`  Applying: ${path.basename(migrationFile)}`);

  try {
    const { stdout, stderr } = await execAsync(
      `psql "${dbUrl}" -f "${fullPath}"`,
      { maxBuffer: 10 * 1024 * 1024 }
    );

    if (stderr && !stderr.includes('NOTICE') && !stderr.includes('CREATE')) {
      console.log(`  ⚠️  Warnings: ${stderr}`);
    }

    if (stdout) {
      console.log(`  ✓ Success`);
    }

    return { success: true, stdout, stderr };
  } catch (error) {
    // Check if error is because objects already exist
    if (error.stderr && (
      error.stderr.includes('already exists') ||
      error.stderr.includes('IF NOT EXISTS')
    )) {
      console.log(`  ✓ Already applied (skipped)`);
      return { success: true, alreadyApplied: true };
    }
    throw error;
  }
}

async function verifyMigrations(dbUrl) {
  console.log('\n📋 Verifying migrations...');

  try {
    // Check if project_id column exists
    const { stdout: ordersTable } = await execAsync(
      `psql "${dbUrl}" -c "\\d orders" -t`
    );

    if (ordersTable.includes('project_id')) {
      console.log('  ✓ orders.project_id column exists');
    } else {
      console.log('  ✗ orders.project_id column NOT found');
      return false;
    }

    // Check if pending_sign_up table exists
    const { stdout: pendingTable } = await execAsync(
      `psql "${dbUrl}" -c "\\d auth.pending_sign_up" -t`
    );

    if (pendingTable.includes('verification_token')) {
      console.log('  ✓ auth.pending_sign_up table exists');
    } else {
      console.log('  ✗ auth.pending_sign_up table NOT found');
      return false;
    }

    return true;
  } catch (error) {
    console.error('  ✗ Verification failed:', error.message);
    return false;
  }
}

async function main() {
  const environment = process.argv[2] || 'dev';

  if (!['dev', 'prod'].includes(environment)) {
    console.error('❌ Invalid environment. Use: dev or prod');
    console.log('\nUsage: node scripts/apply-migrations.js [dev|prod]');
    process.exit(1);
  }

  console.log('🚀 Database Migration Tool');
  console.log('==========================');
  console.log(`Environment: ${environment.toUpperCase()}`);
  console.log(`Migrations to apply: ${MIGRATIONS.length}`);
  console.log('');

  try {
    // Load environment variables
    console.log('📂 Loading environment...');
    const envVars = await loadEnv(environment);
    let dbUrl = envVars.DATABASE_URL;

    if (!dbUrl) {
      throw new Error('DATABASE_URL not found in environment file');
    }

    // Strip out query parameters that psql doesn't support
    // Keep only the base URL before the '?' character
    if (dbUrl.includes('?')) {
      const urlParts = dbUrl.split('?');
      dbUrl = urlParts[0];
      console.log('  Removed query parameters for psql compatibility');
    }

    // Mask the password in the URL for display
    const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
    console.log(`  Database: ${maskedUrl}`);
    console.log('');

    // Test connection
    console.log('🔌 Testing database connection...');
    try {
      await execAsync(`psql "${dbUrl}" -c "SELECT version();" -t`);
      console.log('  ✓ Connection successful');
      console.log('');
    } catch (error) {
      throw new Error(`Cannot connect to database: ${error.message}`);
    }

    // Apply migrations
    console.log('📝 Applying migrations...');
    let successCount = 0;
    let skipCount = 0;

    for (const migration of MIGRATIONS) {
      const result = await applyMigration(dbUrl, migration);
      if (result.success) {
        if (result.alreadyApplied) {
          skipCount++;
        } else {
          successCount++;
        }
      }
    }

    console.log('');
    console.log(`✅ Migration complete!`);
    console.log(`   Applied: ${successCount}`);
    console.log(`   Skipped: ${skipCount}`);

    // Verify migrations
    const verified = await verifyMigrations(dbUrl);

    if (verified) {
      console.log('\n✅ All migrations verified successfully!');
      console.log('');
      console.log('Next steps:');
      console.log('  1. Test the project-order relationship queries');
      console.log('  2. Verify all endpoints work correctly');
      console.log('  3. Deploy the updated code');
    } else {
      console.log('\n⚠️  Some migrations could not be verified');
      console.log('   Please check manually');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.stderr) {
      console.error('\nDetails:', error.stderr);
    }
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

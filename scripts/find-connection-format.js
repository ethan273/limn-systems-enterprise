#!/usr/bin/env node

const { execSync } = require('child_process');
const pg = require('pg');

// Test different possible Supabase connection formats
const password = 'MvVZHHUK4V56Kz3F';
const projectRef = 'kufakdnlhhcwynkfchbb';

const urlFormats = [
  // Format 1: Classic Supabase
  `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`,
  
  // Format 2: AWS Pooler (common for newer projects)
  `postgresql://postgres.${projectRef}:${password}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${projectRef}:${password}@aws-0-us-west-1.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${projectRef}:${password}@aws-0-us-west-2.pooler.supabase.com:5432/postgres`,
  
  // Format 3: Alternative pooler format
  `postgresql://postgres:${password}@${projectRef}.pooler.supabase.com:5432/postgres`,
  
  // Format 4: Direct with project ID in username
  `postgres://postgres.${projectRef}:${password}@db.pooler.supabase.com:5432/postgres`
];

async function testUrl(url) {
  const client = new pg.Client({ connectionString: url });
  
  try {
    await client.connect();
    const result = await client.query('SELECT current_database()');
    await client.end();
    return { success: true, database: result.rows[0].current_database };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function findWorkingConnection() {
  console.log('🔍 Testing different Supabase connection formats...\n');
  
  for (const url of urlFormats) {
    const urlDisplay = url.replace(password, '***');
    console.log(`Testing: ${urlDisplay}`);
    
    const result = await testUrl(url);
    
    if (result.success) {
      console.log(`✅ SUCCESS! Connected to database: ${result.database}\n`);
      console.log('Working connection string:');
      console.log(url);
      console.log('\n📝 Update your .env file with:');
      console.log(`DIRECT_URL=${url}`);
      console.log(`DATABASE_URL=${url.replace(':5432', ':6543')}?pgbouncer=true`);
      return url;
    } else {
      console.log(`❌ Failed: ${result.error.split('\n')[0]}\n`);
    }
  }
  
  console.log('😕 None of the standard formats worked.');
  console.log('Please check the Supabase dashboard for the exact connection string.');
}

findWorkingConnection().catch(console.error);

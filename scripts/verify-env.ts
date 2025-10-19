#!/usr/bin/env ts-node

/**
 * Environment Variables Verification Script
 *
 * Run this script to verify all required environment variables are set.
 *
 * Usage:
 *   npm run verify-env
 *   or
 *   npx ts-node scripts/verify-env.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

interface EnvVar {
  name: string;
  description: string;
  required: boolean;
  secret: boolean;
}

const REQUIRED_ENV_VARS: EnvVar[] = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    description: 'Supabase project URL',
    required: true,
    secret: false,
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    description: 'Supabase anonymous/public API key',
    required: true,
    secret: false,
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    description: 'Supabase service role key (admin access)',
    required: true,
    secret: true,
  },
  {
    name: 'DATABASE_URL',
    description: 'PostgreSQL connection string (optional - for Prisma)',
    required: false,
    secret: true,
  },
];

function checkEnvVar(envVar: EnvVar): { valid: boolean; value: string | null } {
  const value = process.env[envVar.name];

  if (!value) {
    return { valid: false, value: null };
  }

  // Basic validation
  if (envVar.name.includes('URL')) {
    try {
      new URL(value);
    } catch {
      console.warn(`⚠️  ${envVar.name} appears to be invalid URL format`);
    }
  }

  return { valid: true, value };
}

function maskSecret(value: string): string {
  if (value.length <= 8) {
    return '****';
  }
  return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
}

function main() {
  console.log('🔍 Verifying environment variables...\n');

  const results: Array<{ envVar: EnvVar; result: ReturnType<typeof checkEnvVar> }> = [];
  let hasErrors = false;
  let hasWarnings = false;

  // Check each environment variable
  for (const envVar of REQUIRED_ENV_VARS) {
    const result = checkEnvVar(envVar);
    results.push({ envVar, result });

    if (envVar.required && !result.valid) {
      hasErrors = true;
    } else if (!result.valid) {
      hasWarnings = true;
    }
  }

  // Print results
  console.log('Environment Variables Status:');
  console.log('━'.repeat(80));

  for (const { envVar, result } of results) {
    const status = result.valid ? '✅' : envVar.required ? '❌' : '⚠️ ';
    const valueDisplay = result.valid
      ? (envVar.secret ? maskSecret(result.value!) : result.value)
      : 'NOT SET';

    console.log(`${status} ${envVar.name}`);
    console.log(`   Description: ${envVar.description}`);
    console.log(`   Value: ${valueDisplay}`);
    console.log(`   Required: ${envVar.required ? 'Yes' : 'No (optional)'}`);
    console.log('');
  }

  console.log('━'.repeat(80));

  // Summary
  if (hasErrors) {
    console.log('\n❌ VALIDATION FAILED');
    console.log('\nMissing required environment variables detected!');
    console.log('\n📚 Setup Instructions:\n');
    console.log('For local development:');
    console.log('1. Copy .env.example to .env.local');
    console.log('2. Fill in your Supabase credentials');
    console.log('3. Restart your development server');
    console.log('');
    console.log('For Vercel deployment:');
    console.log('1. Go to Vercel Dashboard → Settings → Environment Variables');
    console.log('2. Add all required variables for Production, Preview, and Development');
    console.log('3. Redeploy your application');
    console.log('');
    console.log('📖 See VERCEL_DEPLOYMENT.md for detailed instructions');
    console.log('');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('\n⚠️  VALIDATION PASSED WITH WARNINGS');
    console.log('\nSome optional environment variables are not set.');
    console.log('The application will work, but some features may be limited.');
    console.log('');
    process.exit(0);
  } else {
    console.log('\n✅ ALL CHECKS PASSED');
    console.log('\nAll required environment variables are properly configured.');
    console.log('Your application is ready to run!');
    console.log('');
    process.exit(0);
  }
}

// Run the verification
try {
  main();
} catch (error) {
  console.error('❌ Error running environment verification:', error);
  process.exit(1);
}

#!/usr/bin/env ts-node

/**
 * Test AWS Secrets Manager Connection
 *
 * This script tests the AWS Secrets Manager connection using the credentials
 * in the .env file.
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env') });

// Import after loading env vars
import { testAWSConnection, isAWSEnabled } from '../src/lib/secrets/aws-secrets-manager.js';

async function main() {
  console.log('🔍 Testing AWS Secrets Manager Connection...\n');

  // Check if AWS is enabled
  console.log('Step 1: Checking if AWS is enabled...');
  const enabled = isAWSEnabled();

  if (!enabled) {
    console.error('❌ AWS Secrets Manager is not enabled!');
    console.error('   Check your .env file has:');
    console.error('   - AWS_SECRETS_ENABLED=true');
    console.error('   - AWS_ACCESS_KEY_ID');
    console.error('   - AWS_SECRET_ACCESS_KEY');
    console.error('   - AWS_REGION');
    process.exit(1);
  }

  console.log('✅ AWS is enabled\n');

  // Test connection
  console.log('Step 2: Testing AWS connection...');
  const result = await testAWSConnection();

  console.log('\n📊 Result:');
  console.log('─────────────────────────────────────────');
  console.log(`Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`Message: ${result.message}`);

  if (result.details) {
    console.log('\n🔧 Details:');
    console.log(JSON.stringify(result.details, null, 2));
  }

  console.log('─────────────────────────────────────────\n');

  if (result.success) {
    console.log('🎉 AWS Secrets Manager is configured correctly!');
    console.log('   You can now:');
    console.log('   - Store API credentials in AWS');
    console.log('   - Enable automatic rotation');
    console.log('   - Track usage and costs');
    console.log('   - View secrets in AWS Console');
  } else {
    console.error('❌ Connection failed. Please check:');
    console.error('   1. AWS credentials are correct');
    console.error('   2. IAM user has SecretsManagerReadWrite policy');
    console.error('   3. AWS region is correct (us-east-1)');
    console.error('   4. Network connection is working');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Error running test:');
  console.error(error);
  process.exit(1);
});

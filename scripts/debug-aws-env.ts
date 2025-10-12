#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env') });

console.log('🔍 AWS Environment Variables Debug\n');
console.log('─────────────────────────────────────────');
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID);
console.log('AWS_ACCESS_KEY_ID length:', process.env.AWS_ACCESS_KEY_ID?.length);
console.log('AWS_ACCESS_KEY_ID type:', typeof process.env.AWS_ACCESS_KEY_ID);
console.log('');
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY);
console.log('AWS_SECRET_ACCESS_KEY length:', process.env.AWS_SECRET_ACCESS_KEY?.length);
console.log('AWS_SECRET_ACCESS_KEY type:', typeof process.env.AWS_SECRET_ACCESS_KEY);
console.log('');
console.log('AWS_REGION:', process.env.AWS_REGION);
console.log('AWS_SECRETS_ENABLED:', process.env.AWS_SECRETS_ENABLED);
console.log('─────────────────────────────────────────');

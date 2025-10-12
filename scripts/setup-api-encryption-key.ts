import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Setup Script: Generate API Credentials Encryption Key
 *
 * This script generates a secure encryption key and adds it to your .env file.
 * Run this ONCE during initial setup.
 */

async function main() {
  console.log('\n🔐 API Credentials Encryption Key Setup\n');
  console.log('========================================\n');

  // Generate a secure random key
  const encryptionKey = crypto.randomBytes(32).toString('base64');

  console.log('✅ Generated secure encryption key');
  console.log(`\nKey (keep this secret!):\n${encryptionKey}\n`);

  // Path to .env file
  const envPath = path.join(process.cwd(), '.env');

  // Check if .env file exists
  if (!fs.existsSync(envPath)) {
    console.error('❌ Error: .env file not found');
    console.log('\nPlease create a .env file in your project root first.');
    process.exit(1);
  }

  // Read existing .env content
  let envContent = fs.readFileSync(envPath, 'utf-8');

  // Check if key already exists
  if (envContent.includes('API_CREDENTIALS_ENCRYPTION_KEY=')) {
    console.log('⚠️  Warning: API_CREDENTIALS_ENCRYPTION_KEY already exists in .env');
    console.log('\nDo you want to replace it? (This will invalidate all existing encrypted credentials)');
    console.log('To replace manually, add this line to your .env file:');
    console.log(`\nAPI_CREDENTIALS_ENCRYPTION_KEY="${encryptionKey}"\n`);
    return;
  }

  // Add the key to .env
  if (!envContent.endsWith('\n')) {
    envContent += '\n';
  }

  envContent += `\n# API Credentials Encryption Key (generated ${new Date().toISOString()})\n`;
  envContent += `API_CREDENTIALS_ENCRYPTION_KEY="${encryptionKey}"\n`;

  // Optionally add CRON_SECRET for the rotation checker endpoint
  if (!envContent.includes('CRON_SECRET=')) {
    const cronSecret = crypto.randomBytes(32).toString('hex');
    envContent += `\n# Cron job authentication secret\n`;
    envContent += `CRON_SECRET="${cronSecret}"\n`;
    console.log('✅ Also generated CRON_SECRET for rotation checker');
  }

  // Write back to .env
  fs.writeFileSync(envPath, envContent);

  console.log('✅ Successfully added encryption key to .env file\n');
  console.log('========================================\n');
  console.log('📝 Next Steps:\n');
  console.log('1. Restart your development server');
  console.log('2. Go to http://localhost:3000/admin/api-keys');
  console.log('3. Add your API credentials (QuickBooks, Seiko, etc.)');
  console.log('4. Your credentials are now encrypted and stored securely!\n');
  console.log('🔒 Security Notes:\n');
  console.log('- Never commit your .env file to version control');
  console.log('- Keep your encryption key secret');
  console.log('- Changing the key will invalidate all stored credentials\n');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

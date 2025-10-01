/**
 * OAuth Token Encryption Utility
 *
 * Provides AES-256-GCM encryption for OAuth tokens before storing in database.
 * Tokens are encrypted server-side only and never exposed to clients.
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

/**
 * Get encryption key from environment variable
 */
function getEncryptionKey(): Buffer {
  const key = process.env.OAUTH_TOKEN_ENCRYPTION_KEY;

  if (!key) {
    throw new Error('OAUTH_TOKEN_ENCRYPTION_KEY environment variable is not set');
  }

  if (key.length !== 64) {
    throw new Error('OAUTH_TOKEN_ENCRYPTION_KEY must be 64 characters (32 bytes in hex)');
  }

  return Buffer.from(key, 'hex');
}

/**
 * Encrypt an OAuth token using AES-256-GCM
 *
 * @param token - The plaintext token to encrypt
 * @returns Encrypted token in format: iv:authTag:encrypted
 */
export function encryptToken(token: string): string {
  if (!token) {
    throw new Error('Token cannot be empty');
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt an OAuth token using AES-256-GCM
 *
 * @param encryptedToken - The encrypted token in format: iv:authTag:encrypted
 * @returns Decrypted plaintext token
 */
export function decryptToken(encryptedToken: string): string {
  if (!encryptedToken) {
    throw new Error('Encrypted token cannot be empty');
  }

  const parts = encryptedToken.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format. Expected: iv:authTag:encrypted');
  }

  const [ivHex, authTagHex, encrypted] = parts;

  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error('Encrypted token parts cannot be empty');
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Validate that a token can be encrypted and decrypted successfully
 * Used for testing encryption setup
 */
export function validateEncryption(): boolean {
  try {
    const testToken = 'test_token_' + Date.now();
    const encrypted = encryptToken(testToken);
    const decrypted = decryptToken(encrypted);
    return testToken === decrypted;
  } catch (error) {
    console.error('Encryption validation failed:', error);
    return false;
  }
}

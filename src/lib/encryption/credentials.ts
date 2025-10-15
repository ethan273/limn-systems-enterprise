import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
// Unused const SALT_LENGTH = 64;

/**
 * Get encryption key from environment
 * In production, this should be a strong random key stored securely
 */
function getEncryptionKey(): Buffer {
  const key = process.env.API_CREDENTIALS_ENCRYPTION_KEY;

  if (!key) {
    throw new Error('API_CREDENTIALS_ENCRYPTION_KEY environment variable is not set');
  }

  // Derive a 32-byte key from the environment variable
  return crypto.scryptSync(key, 'salt', 32);
}

/**
 * Encrypt credentials object
 * @param credentials - Object containing API credentials
 * @returns Encrypted string
 */
export function encryptCredentials(credentials: Record<string, unknown>): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const plaintext = JSON.stringify(credentials);
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    // Combine IV + authTag + encrypted data
    const combined = Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, 'base64')
    ]);

    return combined.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt credentials');
  }
}

/**
 * Decrypt credentials string
 * @param encryptedData - Encrypted credentials string
 * @returns Decrypted credentials object
 */
export function decryptCredentials(encryptedData: string): Record<string, unknown> {
  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encryptedData, 'base64');

    // Extract IV, authTag, and encrypted data
    const iv = combined.slice(0, IV_LENGTH);
    const authTag = combined.slice(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = combined.slice(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted.toString('base64'), 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted) as Record<string, unknown>;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt credentials');
  }
}

/**
 * Generate a secure random encryption key
 * This should be called once and the result stored in environment variables
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('base64');
}

/**
 * Mask sensitive data for display
 * Shows only first and last few characters
 */
export function maskCredential(value: string, visibleChars = 4): string {
  if (value.length <= visibleChars * 2) {
    return '*'.repeat(value.length);
  }

  const start = value.substring(0, visibleChars);
  const end = value.substring(value.length - visibleChars);
  const masked = '*'.repeat(Math.max(8, value.length - visibleChars * 2));

  return `${start}${masked}${end}`;
}

/**
 * Credentials Provider
 *
 * This module provides runtime access to API credentials stored in the database.
 * It replaces the need for environment variables for third-party API keys.
 *
 * Usage:
 *   const creds = await getCredentials('quickbooks');
 *   const clientId = creds.client_id;
 */

import { PrismaClient } from '@prisma/client';
import { decryptCredentials } from '@/lib/encryption/credentials';

const prisma = new PrismaClient();

// Cache credentials in memory for performance (cache for 5 minutes)
const credentialsCache = new Map<string, { data: Record<string, unknown>; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get decrypted credentials for a service
 * @param serviceName - The unique service name (e.g., 'quickbooks', 'seiko_logistics')
 * @param useCache - Whether to use cached credentials (default: true)
 * @returns Decrypted credentials object
 */
export async function getCredentials(
  serviceName: string,
  useCache = true
): Promise<Record<string, unknown>> {
  try {
    // Check cache first
    if (useCache) {
      const cached = credentialsCache.get(serviceName);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }
    }

    // Fetch from database
    const credential = await prisma.api_credentials.findUnique({
      where: { service_name: serviceName },
    });

    if (!credential) {
      throw new Error(`Credentials not found for service: ${serviceName}`);
    }

    if (!credential.is_active) {
      throw new Error(`Credentials for service "${serviceName}" are inactive`);
    }

    // Check expiration
    if (credential.expires_at && new Date(credential.expires_at) < new Date()) {
      throw new Error(`Credentials for service "${serviceName}" have expired`);
    }

    // Decrypt credentials
    const decrypted = typeof credential.credentials === 'string'
      ? decryptCredentials(credential.credentials)
      : credential.credentials as Record<string, unknown>;

    // Update last_used_at timestamp (fire and forget)
    prisma.api_credentials
      .update({
        where: { service_name: serviceName },
        data: { last_used_at: new Date() },
      })
      .catch((err) => console.error('Failed to update last_used_at:', err));

    // Cache the result
    credentialsCache.set(serviceName, {
      data: decrypted,
      timestamp: Date.now(),
    });

    return decrypted;
  } catch (error) {
    console.error(`Error getting credentials for ${serviceName}:`, error);
    throw error;
  }
}

/**
 * Get a specific credential field
 * @param serviceName - The service name
 * @param fieldName - The field to retrieve (e.g., 'client_id', 'api_key')
 * @returns The credential value
 */
export async function getCredentialField(
  serviceName: string,
  fieldName: string
): Promise<string> {
  const credentials = await getCredentials(serviceName);

  if (!(fieldName in credentials)) {
    throw new Error(`Field "${fieldName}" not found in credentials for service: ${serviceName}`);
  }

  return credentials[fieldName] as string;
}

/**
 * Check if credentials exist for a service
 * @param serviceName - The service name
 * @returns True if credentials exist and are active
 */
export async function hasCredentials(serviceName: string): Promise<boolean> {
  try {
    const credential = await prisma.api_credentials.findUnique({
      where: { service_name: serviceName },
      select: { is_active: true },
    });

    return credential?.is_active || false;
  } catch (error) {
    console.error(`Error checking credentials for ${serviceName}:`, error);
    return false;
  }
}

/**
 * Clear the credentials cache
 * Useful after updating credentials in the admin panel
 */
export function clearCredentialsCache(serviceName?: string) {
  if (serviceName) {
    credentialsCache.delete(serviceName);
  } else {
    credentialsCache.clear();
  }
}

/**
 * Get QuickBooks credentials
 * Helper function for QuickBooks integration
 */
export async function getQuickBooksCredentials() {
  const creds = await getCredentials('quickbooks');
  return {
    clientId: creds.client_id as string,
    clientSecret: creds.client_secret as string,
    redirectUri: creds.redirect_uri as string,
  };
}

/**
 * Get Seiko Logistics credentials
 * Helper function for Seiko integration
 */
export async function getSeikoCredentials() {
  const creds = await getCredentials('seiko_logistics');
  return {
    apiKey: creds.api_key as string,
    apiSecret: creds.api_secret as string,
    accountId: creds.account_id as string,
    environment: creds.environment as string || 'qa',
  };
}

/**
 * Get Google Drive credentials
 * Helper function for Google Drive integration
 */
export async function getGoogleDriveCredentials() {
  const creds = await getCredentials('google_drive');
  return {
    clientId: creds.client_id as string,
    clientSecret: creds.client_secret as string,
    folderId: creds.folder_id as string,
  };
}

/**
 * QuickBooks Authentication Helpers
 *
 * Utilities for retrieving and managing QuickBooks authentication tokens.
 */

import { prisma } from '@/lib/db';
import { QuickBooksClient, QuickBooksTokens } from './client';

/**
 * Get QuickBooks client instance with tokens loaded for a specific user
 *
 * @param userId - Supabase user ID
 * @param realmId - Optional QuickBooks company ID (uses most recent if not provided)
 * @returns QuickBooksClient instance with tokens loaded
 * @throws Error if no active connection found or tokens expired
 */
export async function getQuickBooksClient(
  userId: string,
  realmId?: string
): Promise<QuickBooksClient> {
  // Get connection from database
  // Note: findFirst not supported by wrapper, using findMany
  const connectionArray = await prisma.quickbooks_connections.findMany({
    where: {
      user_id: userId,
      is_active: true,
      ...(realmId && { realm_id: realmId }),
    },
    orderBy: {
      updated_at: 'desc',
    },
    take: 1,
  });
  const connection = connectionArray.length > 0 ? connectionArray[0] : null;

  if (!connection) {
    throw new Error('No active QuickBooks connection found. Please connect to QuickBooks first.');
  }

  // Check if access token is expired
  const now = new Date();
  if (connection.token_expires_at && connection.token_expires_at < now) {
    throw new Error('QuickBooks access token expired. Please refresh the connection.');
  }

  // Create client instance
  const client = new QuickBooksClient({
    clientId: process.env.QUICKBOOKS_CLIENT_ID || '',
    clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET || '',
    environment: (process.env.QUICKBOOKS_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
    redirectUri: process.env.QUICKBOOKS_REDIRECT_URI!,
    baseUrl:
      process.env.QUICKBOOKS_ENVIRONMENT === 'production'
        ? 'https://quickbooks.api.intuit.com'
        : 'https://sandbox-quickbooks.api.intuit.com',
  });

  // Set tokens from database
  const tokens: QuickBooksTokens = {
    access_token: connection.access_token,
    refresh_token: connection.refresh_token,
    token_expiry: connection.token_expires_at || new Date(),
    refresh_token_expiry: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000), // 100 days default
    realm_id: connection.realm_id,
  };

  client.setTokens(tokens);

  return client;
}

/**
 * Get QuickBooks client by company ID (realm ID)
 *
 * @param realmId - QuickBooks company ID
 * @returns QuickBooksClient instance with tokens loaded
 * @throws Error if no active connection found
 */
export async function getQuickBooksClientByRealm(realmId: string): Promise<QuickBooksClient> {
  // Get connection from database
  // Note: findFirst not supported by wrapper, using findMany
  const connectionArray = await prisma.quickbooks_connections.findMany({
    where: {
      realm_id: realmId,
      is_active: true,
    },
    take: 1,
  });
  const connection = connectionArray.length > 0 ? connectionArray[0] : null;

  if (!connection) {
    throw new Error(`No active QuickBooks connection found for realm: ${realmId}`);
  }

  // Use the main helper with the user ID
  return getQuickBooksClient(connection.user_id, realmId);
}

/**
 * Check if user has an active QuickBooks connection
 *
 * @param userId - Supabase user ID
 * @returns boolean indicating if user has active connection
 */
export async function hasQuickBooksConnection(userId: string): Promise<boolean> {
  // Note: findFirst not supported by wrapper, using findMany
  const connectionArray = await prisma.quickbooks_connections.findMany({
    where: {
      user_id: userId,
      is_active: true,
    },
    take: 1,
  });
  const connection = connectionArray.length > 0 ? connectionArray[0] : null;

  if (!connection) {
    return false;
  }

  // Check if token is not expired
  const now = new Date();
  return connection.token_expires_at ? connection.token_expires_at > now : false;
}

/**
 * Get QuickBooks connection details for a user
 *
 * @param userId - Supabase user ID
 * @param realmId - Optional QuickBooks company ID
 * @returns Connection details or null
 */
export async function getQuickBooksConnection(userId: string, realmId?: string) {
  // Note: findFirst not supported by wrapper, using findMany
  const connectionArray = await prisma.quickbooks_connections.findMany({
    where: {
      user_id: userId,
      is_active: true,
      ...(realmId && { realm_id: realmId }),
    },
    orderBy: {
      updated_at: 'desc',
    },
    take: 1,
  });
  return connectionArray.length > 0 ? connectionArray[0] : null;
}

/**
 * Update QuickBooks connection tokens in database
 *
 * @param connectionId - Connection ID
 * @param tokens - New token values
 */
export async function updateQuickBooksTokens(
  connectionId: string,
  tokens: {
    access_token: string;
    refresh_token: string;
    token_expires_at: Date;
  }
) {
  await prisma.quickbooks_connections.update({
    where: { id: connectionId },
    data: {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: tokens.token_expires_at,
      updated_at: new Date(),
    },
  });
}

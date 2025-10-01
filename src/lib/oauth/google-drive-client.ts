/**
 * Google Drive OAuth 2.0 Client
 *
 * Handles OAuth 2.0 authentication flow for Google Drive API access.
 * Provides token exchange, refresh, and Google Drive API client setup.
 */

import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';

/**
 * OAuth 2.0 configuration from environment variables
 */
const OAUTH_CONFIG = {
  clientId: process.env.GOOGLE_DRIVE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET!,
  redirectUri: process.env.NODE_ENV === 'production'
    ? process.env.GOOGLE_DRIVE_REDIRECT_URI_PRODUCTION!
    : process.env.GOOGLE_DRIVE_REDIRECT_URI!,
};

/**
 * Google Drive API scopes
 * drive.file: Access only to files created by this app
 */
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

/**
 * Create a new OAuth2 client
 */
export function createOAuth2Client(): OAuth2Client {
  return new google.auth.OAuth2(
    OAUTH_CONFIG.clientId,
    OAUTH_CONFIG.clientSecret,
    OAUTH_CONFIG.redirectUri
  );
}

/**
 * Generate OAuth 2.0 authorization URL
 *
 * @param userId - User ID to include in state parameter for security
 * @returns Authorization URL to redirect user to
 */
export function generateAuthUrl(userId: string): string {
  const oauth2Client = createOAuth2Client();

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Get refresh token
    scope: SCOPES,
    state: userId, // Pass user ID in state for verification
    prompt: 'consent', // Force consent screen to ensure refresh token
  });

  return authUrl;
}

/**
 * Exchange authorization code for access and refresh tokens
 *
 * @param code - Authorization code from OAuth callback
 * @returns Object containing access_token, refresh_token, and expiry_date
 */
export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = createOAuth2Client();

  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token) {
    throw new Error('No access token returned from Google');
  }

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || null,
    expiry_date: tokens.expiry_date || null,
    token_type: tokens.token_type || 'Bearer',
    scope: tokens.scope || SCOPES.join(' '),
  };
}

/**
 * Refresh access token using refresh token
 *
 * @param refreshToken - The refresh token from initial OAuth flow
 * @returns New access token and expiry date
 */
export async function refreshAccessToken(refreshToken: string) {
  const oauth2Client = createOAuth2Client();

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  const { credentials } = await oauth2Client.refreshAccessToken();

  if (!credentials.access_token) {
    throw new Error('No access token returned from token refresh');
  }

  return {
    access_token: credentials.access_token,
    expiry_date: credentials.expiry_date || null,
  };
}

/**
 * Revoke OAuth tokens (disconnect Google Drive)
 *
 * @param accessToken - The access token to revoke
 */
export async function revokeToken(accessToken: string): Promise<void> {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  await oauth2Client.revokeCredentials();
}

/**
 * Create authenticated Google Drive API client
 *
 * @param accessToken - Valid access token
 * @returns Google Drive API client instance
 */
export function createDriveClient(accessToken: string) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

/**
 * Get user info from Google OAuth
 *
 * @param accessToken - Valid access token
 * @returns User email and profile information
 */
export async function getUserInfo(accessToken: string) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });

  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();

  return {
    email: data.email || null,
    name: data.name || null,
    picture: data.picture || null,
    verified_email: data.verified_email || false,
  };
}

/**
 * Check if token is expired or will expire soon (within 5 minutes)
 *
 * @param expiryDate - Token expiry date in milliseconds
 * @returns True if token needs refresh
 */
export function isTokenExpired(expiryDate: number | null): boolean {
  if (!expiryDate) {
    return true;
  }

  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  return now >= (expiryDate - fiveMinutes);
}

/**
 * Validate OAuth configuration
 */
export function validateOAuthConfig(): boolean {
  const required = [
    'GOOGLE_DRIVE_CLIENT_ID',
    'GOOGLE_DRIVE_CLIENT_SECRET',
    'GOOGLE_DRIVE_REDIRECT_URI',
  ];

  // eslint-disable-next-line security/detect-object-injection
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('Missing OAuth environment variables:', missing);
    return false;
  }

  return true;
}

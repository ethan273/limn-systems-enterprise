/**
 * OAuth tRPC Router
 *
 * Provides API endpoints for Google Drive OAuth operations.
 */

import { createTRPCRouter, publicProcedure } from '../trpc/init';
import {
  generateAuthUrl,
  refreshAccessToken,
  revokeToken,
  isTokenExpired,
} from '@/lib/oauth/google-drive-client';
import { encryptToken, decryptToken } from '@/lib/oauth/token-encryption';
import { TRPCError } from '@trpc/server';

/**
 * Helper function to find first oauth token (wrapper around findMany)
 */
async function findFirstOAuthToken(db: any, userId: string, provider: string) {
  const tokens = await db.oauth_tokens.findMany({
    where: {
      user_id: userId,
      provider,
    },
  });
  return tokens.length > 0 ? tokens[0] : null;
}

export const oauthRouter = createTRPCRouter({
  /**
   * Generate Google OAuth authorization URL
   */
  getAuthUrl: publicProcedure.query(({ ctx }) => {
    if (!ctx.session?.user?.id) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User must be logged in',
      });
    }

    const userId = ctx.session.user.id;
    const authUrl = generateAuthUrl(userId);

    return {
      url: authUrl,
    };
  }),

  /**
   * Get current OAuth connection status
   */
  getConnectionStatus: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.session?.user?.id) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User must be logged in',
      });
    }

    const userId = ctx.session.user.id;

    const token = await findFirstOAuthToken(ctx.db, userId, 'google_drive');

    if (!token) {
      return {
        connected: false,
      };
    }

    // Check if token is expired
    const expiryDate = token.expires_at ? token.expires_at.getTime() : null;
    const expired = isTokenExpired(expiryDate);

    return {
      connected: true,
      expired,
      connectedAt: token.created_at,
    };
  }),

  /**
   * Refresh OAuth access token if needed
   */
  refreshToken: publicProcedure.mutation(async ({ ctx }) => {
    if (!ctx.session?.user?.id) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User must be logged in',
      });
    }

    const userId = ctx.session.user.id;

    // Get existing token
    const token = await findFirstOAuthToken(ctx.db, userId, 'google_drive');

    if (!token) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No Google Drive connection found. Please connect your account.',
      });
    }

    if (!token.refresh_token) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No refresh token available. Please reconnect your Google Drive account.',
      });
    }

    // Decrypt refresh token
    const decryptedRefreshToken = decryptToken(token.refresh_token);

    // Get new access token
    const newTokens = await refreshAccessToken(decryptedRefreshToken);

    // Encrypt new access token
    const encryptedAccessToken = encryptToken(newTokens.access_token);

    // Update in database
    await ctx.db.oauth_tokens.update({
      where: { id: token.id },
      data: {
        access_token: encryptedAccessToken,
        expires_at: newTokens.expiry_date ? new Date(newTokens.expiry_date) : new Date(Date.now() + 3600000),
        updated_at: new Date(),
      },
    });

    return {
      success: true,
      expiresAt: newTokens.expiry_date,
    };
  }),

  /**
   * Disconnect Google Drive (revoke tokens)
   */
  disconnect: publicProcedure.mutation(async ({ ctx }) => {
    if (!ctx.session?.user?.id) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User must be logged in',
      });
    }

    const userId = ctx.session.user.id;

    // Get existing token
    const token = await findFirstOAuthToken(ctx.db, userId, 'google_drive');

    if (!token) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No Google Drive connection found.',
      });
    }

    try {
      // Decrypt access token
      const decryptedAccessToken = decryptToken(token.access_token);

      // Revoke token with Google
      await revokeToken(decryptedAccessToken);
    } catch (error) {
      console.error('Error revoking token with Google:', error);
      // Continue to delete from database even if revocation fails
    }

    // Delete from database
    await ctx.db.oauth_tokens.delete({
      where: { id: token.id },
    });

    return {
      success: true,
      message: 'Google Drive disconnected successfully',
    };
  }),

  /**
   * Get valid access token (refresh if needed)
   * Internal helper for other routers
   */
  getValidAccessToken: publicProcedure.query(async ({ ctx }: { ctx: any }) => {
    if (!ctx.session?.user?.id) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User must be logged in',
      });
    }

    const userId = ctx.session.user.id;

    // Get existing token
    const token = await findFirstOAuthToken(ctx.db, userId, 'google_drive');

    if (!token) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No Google Drive connection found. Please connect your account.',
      });
    }

    // Check if token is expired
    const expiryDate = token.expires_at ? token.expires_at.getTime() : null;
    const expired = isTokenExpired(expiryDate);

    // If expired, refresh it
    if (expired && token.refresh_token) {
      const decryptedRefreshToken = decryptToken(token.refresh_token);
      const newTokens = await refreshAccessToken(decryptedRefreshToken);
      const encryptedAccessToken = encryptToken(newTokens.access_token);

      await ctx.db.oauth_tokens.update({
        where: { id: token.id },
        data: {
          access_token: encryptedAccessToken,
          expires_at: newTokens.expiry_date ? new Date(newTokens.expiry_date) : new Date(Date.now() + 3600000),
          updated_at: new Date(),
        },
      });

      return {
        accessToken: newTokens.access_token,
        refreshed: true,
      };
    }

    // Decrypt and return existing token
    const decryptedAccessToken = decryptToken(token.access_token);

    return {
      accessToken: decryptedAccessToken,
      refreshed: false,
    };
  }),
});

/**
 * Google OAuth 2.0 Callback Route
 *
 * Handles the OAuth redirect from Google after user grants permission.
 * Exchanges authorization code for tokens and stores them in database.
 */

import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, getUserInfo as _getUserInfo } from '@/lib/oauth/google-drive-client';
import { encryptToken } from '@/lib/oauth/token-encryption';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters from OAuth redirect
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // userId
    const error = searchParams.get('error');

    // Handle OAuth error (user denied access)
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/design/documents?error=oauth_denied`, request.url)
      );
    }

    // Validate required parameters
    if (!code) {
      return NextResponse.redirect(
        new URL(`/design/documents?error=no_code`, request.url)
      );
    }

    if (!state) {
      return NextResponse.redirect(
        new URL(`/design/documents?error=no_state`, request.url)
      );
    }

    const userId = state;

    // Exchange authorization code for tokens
    const tokens = await exchangeCodeForTokens(code);

    if (!tokens.access_token) {
      throw new Error('No access token received');
    }

    // Get user info from Google
    // User info not needed for token storage
    // const _userInfo = await getUserInfo(tokens.access_token);

    // Encrypt tokens before storing
    const encryptedAccessToken = encryptToken(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token
      ? encryptToken(tokens.refresh_token)
      : null;

    // Store tokens in database
    // Check if user already has tokens stored
    const existingTokens = await db.oauth_tokens.findMany({
      where: {
        user_id: userId,
        provider: 'google_drive',
      },
    });
    const existingToken = existingTokens.length > 0 ? existingTokens[0] : null;

    if (existingToken) {
      // Update existing tokens
      await db.oauth_tokens.update({
        where: { id: existingToken.id },
        data: {
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          token_type: tokens.token_type,
          expires_at: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600000), // Default 1 hour if no expiry
          scope: tokens.scope,
          updated_at: new Date(),
        },
      });
    } else {
      // Create new token record
      await db.oauth_tokens.create({
        data: {
          user_id: userId,
          provider: 'google_drive',
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          token_type: tokens.token_type,
          expires_at: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600000), // Default 1 hour if no expiry
          scope: tokens.scope,
        },
      });
    }

    // Redirect to success page
    return NextResponse.redirect(
      new URL(`/design/documents?success=google_connected`, request.url)
    );
  } catch (error) {
    console.error('OAuth callback error:', error);

    // Redirect with error message
    return NextResponse.redirect(
      new URL(
        `/design/documents?error=oauth_failed&message=${encodeURIComponent(
          error instanceof Error ? error.message : 'Unknown error'
        )}`,
        request.url
      )
    );
  }
}

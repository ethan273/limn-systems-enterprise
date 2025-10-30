import { log } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';

/**
 * QuickBooks Token Refresh
 *
 * Manually refreshes QuickBooks access token using the refresh token.
 * Automatically called by the QuickBooks client when tokens expire.
 *
 * POST /api/quickbooks/refresh
 *
 * Request Body:
 * - realmId: QuickBooks company ID (optional, refreshes primary connection if not provided)
 *
 * Response:
 * - { success: true, expiresAt: string }
 */

const QB_CLIENT_ID = process.env.QUICKBOOKS_CLIENT_ID || '';
const QB_CLIENT_SECRET = process.env.QUICKBOOKS_CLIENT_SECRET || '';
const QB_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const realmId = body.realmId;

    // Get connection to refresh
    // Note: findFirst not supported by wrapper, using findMany
    const connectionArray = await prisma.quickbooks_connections.findMany({
      where: {
        user_id: user.id,
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
      return NextResponse.json(
        { error: 'No active QuickBooks connection found' },
        { status: 404 }
      );
    }

    // Exchange refresh token for new access token
    const authString = Buffer.from(`${QB_CLIENT_ID}:${QB_CLIENT_SECRET}`).toString('base64');

    const tokenResponse = await fetch(QB_TOKEN_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${authString}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: connection.refresh_token,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      log.error('[QuickBooks Refresh] Token refresh failed:', errorData);

      // If refresh token is invalid, deactivate connection
      if (errorData.error === 'invalid_grant') {
        await prisma.quickbooks_connections.update({
          where: { id: connection.id },
          data: { is_active: false },
        });

        return NextResponse.json(
          {
            error: 'Refresh token expired. Please reconnect to QuickBooks.',
            reconnectRequired: true,
          },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to refresh QuickBooks token' },
        { status: 500 }
      );
    }

    const tokenData = await tokenResponse.json();

    // Calculate new token expiry
    const tokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000);

    // Update connection with new tokens
    await prisma.quickbooks_connections.update({
      where: {
        id: connection.id,
      },
      data: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: tokenExpiry,
        updated_at: new Date(),
      },
    });

    // Also update quickbooks_auth table
    const refreshTokenExpiry = new Date(
      Date.now() + (tokenData.x_refresh_token_expires_in || 8726400) * 1000
    );

    await prisma.quickbooks_auth
      .updateMany({
        where: {
          company_id: connection.company_id,
        },
        data: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expiry: tokenExpiry,
          refresh_token_expiry: refreshTokenExpiry,
          updated_at: new Date(),
        },
      })
      .catch(() => {
        // Ignore if record doesn't exist
      });

    log.info('[QuickBooks Refresh] Successfully refreshed token for realm:', connection.realm_id);

    return NextResponse.json({
      success: true,
      expiresAt: tokenExpiry.toISOString(),
      realmId: connection.realm_id,
    });
  } catch (error) {
    log.error('[QuickBooks Refresh] Error:', { error });
    return NextResponse.json(
      { error: 'Failed to refresh QuickBooks token' },
      { status: 500 }
    );
  }
}

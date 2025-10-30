import { log } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';

/**
 * QuickBooks Disconnect Handler
 *
 * Disconnects QuickBooks integration by revoking tokens and deactivating connection.
 *
 * POST /api/quickbooks/disconnect
 *
 * Request Body:
 * - realmId: QuickBooks company ID to disconnect (optional, disconnects all if not provided)
 *
 * Response:
 * - { success: true, message: string }
 */

const QB_CLIENT_ID = process.env.QUICKBOOKS_CLIENT_ID || '';
const QB_CLIENT_SECRET = process.env.QUICKBOOKS_CLIENT_SECRET || '';
const QB_REVOKE_URL = 'https://developer.api.intuit.com/v2/oauth2/tokens/revoke';

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

    const body = await request.json();
    const realmId = body.realmId;

    // Get connection(s) to disconnect
    const connections = await prisma.quickbooks_connections.findMany({
      where: {
        user_id: user.id,
        is_active: true,
        ...(realmId && { company_id: realmId }),
      },
    });

    if (connections.length === 0) {
      return NextResponse.json(
        { error: 'No active QuickBooks connection found' },
        { status: 404 }
      );
    }

    // Revoke tokens for each connection
    const authString = Buffer.from(`${QB_CLIENT_ID}:${QB_CLIENT_SECRET}`).toString('base64');

    for (const connection of connections) {
      try {
        // Revoke refresh token (also invalidates access token)
        await fetch(QB_REVOKE_URL, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Basic ${authString}`,
          },
          body: JSON.stringify({
            token: connection.refresh_token,
          }),
        });

        log.info('[QuickBooks Disconnect] Token revoked for realm:', connection.realm_id);
      } catch (error) {
        log.warn('[QuickBooks Disconnect] Failed to revoke token:', { error });
        // Continue even if revocation fails
      }

      // Deactivate connection in database
      await prisma.quickbooks_connections.update({
        where: {
          id: connection.id,
        },
        data: {
          is_active: false,
          updated_at: new Date(),
        },
      });

      // Also deactivate in quickbooks_auth table
      await prisma.quickbooks_auth
        .updateMany({
          where: {
            company_id: connection.company_id,
          },
          data: {
            is_active: false,
            updated_at: new Date(),
          },
        })
        .catch(() => {
          // Ignore if record doesn't exist
        });
    }

    log.info('[QuickBooks Disconnect] Successfully disconnected QuickBooks for user:', user.id);

    return NextResponse.json({
      success: true,
      message: `Disconnected ${connections.length} QuickBooks ${connections.length === 1 ? 'connection' : 'connections'}`,
    });
  } catch (error) {
    log.error('[QuickBooks Disconnect] Error:', { error });
    return NextResponse.json(
      { error: 'Failed to disconnect QuickBooks' },
      { status: 500 }
    );
  }
}

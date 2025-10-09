import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';

/**
 * QuickBooks Connection Status
 *
 * Returns the current QuickBooks connection status for the authenticated user.
 *
 * GET /api/quickbooks/status
 *
 * Response:
 * - {
 *     connected: boolean,
 *     connections: Array<{
 *       realmId: string,
 *       companyName: string,
 *       isActive: boolean,
 *       tokenExpiresAt: string,
 *       tokenExpired: boolean
 *     }>
 *   }
 */

export async function GET(request: NextRequest) {
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

    // Get all connections for user
    const connections = await prisma.quickbooks_connections.findMany({
      where: {
        user_id: user.id,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Format connection data
    const formattedConnections = connections.map((conn) => {
      const now = new Date();
      const tokenExpired = conn.token_expires_at ? conn.token_expires_at < now : true;

      return {
        realmId: conn.realm_id,
        companyId: conn.company_id,
        companyName: conn.company_name || 'Unknown Company',
        isActive: conn.is_active || false,
        tokenExpiresAt: conn.token_expires_at?.toISOString() || null,
        tokenExpired,
        createdAt: conn.created_at?.toISOString() || null,
        updatedAt: conn.updated_at?.toISOString() || null,
      };
    });

    // Check if any active, non-expired connections exist
    const hasActiveConnection = formattedConnections.some(
      (conn) => conn.isActive && !conn.tokenExpired
    );

    return NextResponse.json({
      connected: hasActiveConnection,
      connections: formattedConnections,
      totalConnections: connections.length,
      activeConnections: formattedConnections.filter((c) => c.isActive && !c.tokenExpired).length,
    });
  } catch (error) {
    console.error('[QuickBooks Status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch QuickBooks status' },
      { status: 500 }
    );
  }
}

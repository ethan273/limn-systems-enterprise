import { log } from '@/lib/logger';
/**
 * RBAC API - Get User Roles
 *
 * Returns all effective roles for a user (including inherited roles)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/server';
import { getEffectiveRoles } from '@/lib/services/rbac-service';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Get userId from query params (or use current user)
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');

    // Security: Only allow users to query their own roles
    // unless they are admin
    const userId = requestedUserId || user.id;

    if (userId !== user.id) {
      // Check if current user is admin before allowing to query others
      const currentUserRoles = await getEffectiveRoles(user.id);
      const isAdmin = currentUserRoles.includes('super_admin') || currentUserRoles.includes('admin');

      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Forbidden - Cannot query other users\' roles' },
          { status: 403 }
        );
      }
    }

    // Get roles
    const roles = await getEffectiveRoles(userId);

    return NextResponse.json({
      userId,
      roles,
      count: roles.length,
    });

  } catch (error) {
    log.error('[RBAC API] Error fetching roles:', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Role Determination Service (Legacy Compatibility Layer)
 *
 * @deprecated This is a legacy compatibility layer for the old role system.
 * New code should use the RBAC system from @/lib/services/rbac-service instead.
 *
 * This service now delegates to the RBAC system but provides backward-compatible
 * simplified role types for existing code.
 *
 * Migration Guide:
 * - Replace getUserRole() with getEffectiveRoles() from rbac-service
 * - Replace role checks with hasRole() or hasPermission() from rbac-service
 * - Use useUserRoles() or useUserPermissions() hooks in React components
 */

import { getEffectiveRoles, SYSTEM_ROLES, type SystemRole } from '@/lib/services/rbac-service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type UserRole = 'limn_team' | 'factory' | 'designer' | 'client' | 'admin' | 'unknown';

/**
 * Get simplified user role from RBAC system
 *
 * @deprecated Use getEffectiveRoles() from rbac-service for full role information
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  try {
    // Get roles from RBAC system
    const systemRoles = await getEffectiveRoles(userId);

    // Map to simplified role for backward compatibility
    return mapSystemRolesToLegacyRole(systemRoles);
  } catch (error) {
    console.error('[role-service] Error determining user role:', error);

    // Fallback to old logic if RBAC fails
    try {
      const userProfile = await prisma.user_profiles.findUnique({
        where: { id: userId },
        select: {
          user_type: true,
          email: true,
        },
      });

      if (!userProfile) {
        console.warn(`[role-service] User profile not found: ${userId}`);
        return 'unknown';
      }

      // Check user type
      if (userProfile.user_type) {
        return mapUserTypeToRole(userProfile.user_type);
      }

      // Check email domain for role hints
      if (userProfile.email) {
        if (userProfile.email.includes('@limn') || userProfile.email.includes('@limnsystems')) {
          return 'limn_team';
        }
      }

      return 'unknown';
    } catch (fallbackError) {
      console.error('[role-service] Fallback also failed:', fallbackError);
      return 'unknown';
    }
  }
}

/**
 * Map RBAC system roles to legacy simplified role
 *
 * Priority:
 * 1. Admin roles (super_admin, admin) → 'admin'
 * 2. Limn team roles (manager, team_lead, developer, analyst) → 'limn_team'
 * 3. External roles (designer) → 'designer'
 * 4. Manufacturing roles (mapped from user_type) → 'factory'
 * 5. Customer roles (viewer, user without other roles) → 'client'
 */
function mapSystemRolesToLegacyRole(systemRoles: SystemRole[]): UserRole {
  if (systemRoles.length === 0) {
    return 'unknown';
  }

  // Check for admin roles first (highest priority)
  if (
    systemRoles.includes(SYSTEM_ROLES.SUPER_ADMIN) ||
    systemRoles.includes(SYSTEM_ROLES.ADMIN)
  ) {
    return 'admin';
  }

  // Check for Limn team roles
  if (
    systemRoles.includes(SYSTEM_ROLES.MANAGER) ||
    systemRoles.includes(SYSTEM_ROLES.TEAM_LEAD) ||
    systemRoles.includes(SYSTEM_ROLES.DEVELOPER) ||
    systemRoles.includes(SYSTEM_ROLES.ANALYST)
  ) {
    return 'limn_team';
  }

  // Check for designer role
  if (systemRoles.includes(SYSTEM_ROLES.DESIGNER)) {
    return 'designer';
  }

  // Check for basic user vs viewer
  if (systemRoles.includes(SYSTEM_ROLES.USER)) {
    return 'client';
  }

  if (systemRoles.includes(SYSTEM_ROLES.VIEWER)) {
    return 'client';
  }

  return 'unknown';
}

/**
 * Map user_type to UserRole (legacy fallback)
 *
 * @deprecated This is only used as a fallback if RBAC system fails
 */
function mapUserTypeToRole(userType: string): UserRole {
  const typeLower = userType.toLowerCase();

  if (typeLower === 'internal' || typeLower === 'employee') return 'limn_team';
  if (typeLower === 'manufacturer' || typeLower === 'factory') return 'factory';
  if (typeLower === 'designer') return 'designer';
  if (typeLower === 'customer' || typeLower === 'client') return 'client';
  if (typeLower === 'super_admin' || typeLower === 'admin') return 'admin';

  return 'unknown';
}

/**
 * Get user role with caching (for same request context)
 *
 * @deprecated Use getEffectiveRoles() from rbac-service which has its own caching
 *
 * Note: This now delegates to RBAC system which has 5-minute cache built-in
 */
const roleCache = new Map<string, { role: UserRole; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getUserRoleWithCache(userId: string): Promise<UserRole> {
  const cached = roleCache.get(userId);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.role;
  }

  const role = await getUserRole(userId);
  roleCache.set(userId, { role, timestamp: now });

  return role;
}

/**
 * Batch get user roles (for efficiency)
 *
 * @deprecated Use getEffectiveRoles() from rbac-service for each user
 *
 * Note: This now uses RBAC system for each user. For true batch operations,
 * consider implementing batchGetEffectiveRoles() in rbac-service.
 */
export async function getUserRoles(userIds: string[]): Promise<Record<string, UserRole>> {
  const roles: Record<string, UserRole> = {};

  // Get roles from RBAC system for each user
  await Promise.all(
    userIds.map(async (userId) => {
      try {
        const role = await getUserRole(userId);
        // eslint-disable-next-line security/detect-object-injection
        roles[userId] = role;
      } catch (error) {
        console.error(`[role-service] Error getting role for user ${userId}:`, error);
        // eslint-disable-next-line security/detect-object-injection
        roles[userId] = 'unknown';
      }
    })
  );

  return roles;
}

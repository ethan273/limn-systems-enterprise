/**
 * Role-Based Access Control (RBAC) Service
 *
 * Complete implementation of RBAC using user_roles table.
 * Industry-standard permission management system.
 *
 * Includes integrated security event logging for audit trail.
 *
 * @see /limn-systems-enterprise-docs/07-DEVELOPMENT-GUIDES/RBAC-SYSTEM.md
 */

import { PrismaClient } from '@prisma/client';
import {
  logPermissionDenial,
  logRoleChange,
} from './security-events-service';

const prisma = new PrismaClient();

// ============================================
// ROLE DEFINITIONS
// ============================================

/**
 * All available roles in the system
 * These roles can be assigned to users via user_roles table
 */
export const SYSTEM_ROLES = {
  // Administrative Roles
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  TEAM_LEAD: 'team_lead',

  // Functional Roles
  DEVELOPER: 'developer',
  DESIGNER: 'designer',
  ANALYST: 'analyst',

  // Access Roles
  VIEWER: 'viewer',
  USER: 'user',
} as const;

export type SystemRole = typeof SYSTEM_ROLES[keyof typeof SYSTEM_ROLES];

/**
 * User type categorization (from user_profiles.user_type)
 * Used ONLY for routing and basic categorization
 * NOT for permissions (use roles for permissions)
 */
export type UserType =
  | 'super_admin'
  | 'employee'
  | 'customer'
  | 'contractor'
  | 'designer'
  | 'manufacturer'
  | 'finance'
  | 'factory'
  | 'qc_tester';

// ============================================
// ROLE HIERARCHY
// ============================================

/**
 * Role hierarchy - higher roles inherit permissions from lower roles
 *
 * Example: 'super_admin' inherits all permissions from 'admin', 'manager', etc.
 */
const ROLE_HIERARCHY: Record<SystemRole, SystemRole[]> = {
  [SYSTEM_ROLES.SUPER_ADMIN]: [
    SYSTEM_ROLES.ADMIN,
    SYSTEM_ROLES.MANAGER,
    SYSTEM_ROLES.TEAM_LEAD,
    SYSTEM_ROLES.DEVELOPER,
    SYSTEM_ROLES.DESIGNER,
    SYSTEM_ROLES.ANALYST,
    SYSTEM_ROLES.USER,
    SYSTEM_ROLES.VIEWER,
  ],
  [SYSTEM_ROLES.ADMIN]: [
    SYSTEM_ROLES.MANAGER,
    SYSTEM_ROLES.TEAM_LEAD,
    SYSTEM_ROLES.USER,
    SYSTEM_ROLES.VIEWER,
  ],
  [SYSTEM_ROLES.MANAGER]: [
    SYSTEM_ROLES.TEAM_LEAD,
    SYSTEM_ROLES.USER,
    SYSTEM_ROLES.VIEWER,
  ],
  [SYSTEM_ROLES.TEAM_LEAD]: [
    SYSTEM_ROLES.USER,
    SYSTEM_ROLES.VIEWER,
  ],
  [SYSTEM_ROLES.DEVELOPER]: [SYSTEM_ROLES.USER],
  [SYSTEM_ROLES.DESIGNER]: [SYSTEM_ROLES.USER],
  [SYSTEM_ROLES.ANALYST]: [SYSTEM_ROLES.USER],
  [SYSTEM_ROLES.USER]: [SYSTEM_ROLES.VIEWER],
  [SYSTEM_ROLES.VIEWER]: [],
};

// ============================================
// PERMISSION DEFINITIONS
// ============================================

/**
 * Granular permissions mapped to roles
 * This allows checking specific capabilities rather than just roles
 */
export const PERMISSIONS = {
  // Admin Portal
  ADMIN_ACCESS: 'admin.access',
  ADMIN_MANAGE_USERS: 'admin.manage_users',
  ADMIN_MANAGE_ROLES: 'admin.manage_roles',
  ADMIN_VIEW_AUDIT: 'admin.view_audit',
  ADMIN_MANAGE_SETTINGS: 'admin.manage_settings',

  // Production
  PRODUCTION_VIEW: 'production.view',
  PRODUCTION_CREATE: 'production.create',
  PRODUCTION_EDIT: 'production.edit',
  PRODUCTION_DELETE: 'production.delete',
  PRODUCTION_APPROVE: 'production.approve',

  // Orders
  ORDERS_VIEW: 'orders.view',
  ORDERS_CREATE: 'orders.create',
  ORDERS_EDIT: 'orders.edit',
  ORDERS_DELETE: 'orders.delete',
  ORDERS_APPROVE: 'orders.approve',

  // Finance
  FINANCE_VIEW: 'finance.view',
  FINANCE_EDIT: 'finance.edit',
  FINANCE_APPROVE: 'finance.approve',

  // Users
  USERS_VIEW: 'users.view',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',

  // Analytics
  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_ADVANCED: 'analytics.advanced',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Map roles to their permissions
 */
const ROLE_PERMISSIONS: Record<SystemRole, Permission[]> = {
  [SYSTEM_ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS), // All permissions

  [SYSTEM_ROLES.ADMIN]: [
    PERMISSIONS.ADMIN_ACCESS,
    PERMISSIONS.ADMIN_MANAGE_USERS,
    PERMISSIONS.ADMIN_MANAGE_ROLES,
    PERMISSIONS.ADMIN_VIEW_AUDIT,
    PERMISSIONS.PRODUCTION_VIEW,
    PERMISSIONS.PRODUCTION_CREATE,
    PERMISSIONS.PRODUCTION_EDIT,
    PERMISSIONS.PRODUCTION_APPROVE,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_CREATE,
    PERMISSIONS.ORDERS_EDIT,
    PERMISSIONS.ORDERS_APPROVE,
    PERMISSIONS.FINANCE_VIEW,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_EDIT,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_ADVANCED,
  ],

  [SYSTEM_ROLES.MANAGER]: [
    PERMISSIONS.PRODUCTION_VIEW,
    PERMISSIONS.PRODUCTION_CREATE,
    PERMISSIONS.PRODUCTION_EDIT,
    PERMISSIONS.PRODUCTION_APPROVE,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_CREATE,
    PERMISSIONS.ORDERS_EDIT,
    PERMISSIONS.ORDERS_APPROVE,
    PERMISSIONS.FINANCE_VIEW,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
  ],

  [SYSTEM_ROLES.TEAM_LEAD]: [
    PERMISSIONS.PRODUCTION_VIEW,
    PERMISSIONS.PRODUCTION_CREATE,
    PERMISSIONS.PRODUCTION_EDIT,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_CREATE,
    PERMISSIONS.ORDERS_EDIT,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
  ],

  [SYSTEM_ROLES.DEVELOPER]: [
    PERMISSIONS.PRODUCTION_VIEW,
    PERMISSIONS.PRODUCTION_CREATE,
    PERMISSIONS.PRODUCTION_EDIT,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
  ],

  [SYSTEM_ROLES.DESIGNER]: [
    PERMISSIONS.PRODUCTION_VIEW,
    PERMISSIONS.PRODUCTION_CREATE,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
  ],

  [SYSTEM_ROLES.ANALYST]: [
    PERMISSIONS.PRODUCTION_VIEW,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.FINANCE_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_ADVANCED,
  ],

  [SYSTEM_ROLES.USER]: [
    PERMISSIONS.PRODUCTION_VIEW,
    PERMISSIONS.ORDERS_VIEW,
  ],

  [SYSTEM_ROLES.VIEWER]: [
    PERMISSIONS.PRODUCTION_VIEW,
  ],
};

// ============================================
// CORE RBAC FUNCTIONS
// ============================================

/**
 * Get all roles assigned to a user
 */
export async function getUserRoles(userId: string): Promise<SystemRole[]> {
  const userRoles = await prisma.user_roles.findMany({
    where: { user_id: userId },
    select: { role: true },
  });

  return userRoles.map((ur) => ur.role as SystemRole);
}

/**
 * Get all effective roles for a user (including inherited roles)
 *
 * IMPORTANT: Falls back to user_type field if no roles found in user_roles table.
 * This ensures backward compatibility during RBAC migration period.
 */
export async function getEffectiveRoles(userId: string): Promise<SystemRole[]> {
  let directRoles = await getUserRoles(userId);

  // ⚠️ FALLBACK: If no roles found in user_roles table, derive from user_type
  // This handles migration period where user_roles table might not be populated yet
  if (directRoles.length === 0) {
    console.log(`[RBAC] No roles found for user ${userId}, checking user_type fallback...`);

    const userProfile = await prisma.user_profiles.findUnique({
      where: { id: userId },
      select: { user_type: true, email: true },
    });

    if (userProfile?.user_type) {
      console.log(`[RBAC] User ${userProfile.email} has user_type: ${userProfile.user_type}, deriving role...`);

      // Map user_type to role using standard mapping
      const USER_TYPE_TO_ROLE: Record<string, SystemRole> = {
        'super_admin': SYSTEM_ROLES.SUPER_ADMIN,
        'admin': SYSTEM_ROLES.ADMIN,
        'employee': SYSTEM_ROLES.USER,
        'customer': SYSTEM_ROLES.VIEWER,
        'contractor': SYSTEM_ROLES.USER,
        'designer': SYSTEM_ROLES.DESIGNER,
        'manufacturer': SYSTEM_ROLES.USER,
        'factory': SYSTEM_ROLES.USER,
        'finance': SYSTEM_ROLES.ANALYST,
        'qc_tester': SYSTEM_ROLES.USER,
      };

      const derivedRole = USER_TYPE_TO_ROLE[userProfile.user_type];
      if (derivedRole) {
        console.log(`[RBAC] Derived role: ${derivedRole} from user_type: ${userProfile.user_type}`);
        directRoles = [derivedRole];
      }
    }
  }

  const effectiveRoles = new Set<SystemRole>(directRoles);

  // Add inherited roles
  for (const role of directRoles) {
    const inheritedRoles = ROLE_HIERARCHY[role] || [];
    inheritedRoles.forEach((inherited) => effectiveRoles.add(inherited));
  }

  return Array.from(effectiveRoles);
}

/**
 * Check if user has a specific role (including inherited roles)
 */
export async function hasRole(userId: string, role: SystemRole): Promise<boolean> {
  const effectiveRoles = await getEffectiveRoles(userId);
  return effectiveRoles.includes(role);
}

/**
 * Check if user has ANY of the specified roles
 */
export async function hasAnyRole(userId: string, roles: SystemRole[]): Promise<boolean> {
  const effectiveRoles = await getEffectiveRoles(userId);
  return roles.some((role) => effectiveRoles.includes(role));
}

/**
 * Check if user has ALL of the specified roles
 */
export async function hasAllRoles(userId: string, roles: SystemRole[]): Promise<boolean> {
  const effectiveRoles = await getEffectiveRoles(userId);
  return roles.every((role) => effectiveRoles.includes(role));
}

/**
 * Get all permissions for a user
 * ✅ UPDATED: Now queries database-driven role-permission mappings
 */
export async function getUserPermissions(userId: string): Promise<Permission[]> {
  const effectiveRoles = await getEffectiveRoles(userId);

  // If no roles, return empty
  if (effectiveRoles.length === 0) {
    return [];
  }

  try {
    // Query role_definitions to get role IDs for the user's roles
    const roleDefinitions = await prisma.role_definitions.findMany({
      where: {
        role_key: { in: effectiveRoles },
        is_active: true,
      },
      select: { id: true },
    });

    const roleIds = roleDefinitions.map(r => r.id);

    if (roleIds.length === 0) {
      // Fallback to hardcoded mappings if roles not in database yet
      console.warn(`[RBAC] No database roles found for ${effectiveRoles.join(', ')}, using hardcoded mappings`);
      const permissions = new Set<Permission>();
      for (const role of effectiveRoles) {
        const rolePermissions = ROLE_PERMISSIONS[role] || [];
        rolePermissions.forEach((perm) => permissions.add(perm));
      }
      return Array.from(permissions);
    }

    // Query role_permissions to get all permission IDs
    const rolePermissions = await prisma.role_permissions.findMany({
      where: {
        role_id: { in: roleIds },
        is_active: true,
      },
      include: {
        permission: {
          select: {
            permission_key: true,
          },
        },
      },
    });

    // Extract unique permission keys
    const permissionKeys = new Set<Permission>();
    rolePermissions.forEach(rp => {
      permissionKeys.add(rp.permission.permission_key as Permission);
    });

    return Array.from(permissionKeys);
  } catch (error) {
    console.error('[RBAC] Error querying database permissions:', error);
    // Fallback to hardcoded mappings on error
    const permissions = new Set<Permission>();
    for (const role of effectiveRoles) {
      const rolePermissions = ROLE_PERMISSIONS[role] || [];
      rolePermissions.forEach((perm) => permissions.add(perm));
    }
    return Array.from(permissions);
  }
}

/**
 * Check if user has a specific permission
 *
 * Phase 2: Now supports scoped permissions for resource-level access control.
 * Logs permission denials to audit trail for security monitoring.
 */
export async function hasPermission(userId: string, permission: Permission, options?: {
  resource?: {
    type: string;
    id?: string;
    metadata?: Record<string, any>;
  };
  action?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<boolean> {
  // Step 1: Check role-based permission (Phase 1)
  const [permissions, roles] = await Promise.all([
    getUserPermissions(userId),
    getUserRoles(userId),
  ]);

  const hasRolePermission = permissions.includes(permission);

  if (hasRolePermission) {
    // User has global access via role
    return true;
  }

  // Step 2: Check scoped permission (Phase 2)
  if (options?.resource) {
    const hasScopedAccess = await checkScopedPermission(
      userId,
      permission,
      options.resource
    );

    if (hasScopedAccess) {
      // User has scoped access to this specific resource
      return true;
    }
  }

  // Step 3: Log permission denial for audit trail
  await logPermissionDenial({
    userId,
    requiredPermission: permission,
    resource: options?.resource?.type || 'system',
    action: options?.action || 'access',
    userRoles: roles,
    userPermissions: permissions,
    ipAddress: options?.ipAddress,
    userAgent: options?.userAgent,
  });

  return false;
}

/**
 * Check if user has ANY of the specified permissions
 */
export async function hasAnyPermission(userId: string, permissions: Permission[]): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId);
  return permissions.some((perm) => userPermissions.includes(perm));
}

/**
 * Check if user has ALL of the specified permissions
 */
export async function hasAllPermissions(userId: string, permissions: Permission[]): Promise<boolean> {
  const userPermissions = await getUserPermissions(userId);
  return permissions.every((perm) => userPermissions.includes(perm));
}

// ============================================
// SCOPED PERMISSIONS (Phase 2)
// ============================================

/**
 * Helper function to check if resource metadata matches scope metadata
 */
function matchesMetadata(
  resourceMeta: Record<string, any>,
  scopeMeta: Record<string, any>
): boolean {
  for (const [key, value] of Object.entries(scopeMeta)) {
    if (Array.isArray(value)) {
      // If scope value is array, resource value must be in array
      if (!value.includes(resourceMeta[key])) {
        return false;
      }
    } else {
      // Exact match required
      if (resourceMeta[key] !== value) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Check if user has scoped permission for specific resource
 *
 * This allows resource-level access control beyond role-based permissions.
 * Example: Customer can view THEIR orders, but not all orders.
 */
export async function checkScopedPermission(
  userId: string,
  permission: Permission,
  resource: {
    type: string;
    id?: string;
    metadata?: Record<string, any>;
  }
): Promise<boolean> {
  const now = new Date();

  try {
    const scopes = await prisma.permission_scopes.findMany({
      where: {
        user_id: userId,
        permission_key: permission,
        resource_type: resource.type,
        is_active: true,
        OR: [
          { expires_at: null },
          { expires_at: { gt: now } },
        ],
      },
    });

    if (scopes.length === 0) {
      return false;
    }

    // Check if any scope matches the resource
    for (const scope of scopes) {
      // If scope has no resource_id, it grants access to all resources of this type
      if (!scope.resource_id) {
        // Check metadata constraints if provided
        if (scope.scope_metadata && resource.metadata) {
          if (matchesMetadata(resource.metadata, scope.scope_metadata as Record<string, any>)) {
            return true;
          }
        } else {
          return true;
        }
      }

      // If scope has resource_id, it must match
      if (scope.resource_id === resource.id) {
        // Check metadata constraints if provided
        if (scope.scope_metadata && resource.metadata) {
          if (matchesMetadata(resource.metadata, scope.scope_metadata as Record<string, any>)) {
            return true;
          }
        } else {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error('[RBAC] Error checking scoped permission:', error);
    return false;
  }
}

// ============================================
// ROLE ASSIGNMENT FUNCTIONS
// ============================================

/**
 * Assign a role to a user
 *
 * Logs role changes to audit trail for compliance.
 */
export async function assignRole(userId: string, role: SystemRole, options?: {
  performedBy?: string;
  performedByEmail?: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  // Get current roles before change
  const oldRoles = await getUserRoles(userId);

  // Check if role already assigned
  const existing = await prisma.user_roles.findFirst({
    where: {
      user_id: userId,
      role: role,
    },
  });

  if (existing) {
    throw new Error(`User already has role: ${role}`);
  }

  await prisma.user_roles.create({
    data: {
      user_id: userId,
      role: role,
    },
  });

  // Get new roles after change
  const newRoles = [...oldRoles, role];

  // Log role change
  await logRoleChange({
    targetUserId: userId,
    performedBy: options?.performedBy || userId,
    performedByEmail: options?.performedByEmail,
    oldRoles,
    newRoles,
    reason: options?.reason || `Assigned role: ${role}`,
    ipAddress: options?.ipAddress,
    userAgent: options?.userAgent,
  });
}

/**
 * Remove a role from a user
 *
 * Logs role changes to audit trail for compliance.
 */
export async function removeRole(userId: string, role: SystemRole, options?: {
  performedBy?: string;
  performedByEmail?: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  // Get current roles before change
  const oldRoles = await getUserRoles(userId);

  await prisma.user_roles.deleteMany({
    where: {
      user_id: userId,
      role: role,
    },
  });

  // Get new roles after change
  const newRoles = oldRoles.filter((r) => r !== role);

  // Log role change
  await logRoleChange({
    targetUserId: userId,
    performedBy: options?.performedBy || userId,
    performedByEmail: options?.performedByEmail,
    oldRoles,
    newRoles,
    reason: options?.reason || `Removed role: ${role}`,
    ipAddress: options?.ipAddress,
    userAgent: options?.userAgent,
  });
}

/**
 * Set user's roles (replaces all existing roles)
 *
 * Logs role changes to audit trail for compliance.
 */
export async function setUserRoles(userId: string, roles: SystemRole[], options?: {
  performedBy?: string;
  performedByEmail?: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  // Get current roles before change
  const oldRoles = await getUserRoles(userId);

  await prisma.$transaction(async (tx) => {
    // Remove all existing roles
    await tx.user_roles.deleteMany({
      where: { user_id: userId },
    });

    // Add new roles
    if (roles.length > 0) {
      await tx.user_roles.createMany({
        data: roles.map((role) => ({
          user_id: userId,
          role: role,
        })),
      });
    }
  });

  // Log role change
  await logRoleChange({
    targetUserId: userId,
    performedBy: options?.performedBy || userId,
    performedByEmail: options?.performedByEmail,
    oldRoles,
    newRoles: roles,
    reason: options?.reason || `Updated roles: ${oldRoles.join(', ')} → ${roles.join(', ')}`,
    ipAddress: options?.ipAddress,
    userAgent: options?.userAgent,
  });
}

// ============================================
// MIGRATION HELPERS
// ============================================

/**
 * Get user_type from user_profiles (for migration/fallback)
 */
export async function getUserType(userId: string): Promise<UserType | null> {
  const profile = await prisma.user_profiles.findUnique({
    where: { id: userId },
    select: { user_type: true },
  });

  return profile?.user_type as UserType | null;
}

/**
 * Migrate user_type to user_roles
 * Converts the old user_type field to appropriate role assignments
 */
export async function migrateUserTypeToRoles(userId: string): Promise<void> {
  const userType = await getUserType(userId);
  if (!userType) return;

  const rolesToAssign: SystemRole[] = [];

  // Map user_type to appropriate roles
  switch (userType) {
    case 'super_admin':
      rolesToAssign.push(SYSTEM_ROLES.SUPER_ADMIN);
      break;
    case 'employee':
      rolesToAssign.push(SYSTEM_ROLES.USER);
      break;
    case 'customer':
      rolesToAssign.push(SYSTEM_ROLES.VIEWER);
      break;
    case 'contractor':
      rolesToAssign.push(SYSTEM_ROLES.USER);
      break;
    case 'designer':
      rolesToAssign.push(SYSTEM_ROLES.DESIGNER);
      break;
    case 'manufacturer':
    case 'factory':
      rolesToAssign.push(SYSTEM_ROLES.USER);
      break;
    case 'finance':
      rolesToAssign.push(SYSTEM_ROLES.ANALYST);
      break;
    case 'qc_tester':
      rolesToAssign.push(SYSTEM_ROLES.USER);
      break;
  }

  // Assign roles (skip if already assigned)
  for (const role of rolesToAssign) {
    try {
      await assignRole(userId, role);
    } catch (error) {
      // Ignore if role already assigned
      console.log(`Role ${role} already assigned to user ${userId}`);
    }
  }
}

// ============================================
// CACHING
// ============================================

/**
 * In-memory cache for role/permission checks
 * Production: Use Redis for distributed caching
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const roleCache = new Map<string, CacheEntry<SystemRole[]>>();
const permissionCache = new Map<string, CacheEntry<Permission[]>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get user roles with caching
 */
export async function getUserRolesWithCache(userId: string): Promise<SystemRole[]> {
  const cached = roleCache.get(userId);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const roles = await getEffectiveRoles(userId);
  roleCache.set(userId, { data: roles, timestamp: now });

  return roles;
}

/**
 * Get user permissions with caching
 */
export async function getUserPermissionsWithCache(userId: string): Promise<Permission[]> {
  const cached = permissionCache.get(userId);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const permissions = await getUserPermissions(userId);
  permissionCache.set(userId, { data: permissions, timestamp: now });

  return permissions;
}

/**
 * Clear cache for a user (call when roles change)
 */
export function clearUserCache(userId: string): void {
  roleCache.delete(userId);
  permissionCache.delete(userId);
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  roleCache.clear();
  permissionCache.clear();
}

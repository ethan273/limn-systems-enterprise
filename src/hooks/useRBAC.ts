/**
 * React Hooks for RBAC
 *
 * Easy-to-use hooks for checking permissions in React components
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { SystemRole, Permission } from '@/lib/services/rbac-types';
import { SYSTEM_ROLES, PERMISSIONS } from '@/lib/services/rbac-types';

/**
 * Get current user's roles
 *
 * @example
 * const { roles, isLoading } = useUserRoles();
 * if (roles.includes('admin')) { ... }
 */
export function useUserRoles() {
  const { data: currentUser } = api.userProfile.getCurrentUser.useQuery();
  // Type assertion needed: tRPC infers 'never' type due to circular dependency
  // Safe to use 'any' here as getCurrentUser always returns { id: string, ... }
  const userId = (currentUser as any)?.id as string | undefined;

  const { data: roles = [], isLoading, error } = useQuery({
    queryKey: ['user-roles', userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await fetch(`/api/rbac/roles?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch roles');
      const data = await response.json();
      return data.roles as SystemRole[];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    roles,
    isLoading,
    error,
    hasRole: (role: SystemRole) => roles.includes(role),
    hasAnyRole: (checkRoles: SystemRole[]) => checkRoles.some(r => roles.includes(r)),
    hasAllRoles: (checkRoles: SystemRole[]) => checkRoles.every(r => roles.includes(r)),
  };
}

/**
 * Get current user's permissions
 *
 * @example
 * const { permissions, hasPermission } = useUserPermissions();
 * if (hasPermission(PERMISSIONS.ADMIN_ACCESS)) { ... }
 */
export function useUserPermissions() {
  const { data: currentUser } = api.userProfile.getCurrentUser.useQuery();
  // Type assertion needed: tRPC infers 'never' type due to circular dependency
  // Safe to use 'any' here as getCurrentUser always returns { id: string, ... }
  const userId = (currentUser as any)?.id as string | undefined;

  const { data: permissions = [], isLoading, error } = useQuery({
    queryKey: ['user-permissions', userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await fetch(`/api/rbac/permissions?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch permissions');
      const data = await response.json();
      return data.permissions as Permission[];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    permissions,
    isLoading,
    error,
    hasPermission: (permission: Permission) => permissions.includes(permission),
    hasAnyPermission: (checkPerms: Permission[]) => checkPerms.some(p => permissions.includes(p)),
    hasAllPermissions: (checkPerms: Permission[]) => checkPerms.every(p => permissions.includes(p)),
  };
}

/**
 * Check if user has specific role
 *
 * @example
 * const isAdmin = useHasRole(SYSTEM_ROLES.ADMIN);
 * if (isAdmin) { ... }
 */
export function useHasRole(role: SystemRole): boolean {
  const { roles } = useUserRoles();
  return roles.includes(role);
}

/**
 * Check if user has specific permission
 *
 * @example
 * const canManageUsers = useHasPermission(PERMISSIONS.ADMIN_MANAGE_USERS);
 * if (canManageUsers) { ... }
 */
export function useHasPermission(permission: Permission): boolean {
  const { permissions } = useUserPermissions();
  return permissions.includes(permission);
}

/**
 * Check if user is admin (has super_admin or admin role)
 *
 * @example
 * const isAdmin = useIsAdmin();
 * if (isAdmin) { ... }
 */
export function useIsAdmin(): boolean {
  const { roles } = useUserRoles();
  return roles.includes(SYSTEM_ROLES.SUPER_ADMIN) || roles.includes(SYSTEM_ROLES.ADMIN);
}

/**
 * Check if user is super admin
 *
 * @example
 * const isSuperAdmin = useIsSuperAdmin();
 * if (isSuperAdmin) { ... }
 */
export function useIsSuperAdmin(): boolean {
  const { roles } = useUserRoles();
  return roles.includes(SYSTEM_ROLES.SUPER_ADMIN);
}

// Export constants for use in components
export { SYSTEM_ROLES, PERMISSIONS };

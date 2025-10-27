/**
 * Permission Gate Components
 *
 * Conditionally render UI elements based on user roles and permissions
 *
 * @example
 * <RequireRole role={SYSTEM_ROLES.ADMIN}>
 *   <AdminPanel />
 * </RequireRole>
 *
 * @example
 * <RequirePermission permission={PERMISSIONS.ADMIN_MANAGE_USERS}>
 *   <UserManagementButton />
 * </RequirePermission>
 */

'use client';

import { ReactNode } from 'react';
import { useUserRoles, useUserPermissions } from '@/hooks/useRBAC';
import type { SystemRole, Permission } from '@/lib/services/rbac-service';

interface PermissionGateProps {
  children: ReactNode;
  fallback?: ReactNode;
  loading?: ReactNode;
}

// ============================================
// ROLE-BASED GATES
// ============================================

/**
 * Require specific role
 *
 * @example
 * <RequireRole role={SYSTEM_ROLES.ADMIN}>
 *   <AdminPanel />
 * </RequireRole>
 */
interface RequireRoleProps extends PermissionGateProps {
  role: SystemRole;
}

export function RequireRole({ role, children, fallback = null, loading = null }: RequireRoleProps) {
  const { roles, isLoading } = useUserRoles();

  if (isLoading) return <>{loading}</>;
  if (!roles.includes(role)) return <>{fallback}</>;

  return <>{children}</>;
}

/**
 * Require ANY of the specified roles
 *
 * @example
 * <RequireAnyRole roles={[SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.MANAGER]}>
 *   <ManagementPanel />
 * </RequireAnyRole>
 */
interface RequireAnyRoleProps extends PermissionGateProps {
  roles: SystemRole[];
}

export function RequireAnyRole({ roles, children, fallback = null, loading = null }: RequireAnyRoleProps) {
  const { roles: userRoles, isLoading } = useUserRoles();

  if (isLoading) return <>{loading}</>;
  if (!roles.some(role => userRoles.includes(role))) return <>{fallback}</>;

  return <>{children}</>;
}

/**
 * Require ALL of the specified roles
 *
 * @example
 * <RequireAllRoles roles={[SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.DEVELOPER]}>
 *   <AdvancedSettings />
 * </RequireAllRoles>
 */
interface RequireAllRolesProps extends PermissionGateProps {
  roles: SystemRole[];
}

export function RequireAllRoles({ roles, children, fallback = null, loading = null }: RequireAllRolesProps) {
  const { roles: userRoles, isLoading } = useUserRoles();

  if (isLoading) return <>{loading}</>;
  if (!roles.every(role => userRoles.includes(role))) return <>{fallback}</>;

  return <>{children}</>;
}

// ============================================
// PERMISSION-BASED GATES
// ============================================

/**
 * Require specific permission
 *
 * @example
 * <RequirePermission permission={PERMISSIONS.ADMIN_MANAGE_USERS}>
 *   <UserManagementButton />
 * </RequirePermission>
 */
interface RequirePermissionProps extends PermissionGateProps {
  permission: Permission;
}

export function RequirePermission({ permission, children, fallback = null, loading = null }: RequirePermissionProps) {
  const { permissions, isLoading } = useUserPermissions();

  if (isLoading) return <>{loading}</>;
  if (!permissions.includes(permission)) return <>{fallback}</>;

  return <>{children}</>;
}

/**
 * Require ANY of the specified permissions
 *
 * @example
 * <RequireAnyPermission permissions={[PERMISSIONS.PRODUCTION_EDIT, PERMISSIONS.PRODUCTION_APPROVE]}>
 *   <ProductionActions />
 * </RequireAnyPermission>
 */
interface RequireAnyPermissionProps extends PermissionGateProps {
  permissions: Permission[];
}

export function RequireAnyPermission({ permissions, children, fallback = null, loading = null }: RequireAnyPermissionProps) {
  const { permissions: userPermissions, isLoading } = useUserPermissions();

  if (isLoading) return <>{loading}</>;
  if (!permissions.some(perm => userPermissions.includes(perm))) return <>{fallback}</>;

  return <>{children}</>;
}

/**
 * Require ALL of the specified permissions
 *
 * @example
 * <RequireAllPermissions permissions={[PERMISSIONS.FINANCE_VIEW, PERMISSIONS.FINANCE_APPROVE]}>
 *   <FinanceApprovalButton />
 * </RequireAllPermissions>
 */
interface RequireAllPermissionsProps extends PermissionGateProps {
  permissions: Permission[];
}

export function RequireAllPermissions({ permissions, children, fallback = null, loading = null }: RequireAllPermissionsProps) {
  const { permissions: userPermissions, isLoading } = useUserPermissions();

  if (isLoading) return <>{loading}</>;
  if (!permissions.every(perm => userPermissions.includes(perm))) return <>{fallback}</>;

  return <>{children}</>;
}

// ============================================
// CONVENIENCE GATES
// ============================================

/**
 * Require admin role (super_admin or admin)
 *
 * @example
 * <RequireAdmin>
 *   <AdminPanel />
 * </RequireAdmin>
 */
export function RequireAdmin({ children, fallback = null, loading = null }: PermissionGateProps) {
  return (
    <RequireAnyRole
      roles={['super_admin', 'admin']}
      fallback={fallback}
      loading={loading}
    >
      {children}
    </RequireAnyRole>
  );
}

/**
 * Require super admin role only
 *
 * @example
 * <RequireSuperAdmin>
 *   <SystemSettings />
 * </RequireSuperAdmin>
 */
export function RequireSuperAdmin({ children, fallback = null, loading = null }: PermissionGateProps) {
  return (
    <RequireRole
      role={'super_admin'}
      fallback={fallback}
      loading={loading}
    >
      {children}
    </RequireRole>
  );
}

/**
 * Show content ONLY to non-admins
 *
 * @example
 * <HideFromAdmin>
 *   <UserGuidePrompt />
 * </HideFromAdmin>
 */
export function HideFromAdmin({ children }: { children: ReactNode }) {
  const { roles } = useUserRoles();
  const isAdmin = roles.includes('super_admin') || roles.includes('admin');

  if (isAdmin) return null;
  return <>{children}</>;
}

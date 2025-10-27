/**
 * RBAC Types and Constants
 *
 * Shared types and constants for Role-Based Access Control.
 * This file contains NO server-side code and can be imported by client components.
 *
 * @see rbac-service.ts for server-side RBAC implementation
 */

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
// PERMISSION DEFINITIONS
// ============================================

/**
 * All available permissions in the system
 * Permissions are checked via hasPermission()
 *
 * Permissions are derived from roles, not directly assigned
 * See getRolePermissions() for role-to-permission mapping
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

// ============================================
// ROLE HIERARCHIES
// ============================================

/**
 * Role hierarchy - higher roles inherit permissions from lower roles
 * Used for efficient permission checking
 */
export const ROLE_HIERARCHY: Record<SystemRole, number> = {
  [SYSTEM_ROLES.SUPER_ADMIN]: 9,
  [SYSTEM_ROLES.ADMIN]: 8,
  [SYSTEM_ROLES.MANAGER]: 7,
  [SYSTEM_ROLES.TEAM_LEAD]: 6,
  [SYSTEM_ROLES.DEVELOPER]: 5,
  [SYSTEM_ROLES.DESIGNER]: 4,
  [SYSTEM_ROLES.ANALYST]: 3,
  [SYSTEM_ROLES.USER]: 2,
  [SYSTEM_ROLES.VIEWER]: 1,
};

/**
 * Check if one role is higher than another
 */
export function isHigherRole(roleA: SystemRole, roleB: SystemRole): boolean {
  return ROLE_HIERARCHY[roleA] > ROLE_HIERARCHY[roleB];
}

/**
 * Get the highest role from a list of roles
 */
export function getHighestRole(roles: SystemRole[]): SystemRole | null {
  if (roles.length === 0) return null;
  return roles.reduce((highest, current) =>
    isHigherRole(current, highest) ? current : highest
  );
}

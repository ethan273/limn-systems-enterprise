/**
 * RBAC (Role-Based Access Control) tRPC Router
 *
 * Provides procedures for managing user roles and permissions.
 * All role management operations are restricted to admins/super admins.
 *
 * Features:
 * - View user roles and permissions
 * - Assign/remove roles (admin only)
 * - Batch role operations (super admin only)
 * - Role audit logging
 * - Permission checking utilities
 *
 * @see /limn-systems-enterprise-docs/07-DEVELOPMENT-GUIDES/RBAC-SYSTEM.md
 */

import { z } from 'zod';
import { createTRPCRouter, adminProcedure, superAdminProcedure, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';
import {
  getUserRoles,
  getEffectiveRoles,
  getUserPermissions,
  assignRole,
  removeRole,
  setUserRoles,
  hasRole,
  hasAnyRole,
  hasAllRoles,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  SYSTEM_ROLES,
  PERMISSIONS,
  type SystemRole,
  type Permission,
} from '@/lib/services/rbac-service';

// ============================================
// INPUT SCHEMAS
// ============================================

const userIdSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
});

const assignRoleSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  role: z.enum([
    SYSTEM_ROLES.SUPER_ADMIN,
    SYSTEM_ROLES.ADMIN,
    SYSTEM_ROLES.MANAGER,
    SYSTEM_ROLES.TEAM_LEAD,
    SYSTEM_ROLES.DEVELOPER,
    SYSTEM_ROLES.DESIGNER,
    SYSTEM_ROLES.ANALYST,
    SYSTEM_ROLES.USER,
    SYSTEM_ROLES.VIEWER,
  ] as const),
  reason: z.string().optional(),
});

const removeRoleSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  role: z.string(),
  reason: z.string().optional(),
});

const setUserRolesSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  roles: z.array(z.string()),
  reason: z.string().optional(),
});

const roleFilterSchema = z.object({
  role: z.string(),
});

const batchAssignSchema = z.object({
  operations: z.array(
    z.object({
      userId: z.string().uuid(),
      role: z.string(),
    })
  ),
  reason: z.string().optional(),
});

const auditLogSchema = z.object({
  userId: z.string().uuid().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

// ============================================
// RBAC ROUTER
// ============================================

export const rbacRouter = createTRPCRouter({
  /**
   * Get all roles assigned to a user
   * Accessible by authenticated users (can view own roles) and admins (can view any user's roles)
   */
  getUserRoles: protectedProcedure
    .input(userIdSchema)
    .query(async ({ input, ctx }) => {
      const requestingUserId = ctx.session?.user?.id;

      // Users can view their own roles, admins can view any user's roles
      if (requestingUserId !== input.userId) {
        // Check if requesting user is admin
        const userProfile = await ctx.db.user_profiles.findUnique({
          where: { id: requestingUserId! },
          select: { id: true },
        });

        if (!userProfile) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User profile not found',
          });
        }

        const effectiveRoles = await getEffectiveRoles(userProfile.id);
        const isAdmin = effectiveRoles.includes(SYSTEM_ROLES.ADMIN) ||
                        effectiveRoles.includes(SYSTEM_ROLES.SUPER_ADMIN);

        if (!isAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only view your own roles',
          });
        }
      }

      const [directRoles, effectiveRoles, permissions] = await Promise.all([
        getUserRoles(input.userId),
        getEffectiveRoles(input.userId),
        getUserPermissions(input.userId),
      ]);

      return {
        userId: input.userId,
        directRoles,
        effectiveRoles,
        permissions,
      };
    }),

  /**
   * Get effective roles for a user (includes inherited roles)
   * Accessible by authenticated users (own roles) and admins
   */
  getEffectiveRoles: protectedProcedure
    .input(userIdSchema)
    .query(async ({ input, ctx }) => {
      const requestingUserId = ctx.session?.user?.id;

      // Users can view their own roles, admins can view any user's roles
      if (requestingUserId !== input.userId) {
        const userProfile = await ctx.db.user_profiles.findUnique({
          where: { id: requestingUserId! },
          select: { id: true },
        });

        if (!userProfile) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User profile not found',
          });
        }

        const effectiveRoles = await getEffectiveRoles(userProfile.id);
        const isAdmin = effectiveRoles.includes(SYSTEM_ROLES.ADMIN) ||
                        effectiveRoles.includes(SYSTEM_ROLES.SUPER_ADMIN);

        if (!isAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only view your own roles',
          });
        }
      }

      const effectiveRoles = await getEffectiveRoles(input.userId);
      return { userId: input.userId, roles: effectiveRoles };
    }),

  /**
   * Get all permissions for a user
   * Accessible by authenticated users (own permissions) and admins
   */
  getUserPermissions: protectedProcedure
    .input(userIdSchema)
    .query(async ({ input, ctx }) => {
      const requestingUserId = ctx.session?.user?.id;

      // Users can view their own permissions, admins can view any user's permissions
      if (requestingUserId !== input.userId) {
        const userProfile = await ctx.db.user_profiles.findUnique({
          where: { id: requestingUserId! },
          select: { id: true },
        });

        if (!userProfile) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User profile not found',
          });
        }

        const effectiveRoles = await getEffectiveRoles(userProfile.id);
        const isAdmin = effectiveRoles.includes(SYSTEM_ROLES.ADMIN) ||
                        effectiveRoles.includes(SYSTEM_ROLES.SUPER_ADMIN);

        if (!isAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only view your own permissions',
          });
        }
      }

      const permissions = await getUserPermissions(input.userId);
      return { userId: input.userId, permissions };
    }),

  /**
   * Assign a role to a user
   * Restricted to admins only
   */
  assignRole: adminProcedure
    .input(assignRoleSchema)
    .mutation(async ({ input, ctx }) => {
      const performedBy = ctx.session?.user?.id;
      const performedByProfile = await ctx.db.user_profiles.findUnique({
        where: { id: performedBy },
        select: { email: true, full_name: true },
      });

      // Get IP and User Agent
      const ipAddress = ctx.req?.headers?.['x-forwarded-for']?.toString().split(',')[0] ||
                        ctx.req?.headers?.['x-real-ip']?.toString() ||
                        'unknown';
      const userAgent = ctx.req?.headers?.['user-agent'] || 'unknown';

      try {
        await assignRole(input.userId, input.role as SystemRole, {
          performedBy,
          performedByEmail: performedByProfile?.email || undefined,
          reason: input.reason || `Role assigned by ${performedByProfile?.full_name || 'admin'}`,
          ipAddress,
          userAgent,
        });

        // Fetch updated user info
        const userProfile = await ctx.db.user_profiles.findUnique({
          where: { id: input.userId },
          select: { full_name: true, email: true },
        });

        console.log(
          `[RBAC] Role "${input.role}" assigned to user ${userProfile?.email || input.userId} by ${performedByProfile?.email || performedBy}`
        );

        return {
          success: true,
          message: `Role "${input.role}" successfully assigned to ${userProfile?.full_name || 'user'}`,
        };
      } catch (error) {
        console.error('[RBAC] Failed to assign role:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to assign role',
        });
      }
    }),

  /**
   * Remove a role from a user
   * Restricted to admins only
   */
  removeRole: adminProcedure
    .input(removeRoleSchema)
    .mutation(async ({ input, ctx }) => {
      const performedBy = ctx.session?.user?.id;
      const performedByProfile = await ctx.db.user_profiles.findUnique({
        where: { id: performedBy },
        select: { email: true, full_name: true },
      });

      // Get IP and User Agent
      const ipAddress = ctx.req?.headers?.['x-forwarded-for']?.toString().split(',')[0] ||
                        ctx.req?.headers?.['x-real-ip']?.toString() ||
                        'unknown';
      const userAgent = ctx.req?.headers?.['user-agent'] || 'unknown';

      try {
        await removeRole(input.userId, input.role as SystemRole, {
          performedBy,
          performedByEmail: performedByProfile?.email || undefined,
          reason: input.reason || `Role removed by ${performedByProfile?.full_name || 'admin'}`,
          ipAddress,
          userAgent,
        });

        // Fetch updated user info
        const userProfile = await ctx.db.user_profiles.findUnique({
          where: { id: input.userId },
          select: { full_name: true, email: true },
        });

        console.log(
          `[RBAC] Role "${input.role}" removed from user ${userProfile?.email || input.userId} by ${performedByProfile?.email || performedBy}`
        );

        return {
          success: true,
          message: `Role "${input.role}" successfully removed from ${userProfile?.full_name || 'user'}`,
        };
      } catch (error) {
        console.error('[RBAC] Failed to remove role:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to remove role',
        });
      }
    }),

  /**
   * Set user's roles (replaces all existing roles)
   * Restricted to super admins only
   */
  setUserRoles: superAdminProcedure
    .input(setUserRolesSchema)
    .mutation(async ({ input, ctx }) => {
      const performedBy = ctx.session?.user?.id;
      const performedByProfile = await ctx.db.user_profiles.findUnique({
        where: { id: performedBy },
        select: { email: true, full_name: true },
      });

      // Get IP and User Agent
      const ipAddress = ctx.req?.headers?.['x-forwarded-for']?.toString().split(',')[0] ||
                        ctx.req?.headers?.['x-real-ip']?.toString() ||
                        'unknown';
      const userAgent = ctx.req?.headers?.['user-agent'] || 'unknown';

      try {
        await setUserRoles(input.userId, input.roles as SystemRole[], {
          performedBy,
          performedByEmail: performedByProfile?.email || undefined,
          reason: input.reason || `Roles updated by ${performedByProfile?.full_name || 'super admin'}`,
          ipAddress,
          userAgent,
        });

        // Fetch updated user info
        const userProfile = await ctx.db.user_profiles.findUnique({
          where: { id: input.userId },
          select: { full_name: true, email: true },
        });

        console.log(
          `[RBAC] Roles set to [${input.roles.join(', ')}] for user ${userProfile?.email || input.userId} by ${performedByProfile?.email || performedBy}`
        );

        return {
          success: true,
          message: `Roles successfully updated for ${userProfile?.full_name || 'user'}`,
          roles: input.roles,
        };
      } catch (error) {
        console.error('[RBAC] Failed to set user roles:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to set user roles',
        });
      }
    }),

  /**
   * Get all available system roles
   * Accessible by all authenticated users
   */
  getAllRoles: protectedProcedure.query(async () => {
    return {
      roles: Object.values(SYSTEM_ROLES),
      roleDescriptions: {
        [SYSTEM_ROLES.SUPER_ADMIN]: 'Full system access with all permissions',
        [SYSTEM_ROLES.ADMIN]: 'Administrative access to manage users and settings',
        [SYSTEM_ROLES.MANAGER]: 'Manage production, orders, and team operations',
        [SYSTEM_ROLES.TEAM_LEAD]: 'Lead teams and approve work within scope',
        [SYSTEM_ROLES.DEVELOPER]: 'Development and technical operations access',
        [SYSTEM_ROLES.DESIGNER]: 'Design and creative work access',
        [SYSTEM_ROLES.ANALYST]: 'Analytics and reporting access',
        [SYSTEM_ROLES.USER]: 'Standard user access to view and create content',
        [SYSTEM_ROLES.VIEWER]: 'Read-only access to production data',
      },
    };
  }),

  /**
   * Get all available permissions
   * Accessible by admins only
   */
  getAllPermissions: adminProcedure.query(async () => {
    return {
      permissions: Object.values(PERMISSIONS),
      permissionDescriptions: {
        // Admin permissions
        [PERMISSIONS.ADMIN_ACCESS]: 'Access to admin portal',
        [PERMISSIONS.ADMIN_MANAGE_USERS]: 'Manage user accounts and profiles',
        [PERMISSIONS.ADMIN_MANAGE_ROLES]: 'Assign and remove user roles',
        [PERMISSIONS.ADMIN_VIEW_AUDIT]: 'View audit logs and security events',
        [PERMISSIONS.ADMIN_MANAGE_SETTINGS]: 'Manage system settings',

        // Production permissions
        [PERMISSIONS.PRODUCTION_VIEW]: 'View production data',
        [PERMISSIONS.PRODUCTION_CREATE]: 'Create production orders',
        [PERMISSIONS.PRODUCTION_EDIT]: 'Edit production orders',
        [PERMISSIONS.PRODUCTION_DELETE]: 'Delete production orders',
        [PERMISSIONS.PRODUCTION_APPROVE]: 'Approve production orders',

        // Order permissions
        [PERMISSIONS.ORDERS_VIEW]: 'View orders',
        [PERMISSIONS.ORDERS_CREATE]: 'Create new orders',
        [PERMISSIONS.ORDERS_EDIT]: 'Edit existing orders',
        [PERMISSIONS.ORDERS_DELETE]: 'Delete orders',
        [PERMISSIONS.ORDERS_APPROVE]: 'Approve orders',

        // Finance permissions
        [PERMISSIONS.FINANCE_VIEW]: 'View financial data',
        [PERMISSIONS.FINANCE_EDIT]: 'Edit financial records',
        [PERMISSIONS.FINANCE_APPROVE]: 'Approve financial transactions',

        // User permissions
        [PERMISSIONS.USERS_VIEW]: 'View user list',
        [PERMISSIONS.USERS_EDIT]: 'Edit user profiles',
        [PERMISSIONS.USERS_DELETE]: 'Delete user accounts',

        // Analytics permissions
        [PERMISSIONS.ANALYTICS_VIEW]: 'View basic analytics',
        [PERMISSIONS.ANALYTICS_ADVANCED]: 'Access advanced analytics',
      },
    };
  }),

  /**
   * Get audit log of role changes
   * Restricted to admins only
   */
  getRoleAuditLog: adminProcedure
    .input(auditLogSchema)
    .query(async ({ input, ctx }) => {
      const whereClause = input.userId
        ? { target_user_id: input.userId }
        : {};

      const [logs, totalCount] = await Promise.all([
        ctx.db.admin_security_events.findMany({
          where: {
            ...whereClause,
            event_type: 'role_change',
          },
          orderBy: { created_at: 'desc' },
          take: input.limit,
          skip: input.offset,
          select: {
            id: true,
            event_type: true,
            target_user_id: true,
            performed_by_user_id: true,
            performed_by_email: true,
            metadata: true,
            created_at: true,
          },
        }),
        ctx.db.admin_security_events.count({
          where: {
            ...whereClause,
            event_type: 'role_change',
          },
        }),
      ]);

      // Fetch user profiles for display
      const userIds = [
        ...logs.map((log) => log.target_user_id).filter(Boolean),
        ...logs.map((log) => log.performed_by_user_id).filter(Boolean),
      ] as string[];

      const uniqueUserIds = Array.from(new Set(userIds));
      const userProfiles = await ctx.db.user_profiles.findMany({
        where: { id: { in: uniqueUserIds } },
        select: { id: true, full_name: true, email: true },
      });

      const userProfileMap = new Map(
        userProfiles.map((profile) => [profile.id, profile])
      );

      // Enrich logs with user information
      const enrichedLogs = logs.map((log) => ({
        ...log,
        targetUser: log.target_user_id
          ? userProfileMap.get(log.target_user_id)
          : null,
        performedByUser: log.performed_by_user_id
          ? userProfileMap.get(log.performed_by_user_id)
          : null,
      }));

      return {
        logs: enrichedLogs,
        totalCount,
        hasMore: input.offset + input.limit < totalCount,
      };
    }),

  /**
   * Get all users with a specific role
   * Restricted to admins only
   */
  getUsersByRole: adminProcedure
    .input(roleFilterSchema)
    .query(async ({ input, ctx }) => {
      const userRoles = await ctx.db.user_roles.findMany({
        where: {
          role: input.role,
          is_active: true,
        },
        select: {
          user_id: true,
          role: true,
          created_at: true,
        },
      });

      // Fetch user profiles
      const userIds = userRoles.map((ur) => ur.user_id).filter(Boolean) as string[];
      const userProfiles = await ctx.db.user_profiles.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          full_name: true,
          email: true,
          user_type: true,
        },
      });

      const userProfileMap = new Map(
        userProfiles.map((profile) => [profile.id, profile])
      );

      // Enrich with user profile data
      const enrichedUsers = userRoles
        .map((ur) => ({
          ...ur,
          user: ur.user_id ? userProfileMap.get(ur.user_id) : null,
        }))
        .filter((ur) => ur.user !== null);

      return {
        role: input.role,
        users: enrichedUsers,
        totalCount: enrichedUsers.length,
      };
    }),

  /**
   * Batch assign roles to multiple users
   * Restricted to super admins only
   */
  batchAssignRoles: superAdminProcedure
    .input(batchAssignSchema)
    .mutation(async ({ input, ctx }) => {
      const performedBy = ctx.session?.user?.id;
      const performedByProfile = await ctx.db.user_profiles.findUnique({
        where: { id: performedBy },
        select: { email: true, full_name: true },
      });

      // Get IP and User Agent
      const ipAddress = ctx.req?.headers?.['x-forwarded-for']?.toString().split(',')[0] ||
                        ctx.req?.headers?.['x-real-ip']?.toString() ||
                        'unknown';
      const userAgent = ctx.req?.headers?.['user-agent'] || 'unknown';

      const results = {
        success: [] as Array<{ userId: string; role: string }>,
        failed: [] as Array<{ userId: string; role: string; error: string }>,
      };

      // Process each operation
      for (const op of input.operations) {
        try {
          await assignRole(op.userId, op.role as SystemRole, {
            performedBy,
            performedByEmail: performedByProfile?.email || undefined,
            reason: input.reason || `Batch role assignment by ${performedByProfile?.full_name || 'super admin'}`,
            ipAddress,
            userAgent,
          });

          results.success.push({ userId: op.userId, role: op.role });
        } catch (error) {
          results.failed.push({
            userId: op.userId,
            role: op.role,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      console.log(
        `[RBAC] Batch role assignment completed: ${results.success.length} succeeded, ${results.failed.length} failed`
      );

      return {
        success: results.success,
        failed: results.failed,
        totalProcessed: input.operations.length,
        successCount: results.success.length,
        failedCount: results.failed.length,
      };
    }),

  /**
   * Check if user has a specific role
   * Accessible by authenticated users (check own roles) and admins
   */
  hasRole: protectedProcedure
    .input(z.object({
      userId: z.string().uuid().optional(), // If not provided, checks current user
      role: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const userId = input.userId || ctx.session?.user?.id;

      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User ID required',
        });
      }

      // If checking another user, must be admin
      if (input.userId && input.userId !== ctx.session?.user?.id) {
        const requestingUserRoles = await getEffectiveRoles(ctx.session?.user?.id!);
        const isAdmin = requestingUserRoles.includes(SYSTEM_ROLES.ADMIN) ||
                        requestingUserRoles.includes(SYSTEM_ROLES.SUPER_ADMIN);

        if (!isAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only admins can check other users\' roles',
          });
        }
      }

      return await hasRole(userId, input.role as SystemRole);
    }),

  /**
   * Check if user has any of the specified roles
   * Accessible by authenticated users (check own roles) and admins
   */
  hasAnyRole: protectedProcedure
    .input(z.object({
      userId: z.string().uuid().optional(),
      roles: z.array(z.string()),
    }))
    .query(async ({ input, ctx }) => {
      const userId = input.userId || ctx.session?.user?.id;

      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User ID required',
        });
      }

      // If checking another user, must be admin
      if (input.userId && input.userId !== ctx.session?.user?.id) {
        const requestingUserRoles = await getEffectiveRoles(ctx.session?.user?.id!);
        const isAdmin = requestingUserRoles.includes(SYSTEM_ROLES.ADMIN) ||
                        requestingUserRoles.includes(SYSTEM_ROLES.SUPER_ADMIN);

        if (!isAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only admins can check other users\' roles',
          });
        }
      }

      return await hasAnyRole(userId, input.roles as SystemRole[]);
    }),

  /**
   * Check if user has all of the specified roles
   * Accessible by authenticated users (check own roles) and admins
   */
  hasAllRoles: protectedProcedure
    .input(z.object({
      userId: z.string().uuid().optional(),
      roles: z.array(z.string()),
    }))
    .query(async ({ input, ctx }) => {
      const userId = input.userId || ctx.session?.user?.id;

      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User ID required',
        });
      }

      // If checking another user, must be admin
      if (input.userId && input.userId !== ctx.session?.user?.id) {
        const requestingUserRoles = await getEffectiveRoles(ctx.session?.user?.id!);
        const isAdmin = requestingUserRoles.includes(SYSTEM_ROLES.ADMIN) ||
                        requestingUserRoles.includes(SYSTEM_ROLES.SUPER_ADMIN);

        if (!isAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only admins can check other users\' roles',
          });
        }
      }

      return await hasAllRoles(userId, input.roles as SystemRole[]);
    }),

  /**
   * Check if user has a specific permission
   * Accessible by authenticated users (check own permissions) and admins
   */
  hasPermission: protectedProcedure
    .input(z.object({
      userId: z.string().uuid().optional(),
      permission: z.string(),
      resource: z.object({
        type: z.string(),
        id: z.string(),
      }).optional(),
    }))
    .query(async ({ input, ctx }) => {
      const userId = input.userId || ctx.session?.user?.id;

      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User ID required',
        });
      }

      // If checking another user, must be admin
      if (input.userId && input.userId !== ctx.session?.user?.id) {
        const requestingUserRoles = await getEffectiveRoles(ctx.session?.user?.id!);
        const isAdmin = requestingUserRoles.includes(SYSTEM_ROLES.ADMIN) ||
                        requestingUserRoles.includes(SYSTEM_ROLES.SUPER_ADMIN);

        if (!isAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only admins can check other users\' permissions',
          });
        }
      }

      return await hasPermission(userId, input.permission as Permission, {
        resource: input.resource,
      });
    }),

  /**
   * Check if user has any of the specified permissions
   * Accessible by authenticated users (check own permissions) and admins
   */
  hasAnyPermission: protectedProcedure
    .input(z.object({
      userId: z.string().uuid().optional(),
      permissions: z.array(z.string()),
    }))
    .query(async ({ input, ctx }) => {
      const userId = input.userId || ctx.session?.user?.id;

      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User ID required',
        });
      }

      // If checking another user, must be admin
      if (input.userId && input.userId !== ctx.session?.user?.id) {
        const requestingUserRoles = await getEffectiveRoles(ctx.session?.user?.id!);
        const isAdmin = requestingUserRoles.includes(SYSTEM_ROLES.ADMIN) ||
                        requestingUserRoles.includes(SYSTEM_ROLES.SUPER_ADMIN);

        if (!isAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only admins can check other users\' permissions',
          });
        }
      }

      return await hasAnyPermission(userId, input.permissions as Permission[]);
    }),

  /**
   * Check if user has all of the specified permissions
   * Accessible by authenticated users (check own permissions) and admins
   */
  hasAllPermissions: protectedProcedure
    .input(z.object({
      userId: z.string().uuid().optional(),
      permissions: z.array(z.string()),
    }))
    .query(async ({ input, ctx }) => {
      const userId = input.userId || ctx.session?.user?.id;

      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User ID required',
        });
      }

      // If checking another user, must be admin
      if (input.userId && input.userId !== ctx.session?.user?.id) {
        const requestingUserRoles = await getEffectiveRoles(ctx.session?.user?.id!);
        const isAdmin = requestingUserRoles.includes(SYSTEM_ROLES.ADMIN) ||
                        requestingUserRoles.includes(SYSTEM_ROLES.SUPER_ADMIN);

        if (!isAdmin) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only admins can check other users\' permissions',
          });
        }
      }

      return await hasAllPermissions(userId, input.permissions as Permission[]);
    }),
});

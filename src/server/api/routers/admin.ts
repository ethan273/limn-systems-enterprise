/**
 * Admin Router - User & Permission Management
 *
 * Provides endpoints for:
 * - User management (list, get, update)
 * - Permission management (get, update user permissions)
 * - Default permissions by user type
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { PrismaClient, user_type_enum } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// INPUT SCHEMAS
// ============================================

const userTypeSchema = z.enum([
  'employee',
  'contractor',
  'designer',
  'manufacturer',
  'finance',
  'super_admin',
  'customer',
]);

const moduleSchema = z.enum([
  'dashboards',
  'tasks',
  'crm',
  'partners',
  'design',
  'products',
  'production',
  'shipping',
  'finance',
  'documents',
  'admin',
]);

const permissionTypeSchema = z.enum([
  'can_view',
  'can_create',
  'can_edit',
  'can_delete',
  'can_approve',
]);

// ============================================
// ADMIN ROUTER
// ============================================

export const adminRouter = createTRPCRouter({
  // ==================
  // USER MANAGEMENT
  // ==================

  /**
   * List all users with optional search and filtering
   */
  users: createTRPCRouter({
    list: protectedProcedure
      .input(
        z.object({
          search: z.string().optional(),
          userType: userTypeSchema.optional(),
          isActive: z.boolean().optional(),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
      )
      .query(async ({ input }) => {
        const { search, userType, isActive, limit, offset } = input;

        // Build where clause
        const where: any = {};

        if (search) {
          where.OR = [
            { email: { contains: search, mode: 'insensitive' } },
            { user_profiles: { name: { contains: search, mode: 'insensitive' } } },
          ];
        }

        if (userType) {
          where.user_profiles = { user_type: userType };
        }

        // Simplified: Query users and profiles separately
        const users = await prisma.users.findMany({
          where: search ? {
            email: { contains: search, mode: 'insensitive' as any },
          } : {},
          take: limit,
          skip: offset,
          select: {
            id: true,
            email: true,
            created_at: true,
            last_sign_in_at: true,
          },
          orderBy: { created_at: 'desc' },
        });

        const total = await prisma.users.count({
          where: search ? {
            email: { contains: search, mode: 'insensitive' as any },
          } : {},
        });

        // Get profiles for these users
        const userIds = users.map(u => u.id);
        const profiles = await prisma.user_profiles.findMany({
          where: {
            id: { in: userIds },
            ...(userType ? { user_type: userType as user_type_enum } : {}),
            ...(isActive !== undefined ? { is_active: isActive } : {}),
          },
          select: {
            id: true,
            name: true,
            avatar_url: true,
            user_type: true,
            title: true,
            department: true,
            is_active: true,
          },
        });

        const profileMap = new Map(profiles.map(p => [p.id, p]));

        return {
          users: users
            .map(user => {
              const profile = profileMap.get(user.id);
              // Filter by user type and active status
              if (userType && profile?.user_type !== userType) return null;
              if (isActive !== undefined && profile?.is_active !== isActive) return null;

              return {
                id: user.id,
                email: user.email,
                name: profile?.name || null,
                avatarUrl: profile?.avatar_url || null,
                userType: profile?.user_type || 'employee',
                title: profile?.title || null,
                department: profile?.department || null,
                isActive: profile?.is_active ?? true,
                lastSignInAt: user.last_sign_in_at,
                createdAt: user.created_at,
              };
            })
            .filter((user): user is NonNullable<typeof user> => user !== null),
          total,
          hasMore: offset + limit < total,
        };
      }),

    /**
     * Get single user with full details and permissions
     */
    get: protectedProcedure
      .input(z.object({ userId: z.string().uuid() }))
      .query(async ({ input }) => {
        const [user, profile, permissions] = await Promise.all([
          prisma.users.findUnique({
            where: { id: input.userId },
            select: {
              id: true,
              email: true,
              created_at: true,
              last_sign_in_at: true,
            },
          }),
          prisma.user_profiles.findUnique({
            where: { id: input.userId },
            select: {
              name: true,
              avatar_url: true,
              user_type: true,
              title: true,
              department: true,
              is_active: true,
            },
          }),
          prisma.user_permissions.findMany({
            where: { user_id: input.userId },
            select: {
              id: true,
              module: true,
              can_view: true,
              can_create: true,
              can_edit: true,
              can_delete: true,
              can_approve: true,
            },
          }),
        ]);

        if (!user) {
          throw new Error('User not found');
        }

        return {
          id: user.id,
          email: user.email,
          name: profile?.name || null,
          avatarUrl: profile?.avatar_url || null,
          userType: profile?.user_type || 'employee',
          title: profile?.title || null,
          department: profile?.department || null,
          isActive: profile?.is_active ?? true,
          lastSignInAt: user.last_sign_in_at,
          createdAt: user.created_at,
          permissions: permissions,
        };
      }),

    /**
     * Update user profile (title, type, department, active status)
     */
    update: protectedProcedure
      .input(
        z.object({
          userId: z.string().uuid(),
          data: z.object({
            userType: userTypeSchema.optional(),
            title: z.string().optional(),
            department: z.string().optional(),
            isActive: z.boolean().optional(),
          }),
        })
      )
      .mutation(async ({ input }) => {
        const { userId, data } = input;

        // Update user_profiles
        const updated = await prisma.user_profiles.update({
          where: { id: userId },
          data: {
            user_type: data.userType as user_type_enum | undefined,
            title: data.title,
            department: data.department,
            is_active: data.isActive,
          },
        });

        return {
          success: true,
          userId: updated.id,
        };
      }),

    /**
     * Create new user (placeholder - requires Supabase Auth integration)
     */
    create: protectedProcedure
      .input(
        z.object({
          email: z.string().email(),
          userType: userTypeSchema,
          title: z.string().optional(),
          department: z.string().optional(),
        })
      )
      .mutation(async ({ input: _input }) => {
        // Note: This is a placeholder implementation
        // In production, you would:
        // 1. Use Supabase Admin API to create auth user
        // 2. Send invitation email
        // 3. Create user_profiles entry with provided data

        // For now, just throw an error with instructions
        throw new Error('User creation requires Supabase Admin API integration. Please create users through Supabase Dashboard for now.');

        // Future implementation:
        // const { data: authUser, error } = await supabase.auth.admin.createUser({
        //   email: input.email,
        //   email_confirm: true,
        // });
        //
        // if (error) throw new Error(error.message);
        //
        // await prisma.user_profiles.create({
        //   data: {
        //     id: authUser.user.id,
        //     user_type: input.userType as user_type_enum,
        //     title: input.title,
        //     department: input.department,
        //   },
        // });
        //
        // return { success: true, userId: authUser.user.id };
      }),
  }),

  // ==================
  // PERMISSION MANAGEMENT
  // ==================

  permissions: createTRPCRouter({
    /**
     * Get user's permissions (with default fallback)
     */
    getUserPermissions: protectedProcedure
      .input(z.object({ userId: z.string().uuid() }))
      .query(async ({ input }) => {
        const { userId } = input;

        // Get user's type
        const user = await prisma.user_profiles.findUnique({
          where: { id: userId },
          select: { user_type: true },
        });

        if (!user) {
          throw new Error('User not found');
        }

        const userType = user.user_type || 'employee';

        // Get user-specific permissions
        const userPermissions = await prisma.user_permissions.findMany({
          where: { user_id: userId },
        });

        // Get default permissions for user type
        const defaultPermissions = await prisma.default_permissions.findMany({
          where: { user_type: userType as user_type_enum },
        });

        // Combine: user-specific overrides take precedence
        const permissionMap = new Map();

        // First, add defaults
        for (const perm of defaultPermissions) {
          permissionMap.set(perm.module, {
            module: perm.module,
            canView: perm.can_view ?? false,
            canCreate: perm.can_create ?? false,
            canEdit: perm.can_edit ?? false,
            canDelete: perm.can_delete ?? false,
            canApprove: perm.can_approve ?? false,
            isDefault: true,
          });
        }

        // Then, override with user-specific permissions
        for (const perm of userPermissions) {
          permissionMap.set(perm.module, {
            module: perm.module,
            canView: perm.can_view ?? false,
            canCreate: perm.can_create ?? false,
            canEdit: perm.can_edit ?? false,
            canDelete: perm.can_delete ?? false,
            canApprove: perm.can_approve ?? false,
            isDefault: false,
            permissionId: perm.id,
          });
        }

        return Array.from(permissionMap.values());
      }),

    /**
     * Update a single permission for a user
     */
    updateUserPermission: protectedProcedure
      .input(
        z.object({
          userId: z.string().uuid(),
          module: moduleSchema,
          permission: permissionTypeSchema,
          value: z.boolean(),
        })
      )
      .mutation(async ({ input }) => {
        const { userId, module, permission, value } = input;

        // Check if user-specific permission exists
        const existingPermission = await prisma.user_permissions.findUnique({
          where: {
            user_id_module: {
              user_id: userId,
              module,
            },
          },
        });

        if (existingPermission) {
          // Update existing permission
          await prisma.user_permissions.update({
            where: { id: existingPermission.id },
            data: {
              [permission]: value,
              updated_at: new Date(),
            },
          });
        } else {
          // Create new user-specific permission override
          await prisma.user_permissions.create({
            data: {
              user_id: userId,
              module,
              [permission]: value,
              can_view: permission === 'can_view' ? value : false,
              can_create: permission === 'can_create' ? value : false,
              can_edit: permission === 'can_edit' ? value : false,
              can_delete: permission === 'can_delete' ? value : false,
              can_approve: permission === 'can_approve' ? value : false,
            },
          });
        }

        return { success: true };
      }),

    /**
     * Bulk update permissions for a user
     */
    bulkUpdatePermissions: protectedProcedure
      .input(
        z.object({
          userId: z.string().uuid(),
          module: moduleSchema,
          permissions: z.object({
            canView: z.boolean().optional(),
            canCreate: z.boolean().optional(),
            canEdit: z.boolean().optional(),
            canDelete: z.boolean().optional(),
            canApprove: z.boolean().optional(),
          }),
        })
      )
      .mutation(async ({ input }) => {
        const { userId, module, permissions } = input;

        // Upsert permission
        await prisma.user_permissions.upsert({
          where: {
            user_id_module: {
              user_id: userId,
              module,
            },
          },
          update: {
            can_view: permissions.canView,
            can_create: permissions.canCreate,
            can_edit: permissions.canEdit,
            can_delete: permissions.canDelete,
            can_approve: permissions.canApprove,
            updated_at: new Date(),
          },
          create: {
            user_id: userId,
            module,
            can_view: permissions.canView ?? false,
            can_create: permissions.canCreate ?? false,
            can_edit: permissions.canEdit ?? false,
            can_delete: permissions.canDelete ?? false,
            can_approve: permissions.canApprove ?? false,
          },
        });

        return { success: true };
      }),

    /**
     * Get default permissions for a user type
     */
    getDefaultPermissions: protectedProcedure
      .input(z.object({ userType: userTypeSchema }))
      .query(async ({ input }) => {
        const permissions = await prisma.default_permissions.findMany({
          where: { user_type: input.userType as user_type_enum },
          orderBy: { module: 'asc' },
        });

        return permissions.map((perm: typeof permissions[number]) => ({
          module: perm.module,
          canView: perm.can_view ?? false,
          canCreate: perm.can_create ?? false,
          canEdit: perm.can_edit ?? false,
          canDelete: perm.can_delete ?? false,
          canApprove: perm.can_approve ?? false,
        }));
      }),

    /**
     * Reset user permissions to defaults (delete all overrides)
     */
    resetToDefaults: protectedProcedure
      .input(z.object({ userId: z.string().uuid() }))
      .mutation(async ({ input }) => {
        await prisma.user_permissions.deleteMany({
          where: { user_id: input.userId },
        });

        return { success: true };
      }),
  }),

  // ==================
  // SYSTEM SETTINGS
  // ==================

  settings: createTRPCRouter({
    /**
     * Get all system settings grouped by category
     */
    getAll: protectedProcedure.query(async () => {
      const settings = await prisma.admin_settings.findMany({
        orderBy: [{ category: 'asc' }, { key: 'asc' }],
      });

      // Group by category
      const grouped = settings.reduce((acc, setting) => {
        if (!acc[setting.category]) {
          acc[setting.category] = [];
        }
        acc[setting.category].push({
          id: setting.id,
          key: setting.key,
          value: setting.value,
          updatedAt: setting.updated_at,
        });
        return acc;
      }, {} as Record<string, any[]>);

      return grouped;
    }),

    /**
     * Get settings for a specific category
     */
    getByCategory: protectedProcedure
      .input(z.object({ category: z.string() }))
      .query(async ({ input }) => {
        const settings = await prisma.admin_settings.findMany({
          where: { category: input.category },
          orderBy: { key: 'asc' },
        });

        return settings.map((s) => ({
          id: s.id,
          key: s.key,
          value: s.value,
          updatedAt: s.updated_at,
        }));
      }),

    /**
     * Update a single setting
     */
    update: protectedProcedure
      .input(
        z.object({
          category: z.string(),
          key: z.string(),
          value: z.any(),
        })
      )
      .mutation(async ({ input }) => {
        const { category, key, value } = input;

        await prisma.admin_settings.upsert({
          where: {
            category_key: {
              category,
              key,
            },
          },
          update: {
            value,
            updated_at: new Date(),
          },
          create: {
            category,
            key,
            value,
          },
        });

        return { success: true };
      }),

    /**
     * Delete a setting
     */
    delete: protectedProcedure
      .input(
        z.object({
          category: z.string(),
          key: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        await prisma.admin_settings.delete({
          where: {
            category_key: {
              category: input.category,
              key: input.key,
            },
          },
        });

        return { success: true };
      }),
  }),

  // ==================
  // ROLE MANAGEMENT
  // ==================

  roles: createTRPCRouter({
    /**
     * Get all roles for a user
     */
    getUserRoles: protectedProcedure
      .input(z.object({ userId: z.string().uuid() }))
      .query(async ({ input }) => {
        const roles = await prisma.user_roles.findMany({
          where: { user_id: input.userId },
          orderBy: { created_at: 'desc' },
        });

        return roles.map((r) => ({
          id: r.id,
          role: r.role,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));
      }),

    /**
     * Assign a role to a user
     */
    assignRole: protectedProcedure
      .input(
        z.object({
          userId: z.string().uuid(),
          role: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { userId, role } = input;

        await prisma.user_roles.create({
          data: {
            user_id: userId,
            role,
          },
        });

        return { success: true };
      }),

    /**
     * Remove a role from a user
     */
    removeRole: protectedProcedure
      .input(
        z.object({
          userId: z.string().uuid(),
          role: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { userId, role } = input;

        await prisma.user_roles.deleteMany({
          where: {
            user_id: userId,
            role,
          },
        });

        return { success: true };
      }),

    /**
     * Get all users with a specific role
     */
    getUsersByRole: protectedProcedure
      .input(z.object({ role: z.string() }))
      .query(async ({ input }) => {
        const userRoles = await prisma.user_roles.findMany({
          where: { role: input.role },
          include: {
            users: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        });

        // Get profiles for these users
        const userIds = userRoles.map((ur) => ur.user_id).filter((id): id is string => id !== null);
        const profiles = await prisma.user_profiles.findMany({
          where: { id: { in: userIds } },
          select: {
            id: true,
            name: true,
            user_type: true,
            is_active: true,
          },
        });

        const profileMap = new Map(profiles.map((p) => [p.id, p]));

        return userRoles
          .filter((ur) => ur.user_id)
          .map((ur) => {
            const profile = ur.user_id ? profileMap.get(ur.user_id) : undefined;
            return {
              userId: ur.user_id!,
              email: ur.users?.email || '',
              name: profile?.name,
              userType: profile?.user_type,
              isActive: profile?.is_active,
              assignedAt: ur.created_at,
            };
          });
      }),

    /**
     * Get role statistics
     */
    getRoleStats: protectedProcedure.query(async () => {
      const roles = await prisma.user_roles.groupBy({
        by: ['role'],
        _count: true,
        orderBy: {
          _count: {
            role: 'desc',
          },
        },
      });

      return roles.map((r) => ({
        role: r.role,
        count: r._count,
      }));
    }),
  }),
});

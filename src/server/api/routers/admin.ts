/**
 * Admin Router - User & Permission Management
 *
 * Provides endpoints for:
 * - User management (list, get, update)
 * - Permission management (get, update user permissions)
 * - Default permissions by user type
 */

import { z } from 'zod';
import { createTRPCRouter, adminProcedure } from '../trpc/init';
import { PrismaClient, user_type_enum } from '@prisma/client';
import { getUserFullName } from '@/lib/utils/user-utils';
import { createClient } from '@supabase/supabase-js';
import { sendUserInvitationEmail } from '@/lib/email/templates/user-invitation';
import { notifyUserInvited } from '@/lib/notifications/google-chat';

const prisma = new PrismaClient();

// Lazy-initialized Supabase client with service role for admin operations
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        'Supabase configuration missing: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required'
      );
    }

    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  }

  return supabaseAdmin;
}

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
    list: adminProcedure
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
            { user_profiles: {
              OR: [
                { first_name: { contains: search, mode: 'insensitive' } },
                { last_name: { contains: search, mode: 'insensitive' } },
                { full_name: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
              ]
            } },
          ];
        }

        if (userType) {
          where.user_profiles = { user_type: userType };
        }

        // Build profile where clause for filtering
        const profileWhere: any = {};
        if (userType) {
          profileWhere.user_type = userType as user_type_enum;
        }
        if (isActive !== undefined) {
          profileWhere.is_active = isActive;
        }

        // Query profiles first to get filtered user IDs
        const profiles = await prisma.user_profiles.findMany({
          where: profileWhere,
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

        const userIds = profiles.map(p => p.id);

        // Now query users with these IDs and apply search filter
        const userWhere: any = {
          id: { in: userIds },
        };

        if (search) {
          userWhere.email = { contains: search, mode: 'insensitive' as any };
        }

        const users = await prisma.users.findMany({
          where: userWhere,
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
          where: userWhere,
        });

        // Create profile map for quick lookup
        const profileMap = new Map(profiles.map(p => [p.id, p]));

        return {
          users: users.map(user => {
            const profile = profileMap.get(user.id);
            return {
              id: user.id,
              email: user.email,
              name: getUserFullName(profile) || null,
              avatarUrl: profile?.avatar_url || null,
              userType: profile?.user_type || 'employee',
              title: profile?.title || null,
              department: profile?.department || null,
              isActive: profile?.is_active ?? true,
              lastSignInAt: user.last_sign_in_at,
              createdAt: user.created_at,
            };
          }),
          total,
          hasMore: offset + limit < total,
        };
      }),

    /**
     * Get single user with full details and permissions
     */
    get: adminProcedure
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
          name: getUserFullName(profile) || null,
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
    update: adminProcedure
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
      .mutation(async ({ input, ctx }) => {
        const { userId, data } = input;

        // Get user email for audit log
        const user = await prisma.users.findUnique({
          where: { id: userId },
          select: { email: true },
        });

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

        // Create audit log entry
        await prisma.admin_audit_log.create({
          data: {
            action: 'UPDATE_USER_PROFILE',
            user_id: ctx.session?.user?.id || null,
            user_email: ctx.session?.user?.email || null,
            resource_type: 'user_profile',
            resource_id: userId,
            metadata: {
              target_user_email: user?.email,
              changes: data,
            },
            created_at: new Date(),
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
    create: adminProcedure
      .input(
        z.object({
          email: z.string().email(),
          userType: userTypeSchema,
          title: z.string().optional(),
          department: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Check if user already exists
        const existingUserArray = await prisma.users.findMany({
          where: { email: input.email },
          take: 1,
        });

        if (existingUserArray.length > 0) {
          throw new Error(`User with email ${input.email} already exists`);
        }

        // Parse email to get first/last name
        const emailLocalPart = input.email.split('@')[0];
        const nameParts = emailLocalPart.split(/[._-]/);
        const firstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : 'User';
        const lastName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : undefined;

        // Create user in Supabase auth
        const { data: authData, error: authError } = await getSupabaseAdmin().auth.admin.createUser({
          email: input.email,
          email_confirm: true,
        });

        if (authError || !authData.user) {
          throw new Error(`Failed to create auth user: ${authError?.message || 'Unknown error'}`);
        }

        const userId = authData.user.id;

        // Create user in auth.users (if not automatically created)
        const usersArray = await prisma.users.findMany({
          where: { id: userId },
          take: 1,
        });

        if (usersArray.length === 0) {
          await prisma.users.create({
            data: {
              id: userId,
              email: input.email,
              email_confirmed_at: new Date(),
              created_at: new Date(),
              updated_at: new Date(),
            },
          });
        }

        // Create user profile
        await prisma.user_profiles.create({
          data: {
            id: userId,
            email: input.email,
            first_name: firstName,
            last_name: lastName,
            name: lastName ? `${firstName} ${lastName}` : firstName,
            user_type: input.userType as user_type_enum,
            title: input.title || undefined,
            department: input.department || undefined,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });

        // Generate magic link for first sign-in
        const { data: magicLinkData, error: magicLinkError } = await getSupabaseAdmin().auth.signInWithOtp({
          email: input.email,
          options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
          },
        });

        if (magicLinkError) {
          console.error('[admin.users.create] Failed to generate magic link:', magicLinkError);
        }

        // Get admin email from session
        const invitedBy = ctx.session?.user?.email || 'Admin';

        // Send invitation email (non-blocking)
        sendUserInvitationEmail({
          to: input.email,
          firstName,
          lastName,
          magicLink: (magicLinkData as any)?.properties?.action_link || '#',
          userType: input.userType,
          invitedBy,
        }).catch(err => {
          console.error('[admin.users.create] Failed to send invitation email:', err);
        });

        // Send Google Chat notification (non-blocking)
        notifyUserInvited({
          email: input.email,
          name: lastName ? `${firstName} ${lastName}` : firstName,
          invitedBy,
          userType: input.userType,
        }).catch(err => {
          console.error('[admin.users.create] Failed to send Google Chat notification:', err);
        });

        // Log the action
        await prisma.admin_audit_log.create({
          data: {
            action: 'CREATE_USER',
            user_id: ctx.session?.user?.id || null,
            user_email: ctx.session?.user?.email || null,
            resource_type: 'user',
            resource_id: userId,
            metadata: {
              target_email: input.email,
              user_type: input.userType,
              title: input.title,
              department: input.department,
            },
            created_at: new Date(),
          },
        });

        return {
          success: true,
          userId,
          message: 'User created successfully! An invitation email has been sent.',
        };
      }),
  }),

  // ==================
  // PERMISSION MANAGEMENT
  // ==================

  permissions: createTRPCRouter({
    /**
     * Get user's permissions (with default fallback)
     */
    getUserPermissions: adminProcedure
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
    updateUserPermission: adminProcedure
      .input(
        z.object({
          userId: z.string().uuid(),
          module: moduleSchema,
          permission: permissionTypeSchema,
          value: z.boolean(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { userId, module, permission, value } = input;

        // Get user email for audit log
        const user = await prisma.users.findUnique({
          where: { id: userId },
          select: { email: true },
        });

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

        // Create audit log entry
        await prisma.admin_audit_log.create({
          data: {
            action: 'UPDATE_USER_PERMISSION',
            user_id: ctx.session?.user?.id || null,
            user_email: ctx.session?.user?.email || null,
            resource_type: 'user_permission',
            resource_id: userId,
            metadata: {
              target_user_email: user?.email,
              module,
              permission,
              value,
            },
            created_at: new Date(),
          },
        });

        return { success: true };
      }),

    /**
     * Bulk update permissions for a user
     */
    bulkUpdatePermissions: adminProcedure
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
    getDefaultPermissions: adminProcedure
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
    resetToDefaults: adminProcedure
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
    getAll: adminProcedure.query(async () => {
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
    getByCategory: adminProcedure
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
    update: adminProcedure
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
    delete: adminProcedure
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
    getUserRoles: adminProcedure
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
    assignRole: adminProcedure
      .input(
        z.object({
          userId: z.string().uuid(),
          role: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { userId, role } = input;

        // Get user email for audit log
        const user = await prisma.users.findUnique({
          where: { id: userId },
          select: { email: true },
        });

        await prisma.user_roles.create({
          data: {
            user_id: userId,
            role,
          },
        });

        // Create audit log entry
        await prisma.admin_audit_log.create({
          data: {
            action: 'ASSIGN_ROLE',
            user_id: ctx.session?.user?.id || null,
            user_email: ctx.session?.user?.email || null,
            resource_type: 'user_role',
            resource_id: userId,
            metadata: { role, target_user_email: user?.email },
            created_at: new Date(),
          },
        });

        return { success: true };
      }),

    /**
     * Remove a role from a user
     */
    removeRole: adminProcedure
      .input(
        z.object({
          userId: z.string().uuid(),
          role: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { userId, role } = input;

        // Get user email for audit log
        const user = await prisma.users.findUnique({
          where: { id: userId },
          select: { email: true },
        });

        await prisma.user_roles.deleteMany({
          where: {
            user_id: userId,
            role,
          },
        });

        // Create audit log entry
        await prisma.admin_audit_log.create({
          data: {
            action: 'REMOVE_ROLE',
            user_id: ctx.session?.user?.id || null,
            user_email: ctx.session?.user?.email || null,
            resource_type: 'user_role',
            resource_id: userId,
            metadata: { role, target_user_email: user?.email },
            created_at: new Date(),
          },
        });

        return { success: true };
      }),

    /**
     * Get all users with a specific role
     */
    getUsersByRole: adminProcedure
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
            first_name: true,
            last_name: true,
            full_name: true,
            name: true,
            email: true,
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
              name: getUserFullName(profile),
              userType: profile?.user_type,
              isActive: profile?.is_active,
              assignedAt: ur.created_at,
            };
          });
      }),

    /**
     * Get role statistics
     */
    getRoleStats: adminProcedure.query(async () => {
      // Note: groupBy not supported by wrapper, using findMany + manual grouping
      const allRoles = await prisma.user_roles.findMany();

      // Manual grouping
      const roleCountMap = new Map<string, number>();
      allRoles.forEach(ur => {
        const role = ur.role || 'unknown';
        roleCountMap.set(role, (roleCountMap.get(role) || 0) + 1);
      });

      // Convert to array and sort by count descending
      const roles = Array.from(roleCountMap.entries())
        .map(([role, count]) => ({ role, count }))
        .sort((a, b) => b.count - a.count);

      return roles;
    }),

    /**
     * Get all portal users across all portal types
     * For portal management dashboard
     */
    getAllPortalUsers: adminProcedure.query(async () => {
      const portalUsers = await prisma.customer_portal_access.findMany({
        include: {
          users_customer_portal_access_user_idTousers: {
            select: {
              email: true,
            },
          },
          customers: {
            select: {
              company_name: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      return portalUsers;
    }),

    /**
     * Update portal user access
     */
    updatePortalUser: adminProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          portalRole: z.string().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, portalRole, isActive } = input;

        const updateData: any = {};
        if (portalRole !== undefined) updateData.portal_role = portalRole;
        if (isActive !== undefined) updateData.is_active = isActive;

        await prisma.customer_portal_access.update({
          where: { id },
          data: updateData,
        });

        return { success: true };
      }),

    /**
     * Delete portal user access
     */
    deletePortalUser: adminProcedure
      .input(
        z.object({
          id: z.string().uuid(),
        })
      )
      .mutation(async ({ input }) => {
        await prisma.customer_portal_access.delete({
          where: { id: input.id },
        });

        return { success: true };
      }),
  }),

  // ==========================================
  // PORTAL MODULE MANAGEMENT
  // ==========================================

  /**
   * Manage portal module visibility and permissions across all portal types
   */
  portalModules: createTRPCRouter({
    /**
     * Get module settings for a specific portal type and entity
     */
    getSettings: adminProcedure
      .input(
        z.object({
          portalType: z.enum(['customer', 'designer', 'factory', 'qc']),
          entityId: z.string().uuid().optional(), // NULL = defaults
        })
      )
      .query(async ({ input }) => {
        const settings = await prisma.portal_module_settings.findMany({
          where: {
            portal_type: input.portalType,
            entity_id: input.entityId || null,
          },
          orderBy: {
            module_key: 'asc',
          },
        });

        return settings.map((s) => ({
          moduleKey: s.module_key,
          isEnabled: s.is_enabled,
          permissions: s.permissions as Record<string, boolean> | null,
        }));
      }),

    /**
     * Update module settings for a portal type and entity
     */
    updateSettings: adminProcedure
      .input(
        z.object({
          portalType: z.enum(['customer', 'designer', 'factory', 'qc']),
          entityId: z.string().uuid().optional(),
          modules: z.array(
            z.object({
              moduleKey: z.string(),
              isEnabled: z.boolean(),
              permissions: z.record(z.boolean()).optional(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        // Upsert each module setting
        // Note: Prisma doesn't support null in unique constraint where clauses
        // So we need to handle this with findMany + create/update
        await Promise.all(
          input.modules.map(async (mod) => {
            // Note: findFirst not supported by wrapper, using findMany
            const existingArray = await prisma.portal_module_settings.findMany({
              where: {
                portal_type: input.portalType,
                entity_id: input.entityId || null,
                module_key: mod.moduleKey,
              },
              take: 1,
            });
            const existing = existingArray.length > 0 ? existingArray[0] : null;

            if (existing) {
              await prisma.portal_module_settings.update({
                where: { id: existing.id },
                data: {
                  is_enabled: mod.isEnabled,
                  permissions: mod.permissions || {},
                  updated_at: new Date(),
                },
              });
            } else {
              await prisma.portal_module_settings.create({
                data: {
                  portal_type: input.portalType,
                  entity_id: input.entityId ?? null,
                  module_key: mod.moduleKey,
                  is_enabled: mod.isEnabled,
                  permissions: mod.permissions || {},
                },
              });
            }
          })
        );

        return { success: true };
      }),

    /**
     * Get available modules for a specific portal type
     */
    getAvailableModules: adminProcedure
      .input(
        z.object({
          portalType: z.enum(['customer', 'designer', 'factory', 'qc']),
        })
      )
      .query(({ input }) => {
        const modulesByPortal = {
          customer: [
            { key: 'orders', label: 'Orders', alwaysVisible: false },
            { key: 'shipping', label: 'Shipping', alwaysVisible: false },
            { key: 'financials', label: 'Financials', alwaysVisible: false },
            { key: 'documents', label: 'Documents', alwaysVisible: true },
            { key: 'profile', label: 'Profile', alwaysVisible: true },
          ],
          designer: [
            { key: 'projects', label: 'Projects', alwaysVisible: false },
            { key: 'documents', label: 'Documents', alwaysVisible: false },
            { key: 'quality', label: 'Quality', alwaysVisible: false },
          ],
          factory: [
            { key: 'orders', label: 'Production Orders', alwaysVisible: false },
            { key: 'shipping', label: 'Shipping', alwaysVisible: false },
            { key: 'documents', label: 'Documents', alwaysVisible: false },
            { key: 'quality', label: 'Quality', alwaysVisible: false },
          ],
          qc: [
            { key: 'quality_checks', label: 'Quality Checks', alwaysVisible: false },
            { key: 'documents', label: 'Documents', alwaysVisible: false },
            { key: 'reports', label: 'Reports', alwaysVisible: false },
          ],
        };

        return modulesByPortal[input.portalType] || [];
      }),

    /**
     * Get all customers for portal configuration dropdown
     */
    getCustomers: adminProcedure.query(async () => {
      const customers = await prisma.customers.findMany({
        select: {
          id: true,
          company_name: true,
        },
        orderBy: {
          company_name: 'asc',
        },
      });

      return customers;
    }),

    /**
     * Get all partners for portal configuration dropdown
     */
    getPartners: adminProcedure.query(async () => {
      const partners = await prisma.partners.findMany({
        select: {
          id: true,
          company_name: true,
          type: true,
        },
        orderBy: {
          company_name: 'asc',
        },
      });

      return partners.map(p => ({
        ...p,
        partner_type: p.type, // Alias for backwards compatibility with UI
      }));
    }),
  }),
});

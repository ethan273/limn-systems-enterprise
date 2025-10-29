import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

/**
 * Permission Conditions Router
 *
 * Manages permission_conditions table using ctx.db pattern.
 * Covers conditional access rules: time-based, geo-fencing, device restrictions, IP allowlisting.
 */

const conditionTypeEnum = z.enum([
  'time_based',
  'geo_location',
  'device_type',
  'ip_range',
  'combined',
]);

export const permissionConditionsRouter = createTRPCRouter({
  /**
   * Get condition by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const condition = await ctx.db.permission_conditions.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          permission_id: true,
          user_id: true,
          role_id: true,
          condition_type: true,
          time_start: true,
          time_end: true,
          days_of_week: true,
          timezone: true,
          allowed_countries: true,
          allowed_regions: true,
          allowed_cities: true,
          geo_fence: true,
          allowed_device_types: true,
          required_os: true,
          corporate_device_only: true,
          allowed_ip_ranges: true,
          is_active: true,
          created_at: true,
          updated_at: true,
          created_by: true,
          permission_definitions: {
            select: {
              permission_key: true,
              permission_name: true,
            },
          },
          role_definitions: {
            select: {
              role_name: true,
            },
          },
        },
      });

      if (!condition) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Permission condition not found',
        });
      }

      return condition;
    }),

  /**
   * Get all conditions (paginated)
   */
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
        permission_id: z.string().uuid().optional(),
        user_id: z.string().uuid().optional(),
        role_id: z.string().uuid().optional(),
        condition_type: conditionTypeEnum.optional(),
        is_active: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, permission_id, user_id, role_id, condition_type, is_active } = input;

      const where: any = {};

      if (permission_id) {
        where.permission_id = permission_id;
      }

      if (user_id) {
        where.user_id = user_id;
      }

      if (role_id) {
        where.role_id = role_id;
      }

      if (condition_type) {
        where.condition_type = condition_type;
      }

      if (is_active !== undefined) {
        where.is_active = is_active;
      }

      const conditions = await ctx.db.permission_conditions.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          permission_id: true,
          user_id: true,
          role_id: true,
          condition_type: true,
          is_active: true,
          created_at: true,
          permission_definitions: {
            select: {
              permission_key: true,
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (conditions.length > limit) {
        const nextItem = conditions.pop();
        nextCursor = nextItem?.id;
      }

      return {
        conditions,
        nextCursor,
      };
    }),

  /**
   * Get conditions for permission
   */
  getByPermission: protectedProcedure
    .input(z.object({ permission_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const conditions = await ctx.db.permission_conditions.findMany({
        where: {
          permission_id: input.permission_id,
          is_active: true,
        },
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          user_id: true,
          role_id: true,
          condition_type: true,
          time_start: true,
          time_end: true,
          days_of_week: true,
          timezone: true,
          allowed_countries: true,
          allowed_device_types: true,
          allowed_ip_ranges: true,
          created_at: true,
        },
      });

      return conditions;
    }),

  /**
   * Get conditions for user
   */
  getByUser: protectedProcedure
    .input(z.object({ user_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const conditions = await ctx.db.permission_conditions.findMany({
        where: {
          user_id: input.user_id,
          is_active: true,
        },
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          permission_id: true,
          condition_type: true,
          time_start: true,
          time_end: true,
          created_at: true,
          permission_definitions: {
            select: {
              permission_key: true,
              permission_name: true,
            },
          },
        },
      });

      return conditions;
    }),

  /**
   * Get conditions for role
   */
  getByRole: protectedProcedure
    .input(z.object({ role_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const conditions = await ctx.db.permission_conditions.findMany({
        where: {
          role_id: input.role_id,
          is_active: true,
        },
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          permission_id: true,
          condition_type: true,
          time_start: true,
          time_end: true,
          created_at: true,
          permission_definitions: {
            select: {
              permission_key: true,
              permission_name: true,
            },
          },
        },
      });

      return conditions;
    }),

  /**
   * Get active conditions
   */
  getActive: protectedProcedure.query(async ({ ctx }) => {
    const conditions = await ctx.db.permission_conditions.findMany({
      where: {
        is_active: true,
      },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        permission_id: true,
        user_id: true,
        role_id: true,
        condition_type: true,
        created_at: true,
      },
    });

    return conditions;
  }),

  /**
   * Create condition
   */
  create: protectedProcedure
    .input(
      z.object({
        permission_id: z.string().uuid(),
        user_id: z.string().uuid().optional(),
        role_id: z.string().uuid().optional(),
        condition_type: conditionTypeEnum,
        time_start: z.string().optional(), // Time string HH:MM:SS
        time_end: z.string().optional(),
        days_of_week: z.array(z.number().min(0).max(6)).optional(), // 0=Sunday, 6=Saturday
        timezone: z.string().default('UTC'),
        allowed_countries: z.array(z.string()).optional(),
        allowed_regions: z.array(z.string()).optional(),
        allowed_cities: z.array(z.string()).optional(),
        geo_fence: z.any().optional(), // JSON
        allowed_device_types: z.array(z.string()).optional(),
        required_os: z.array(z.string()).optional(),
        corporate_device_only: z.boolean().default(false),
        allowed_ip_ranges: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify permission exists
      const permission = await ctx.db.permission_definitions.findUnique({
        where: { id: input.permission_id },
        select: { id: true },
      });

      if (!permission) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Permission not found',
        });
      }

      // Verify user exists if provided
      if (input.user_id) {
        const user = await ctx.db.users.findUnique({
          where: { id: input.user_id },
          select: { id: true },
        });

        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }
      }

      // Verify role exists if provided
      if (input.role_id) {
        const role = await ctx.db.role_definitions.findUnique({
          where: { id: input.role_id },
          select: { id: true },
        });

        if (!role) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Role not found',
          });
        }
      }

      const newCondition = await ctx.db.permission_conditions.create({
        data: {
          ...input,
          created_by: ctx.user!.id,
          is_active: true,
        },
        select: {
          id: true,
          permission_id: true,
          condition_type: true,
          created_at: true,
        },
      });

      return newCondition;
    }),

  /**
   * Update condition
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        condition_type: conditionTypeEnum.optional(),
        time_start: z.string().optional(),
        time_end: z.string().optional(),
        days_of_week: z.array(z.number().min(0).max(6)).optional(),
        timezone: z.string().optional(),
        allowed_countries: z.array(z.string()).optional(),
        allowed_regions: z.array(z.string()).optional(),
        allowed_cities: z.array(z.string()).optional(),
        geo_fence: z.any().optional(),
        allowed_device_types: z.array(z.string()).optional(),
        required_os: z.array(z.string()).optional(),
        corporate_device_only: z.boolean().optional(),
        allowed_ip_ranges: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const updatedCondition = await ctx.db.permission_conditions.update({
        where: { id: input.id },
        data: {
          ...updateData,
          updated_at: new Date(),
        },
        select: {
          id: true,
          condition_type: true,
          updated_at: true,
        },
      });

      return updatedCondition;
    }),

  /**
   * Activate condition
   */
  activate: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const activatedCondition = await ctx.db.permission_conditions.update({
        where: { id: input.id },
        data: {
          is_active: true,
          updated_at: new Date(),
        },
        select: {
          id: true,
          is_active: true,
        },
      });

      return activatedCondition;
    }),

  /**
   * Deactivate condition
   */
  deactivate: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const deactivatedCondition = await ctx.db.permission_conditions.update({
        where: { id: input.id },
        data: {
          is_active: false,
          updated_at: new Date(),
        },
        select: {
          id: true,
          is_active: true,
        },
      });

      return deactivatedCondition;
    }),

  /**
   * Delete condition
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.permission_conditions.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Get statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, active, byType, byPermission] = await Promise.all([
      ctx.db.permission_conditions.count(),
      ctx.db.permission_conditions.count({ where: { is_active: true } }),
      ctx.db.permission_conditions.groupBy({
        by: ['condition_type'],
        _count: true,
      }),
      ctx.db.permission_conditions.groupBy({
        by: ['permission_id'],
        _count: true,
        orderBy: {
          _count: {
            permission_id: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      byConditionType: byType.map(t => ({
        condition_type: t.condition_type,
        count: t._count,
      })),
      topPermissions: byPermission.map(p => ({
        permission_id: p.permission_id,
        condition_count: p._count,
      })),
    };
  }),
});

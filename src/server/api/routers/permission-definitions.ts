import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

/**
 * Permission Definitions Router
 *
 * Manages permission_definitions table using ctx.db pattern.
 * Covers permission catalog, creation, and management.
 */

export const permissionDefinitionsRouter = createTRPCRouter({
  /**
   * Get permission by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const permission = await ctx.db.permission_definitions.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          permission_key: true,
          permission_name: true,
          description: true,
          category: true,
          is_system: true,
          is_active: true,
          created_at: true,
          updated_at: true,
        },
      });

      if (!permission) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Permission definition not found',
        });
      }

      return permission;
    }),

  /**
   * Get permission by key
   */
  getByKey: publicProcedure
    .input(z.object({ permission_key: z.string() }))
    .query(async ({ ctx, input }) => {
      const permission = await ctx.db.permission_definitions.findUnique({
        where: { permission_key: input.permission_key },
        select: {
          id: true,
          permission_key: true,
          permission_name: true,
          description: true,
          category: true,
          is_system: true,
          is_active: true,
        },
      });

      if (!permission) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Permission definition not found',
        });
      }

      return permission;
    }),

  /**
   * Get all permissions (paginated)
   */
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(200).default(100),
        cursor: z.string().uuid().optional(),
        category: z.string().optional(),
        is_active: z.boolean().optional(),
        is_system: z.boolean().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, category, is_active, is_system, search } = input;

      const where: any = {};

      if (category) {
        where.category = category;
      }

      if (is_active !== undefined) {
        where.is_active = is_active;
      }

      if (is_system !== undefined) {
        where.is_system = is_system;
      }

      if (search) {
        where.OR = [
          { permission_key: { contains: search, mode: 'insensitive' } },
          { permission_name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const permissions = await ctx.db.permission_definitions.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { permission_key: 'asc' },
        select: {
          id: true,
          permission_key: true,
          permission_name: true,
          description: true,
          category: true,
          is_system: true,
          is_active: true,
          created_at: true,
        },
      });

      let nextCursor: string | undefined;
      if (permissions.length > limit) {
        const nextItem = permissions.pop();
        nextCursor = nextItem?.id;
      }

      return {
        permissions,
        nextCursor,
      };
    }),

  /**
   * Get active permissions
   */
  getActive: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const permissions = await ctx.db.permission_definitions.findMany({
        where: {
          is_active: true,
          ...(input.category && { category: input.category }),
        },
        orderBy: { permission_key: 'asc' },
        select: {
          id: true,
          permission_key: true,
          permission_name: true,
          description: true,
          category: true,
        },
      });

      return permissions;
    }),

  /**
   * Get permissions by category
   */
  getByCategory: protectedProcedure
    .input(z.object({ category: z.string() }))
    .query(async ({ ctx, input }) => {
      const permissions = await ctx.db.permission_definitions.findMany({
        where: {
          category: input.category,
        },
        orderBy: { permission_key: 'asc' },
        select: {
          id: true,
          permission_key: true,
          permission_name: true,
          description: true,
          is_system: true,
          is_active: true,
        },
      });

      return permissions;
    }),

  /**
   * Get all categories
   */
  getCategories: protectedProcedure.query(async ({ ctx }) => {
    const categories = await ctx.db.permission_definitions.groupBy({
      by: ['category'],
      _count: true,
      orderBy: {
        category: 'asc',
      },
    });

    return categories.map(cat => ({
      category: cat.category,
      count: cat._count,
    }));
  }),

  /**
   * Create permission definition
   */
  create: protectedProcedure
    .input(
      z.object({
        permission_key: z.string().min(1).max(100),
        permission_name: z.string().min(1).max(150),
        description: z.string().optional(),
        category: z.string().max(50).optional(),
        is_system: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check for duplicate key
      const existing = await ctx.db.permission_definitions.findUnique({
        where: { permission_key: input.permission_key },
        select: { id: true },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Permission key already exists',
        });
      }

      const newPermission = await ctx.db.permission_definitions.create({
        data: {
          permission_key: input.permission_key,
          permission_name: input.permission_name,
          description: input.description,
          category: input.category,
          is_system: input.is_system,
          is_active: true,
        },
        select: {
          id: true,
          permission_key: true,
          permission_name: true,
          description: true,
          category: true,
        },
      });

      return newPermission;
    }),

  /**
   * Update permission definition
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        permission_name: z.string().min(1).max(150).optional(),
        description: z.string().optional(),
        category: z.string().max(50).optional(),
        is_active: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const permission = await ctx.db.permission_definitions.findUnique({
        where: { id: input.id },
        select: { id: true, is_system: true },
      });

      if (!permission) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Permission definition not found',
        });
      }

      // Prevent modifying system permissions
      if (permission.is_system && input.is_active === false) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot deactivate system permissions',
        });
      }

      const { id: _id, ...updateData } = input;

      const updatedPermission = await ctx.db.permission_definitions.update({
        where: { id: input.id },
        data: {
          ...updateData,
          updated_at: new Date(),
        },
        select: {
          id: true,
          permission_key: true,
          permission_name: true,
          description: true,
          category: true,
          is_active: true,
          updated_at: true,
        },
      });

      return updatedPermission;
    }),

  /**
   * Activate permission
   */
  activate: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const updatedPermission = await ctx.db.permission_definitions.update({
        where: { id: input.id },
        data: {
          is_active: true,
          updated_at: new Date(),
        },
        select: {
          id: true,
          permission_key: true,
          is_active: true,
        },
      });

      return updatedPermission;
    }),

  /**
   * Deactivate permission (only non-system)
   */
  deactivate: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const permission = await ctx.db.permission_definitions.findUnique({
        where: { id: input.id },
        select: { id: true, is_system: true },
      });

      if (!permission) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Permission definition not found',
        });
      }

      if (permission.is_system) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot deactivate system permissions',
        });
      }

      const updatedPermission = await ctx.db.permission_definitions.update({
        where: { id: input.id },
        data: {
          is_active: false,
          updated_at: new Date(),
        },
        select: {
          id: true,
          permission_key: true,
          is_active: true,
        },
      });

      return updatedPermission;
    }),

  /**
   * Get statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, active, system, byCategory] = await Promise.all([
      ctx.db.permission_definitions.count(),
      ctx.db.permission_definitions.count({ where: { is_active: true } }),
      ctx.db.permission_definitions.count({ where: { is_system: true } }),
      ctx.db.permission_definitions.groupBy({
        by: ['category'],
        _count: true,
      }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      system,
      custom: total - system,
      byCategory: byCategory.map(cat => ({
        category: cat.category,
        count: cat._count,
      })),
    };
  }),
});

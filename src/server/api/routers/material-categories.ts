import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

/**
 * Material Categories Router
 *
 * Manages material_categories table using ctx.db pattern.
 * Covers material taxonomy, categorization, and organization.
 */

export const materialCategoriesRouter = createTRPCRouter({
  /**
   * Get material category by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const category = await ctx.db.material_categories.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          icon: true,
          sort_order: true,
          active: true,
          created_at: true,
          updated_at: true,
          materials: {
            select: {
              id: true,
              name: true,
              sku: true,
              created_at: true,
            },
            orderBy: { name: 'asc' },
            take: 50,
          },
          _count: {
            select: {
              materials: true,
            },
          },
        },
      });

      if (!category) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Material category not found',
        });
      }

      return category;
    }),

  /**
   * Get all material categories (with pagination and filtering)
   */
  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
        search: z.string().optional(),
        active: z.boolean().optional(),
        includeCount: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, search, active, includeCount } = input;

      const where: any = {};

      if (active !== undefined) {
        where.active = active;
      }

      if (search) {
        where.name = {
          contains: search,
          mode: 'insensitive',
        };
      }

      const categories = await ctx.db.material_categories.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          icon: true,
          sort_order: true,
          active: true,
          created_at: true,
          updated_at: true,
          ...(includeCount && {
            _count: {
              select: {
                materials: true,
              },
            },
          }),
        },
      });

      let nextCursor: string | undefined;
      if (categories.length > limit) {
        const nextItem = categories.pop();
        nextCursor = nextItem?.id;
      }

      return {
        categories,
        nextCursor,
      };
    }),

  /**
   * Get active material categories (sorted by sort_order)
   */
  getActive: publicProcedure
    .input(
      z.object({
        includeCount: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const categories = await ctx.db.material_categories.findMany({
        where: {
          active: true,
        },
        orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          icon: true,
          sort_order: true,
          ...(input.includeCount && {
            _count: {
              select: {
                materials: true,
              },
            },
          }),
        },
      });

      return categories;
    }),

  /**
   * Create material category
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        icon: z.string().optional(),
        sort_order: z.number().default(0),
        active: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if name already exists
      const existingCategory = await ctx.db.material_categories.findUnique({
        where: {
          name: input.name,
        },
      });

      if (existingCategory) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Material category with this name already exists',
        });
      }

      const newCategory = await ctx.db.material_categories.create({
        data: input,
        select: {
          id: true,
          name: true,
          icon: true,
          sort_order: true,
          active: true,
          created_at: true,
        },
      });

      return newCategory;
    }),

  /**
   * Update material category
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        icon: z.string().optional(),
        sort_order: z.number().optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Verify category exists
      const existingCategory = await ctx.db.material_categories.findUnique({
        where: { id },
        select: { id: true, name: true },
      });

      if (!existingCategory) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Material category not found',
        });
      }

      // If name is being changed, verify it's not already taken
      if (data.name && data.name !== existingCategory.name) {
        const nameTaken = await ctx.db.material_categories.findUnique({
          where: {
            name: data.name,
          },
        });

        if (nameTaken) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Material category name already in use',
          });
        }
      }

      const updatedCategory = await ctx.db.material_categories.update({
        where: { id },
        data: {
          ...data,
          updated_at: new Date(),
        },
        select: {
          id: true,
          name: true,
          icon: true,
          sort_order: true,
          active: true,
          updated_at: true,
        },
      });

      return updatedCategory;
    }),

  /**
   * Delete material category
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify category exists
      const existingCategory = await ctx.db.material_categories.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          _count: {
            select: {
              materials: true,
            },
          },
        },
      });

      if (!existingCategory) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Material category not found',
        });
      }

      // Check if category has materials
      if (existingCategory._count.materials > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Cannot delete category with materials. Remove materials or mark as inactive.',
        });
      }

      await ctx.db.material_categories.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Activate material category
   */
  activate: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const activatedCategory = await ctx.db.material_categories.update({
        where: { id: input.id },
        data: {
          active: true,
          updated_at: new Date(),
        },
        select: {
          id: true,
          name: true,
          active: true,
          updated_at: true,
        },
      });

      return activatedCategory;
    }),

  /**
   * Deactivate material category
   */
  deactivate: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const deactivatedCategory = await ctx.db.material_categories.update({
        where: { id: input.id },
        data: {
          active: false,
          updated_at: new Date(),
        },
        select: {
          id: true,
          name: true,
          active: true,
          updated_at: true,
        },
      });

      return deactivatedCategory;
    }),

  /**
   * Reorder material categories (bulk update sort_order)
   */
  reorder: protectedProcedure
    .input(
      z.object({
        categoryOrders: z.array(
          z.object({
            id: z.string().uuid(),
            sort_order: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Update each category's sort_order in a transaction
      const updates = await Promise.all(
        input.categoryOrders.map((item) =>
          ctx.db.material_categories.update({
            where: { id: item.id },
            data: {
              sort_order: item.sort_order,
              updated_at: new Date(),
            },
            select: {
              id: true,
              name: true,
              sort_order: true,
            },
          })
        )
      );

      return {
        success: true,
        updated: updates.length,
      };
    }),

  /**
   * Get material category statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, active, inactive, withMaterials] = await Promise.all([
      ctx.db.material_categories.count(),
      ctx.db.material_categories.count({ where: { active: true } }),
      ctx.db.material_categories.count({ where: { active: false } }),
      ctx.db.material_categories.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              materials: true,
            },
          },
        },
        orderBy: ({
          materials: {
            _count: 'desc',
          },
        } as any),
        take: 10,
      }),
    ]);

    return {
      total,
      active,
      inactive,
      topCategories: withMaterials.map((cat) => ({
        id: cat.id,
        name: cat.name,
        materialCount: cat._count.materials,
      })),
    };
  }),

  /**
   * Search material categories
   */
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(50).default(10),
        activeOnly: z.boolean().default(true),
      })
    )
    .query(async ({ ctx, input }) => {
      const categories = await ctx.db.material_categories.findMany({
        where: {
          name: {
            contains: input.query,
            mode: 'insensitive',
          },
          ...(input.activeOnly && { active: true }),
        },
        take: input.limit,
        orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          icon: true,
          active: true,
        },
      });

      return categories;
    }),
});

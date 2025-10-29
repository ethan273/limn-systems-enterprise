import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

/**
 * Cost Tracking Router
 *
 * Manages cost_tracking table using ctx.db pattern.
 * Tracks costs associated with projects, orders, or production.
 */

export const costTrackingRouter = createTRPCRouter({
  /**
   * Get cost record by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const cost = await ctx.db.cost_tracking.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          entity_type: true,
          entity_id: true,
          cost_category: true,
          amount: true,
          currency: true,
          description: true,
          recorded_by: true,
          recorded_at: true,
          created_at: true,
          updated_at: true,
          user_profiles: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!cost) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Cost record not found',
        });
      }

      return cost;
    }),

  /**
   * Get all cost records (paginated)
   */
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
        entity_type: z.string().optional(),
        entity_id: z.string().uuid().optional(),
        cost_category: z.string().optional(),
        recorded_by: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, entity_type, entity_id, cost_category, recorded_by } = input;

      const where: any = {};

      if (entity_type) {
        where.entity_type = entity_type;
      }

      if (entity_id) {
        where.entity_id = entity_id;
      }

      if (cost_category) {
        where.cost_category = cost_category;
      }

      if (recorded_by) {
        where.recorded_by = recorded_by;
      }

      const costs = await ctx.db.cost_tracking.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { recorded_at: 'desc' },
        select: {
          id: true,
          entity_type: true,
          entity_id: true,
          cost_category: true,
          amount: true,
          currency: true,
          description: true,
          recorded_by: true,
          recorded_at: true,
          user_profiles: {
            select: {
              name: true,
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (costs.length > limit) {
        const nextItem = costs.pop();
        nextCursor = nextItem?.id;
      }

      return {
        costs,
        nextCursor,
      };
    }),

  /**
   * Get costs for entity
   */
  getByEntity: protectedProcedure
    .input(
      z.object({
        entity_type: z.string(),
        entity_id: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const costs = await ctx.db.cost_tracking.findMany({
        where: {
          entity_type: input.entity_type,
          entity_id: input.entity_id,
        },
        orderBy: { recorded_at: 'desc' },
        select: {
          id: true,
          cost_category: true,
          amount: true,
          currency: true,
          description: true,
          recorded_by: true,
          recorded_at: true,
          user_profiles: {
            select: {
              name: true,
            },
          },
        },
      });

      return costs;
    }),

  /**
   * Get cost summary for entity
   */
  getSummary: protectedProcedure
    .input(
      z.object({
        entity_type: z.string(),
        entity_id: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const costs = await ctx.db.cost_tracking.findMany({
        where: {
          entity_type: input.entity_type,
          entity_id: input.entity_id,
        },
        select: {
          amount: true,
          currency: true,
          cost_category: true,
        },
      });

      // Group by currency and category
      const byCurrency: Record<string, number> = {};
      const byCategory: Record<string, number> = {};

      for (const cost of costs) {
        const currency = cost.currency || 'USD';
        const category = cost.cost_category || 'uncategorized';
        const amount = Number(cost.amount) || 0;

        byCurrency[currency] = (byCurrency[currency] || 0) + amount;
        byCategory[category] = (byCategory[category] || 0) + amount;
      }

      return {
        totalCosts: costs.length,
        byCurrency: Object.entries(byCurrency).map(([currency, total]) => ({
          currency,
          total,
        })),
        byCategory: Object.entries(byCategory).map(([category, total]) => ({
          category,
          total,
        })),
      };
    }),

  /**
   * Create cost record
   */
  create: protectedProcedure
    .input(
      z.object({
        entity_type: z.string(),
        entity_id: z.string().uuid(),
        cost_category: z.string(),
        amount: z.number().positive(),
        currency: z.string().default('USD'),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const newCost = await ctx.db.cost_tracking.create({
        data: {
          entity_type: input.entity_type,
          entity_id: input.entity_id,
          cost_category: input.cost_category,
          amount: input.amount,
          currency: input.currency,
          description: input.description,
          recorded_by: ctx.user!.id,
          recorded_at: new Date(),
        },
        select: {
          id: true,
          entity_type: true,
          entity_id: true,
          cost_category: true,
          amount: true,
          currency: true,
          recorded_at: true,
        },
      });

      return newCost;
    }),

  /**
   * Update cost record
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        cost_category: z.string().optional(),
        amount: z.number().positive().optional(),
        currency: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const cost = await ctx.db.cost_tracking.findUnique({
        where: { id: input.id },
        select: { id: true },
      });

      if (!cost) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Cost record not found',
        });
      }

      const { id: _id, ...updateData } = input;

      const updated = await ctx.db.cost_tracking.update({
        where: { id: input.id },
        data: {
          ...updateData,
          updated_at: new Date(),
        },
        select: {
          id: true,
          cost_category: true,
          amount: true,
          currency: true,
          description: true,
          updated_at: true,
        },
      });

      return updated;
    }),

  /**
   * Delete cost record
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const cost = await ctx.db.cost_tracking.findUnique({
        where: { id: input.id },
        select: { id: true },
      });

      if (!cost) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Cost record not found',
        });
      }

      await ctx.db.cost_tracking.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Get statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, byCategory, byEntityType] = await Promise.all([
      ctx.db.cost_tracking.count(),
      ctx.db.cost_tracking.groupBy({
        by: ['cost_category'],
        _count: true,
        _sum: {
          amount: true,
        },
        orderBy: {
          _sum: {
            amount: 'desc',
          },
        },
      }),
      ctx.db.cost_tracking.groupBy({
        by: ['entity_type'],
        _count: true,
        _sum: {
          amount: true,
        },
      }),
    ]);

    return {
      total,
      byCategory: byCategory.map(c => ({
        category: c.cost_category,
        count: c._count,
        total_amount: c._sum.amount || 0,
      })),
      byEntityType: byEntityType.map(e => ({
        entity_type: e.entity_type,
        count: e._count,
        total_amount: e._sum.amount || 0,
      })),
    };
  }),
});

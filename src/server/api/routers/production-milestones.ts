import { log } from '@/lib/logger';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';
import { triggerProductionMilestone } from '@/lib/notifications/triggers';

export const productionMilestonesRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const milestone = await ctx.db.production_milestones.findUnique({
        where: { id: input.id },
        include: { production_orders: true },
      });
      if (!milestone) throw new TRPCError({ code: 'NOT_FOUND', message: 'Milestone not found' });
      return milestone;
    }),

  getAll: protectedProcedure
    .input(z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
        production_order_id: z.string().uuid().optional(),
        status: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, production_order_id, status } = input;
      const where: any = {};
      if (production_order_id) where.production_order_id = production_order_id;
      if (status) where.status = status;

      const milestones = await ctx.db.production_milestones.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { target_date: 'asc' },
      });

      let nextCursor: string | undefined;
      if (milestones.length > limit) {
        nextCursor = milestones.pop()?.id;
      }
      return { milestones, nextCursor };
    }),

  getByProductionOrder: protectedProcedure
    .input(z.object({ production_order_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.production_milestones.findMany({
        where: { production_order_id: input.production_order_id },
        orderBy: { target_date: 'asc' },
      });
    }),

  create: protectedProcedure
    .input(z.object({
        production_order_id: z.string().uuid(),
        order_id: z.string().uuid(),
        milestone_name: z.string(),
        target_date: z.date(),
        status: z.string().default('pending'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.production_milestones.create({
        data: { ...input, created_by: ctx.user!.id },
      });
    }),

  update: protectedProcedure
    .input(z.object({
        id: z.string().uuid(),
        status: z.string().optional(),
        completed_date: z.date().optional().nullable(),
        notes: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Get milestone with related data for notifications
      const milestone = await ctx.db.production_milestones.findUnique({
        where: { id },
        include: {
          production_orders: {
            include: {
              orders: {
                select: {
                  id: true,
                  order_number: true,
                  customer_id: true,
                },
              },
            },
          },
        },
      });

      const updatedMilestone = await ctx.db.production_milestones.update({
        where: { id },
        data: { ...updateData, updated_at: new Date() },
      });

      // Trigger notification if status changed to completed
      if (input.status === 'completed' && milestone?.production_orders?.orders) {
        await triggerProductionMilestone({
          orderId: milestone.production_orders.orders.id,
          orderNumber: milestone.production_orders.orders.order_number,
          milestone: milestone.milestone_name,
          productionStage: input.status,
          customerId: milestone.production_orders.orders.customer_id,
        }).catch((error) => {
          log.error('[Production Milestones] Failed to send notification:', error);
        });
      }

      return updatedMilestone;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.production_milestones.delete({ where: { id: input.id } });
      return { success: true };
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, byStatus] = await Promise.all([
      ctx.db.production_milestones.count(),
      ctx.db.production_milestones.groupBy({ by: ['status'], _count: true }),
    ]);
    return { total, byStatus: byStatus.map(s => ({ status: s.status, count: s._count })) };
  }),
});

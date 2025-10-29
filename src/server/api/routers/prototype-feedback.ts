import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

export const prototypeFeedbackRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const feedback = await ctx.db.prototype_feedback.findUnique({
        where: { id: input.id },
        include: { prototypes: true, user_profiles: true },
      });
      if (!feedback) throw new TRPCError({ code: 'NOT_FOUND', message: 'Feedback not found' });
      return feedback;
    }),

  getAll: protectedProcedure
    .input(z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
        prototype_id: z.string().uuid().optional(),
        feedback_type: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, prototype_id, feedback_type } = input;
      const where: any = {};
      if (prototype_id) where.prototype_id = prototype_id;
      if (feedback_type) where.feedback_type = feedback_type;

      const feedbacks = await ctx.db.prototype_feedback.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { submitted_at: 'desc' },
        include: { user_profiles: { select: { name: true } } },
      });

      let nextCursor: string | undefined;
      if (feedbacks.length > limit) {
        nextCursor = feedbacks.pop()?.id;
      }
      return { feedbacks, nextCursor };
    }),

  getByPrototype: protectedProcedure
    .input(z.object({ prototype_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.prototype_feedback.findMany({
        where: { prototype_id: input.prototype_id },
        orderBy: { submitted_at: 'desc' },
        include: { user_profiles: { select: { name: true, email: true } } },
      });
    }),

  create: protectedProcedure
    .input(z.object({
        prototype_id: z.string().uuid(),
        reviewer_id: z.string().uuid(),
        feedback_type: z.string(),
        comments: z.string(),
        rating: z.number().int().min(1).max(5).optional(),
        attachments: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.prototype_feedback.create({
        data: { ...input, submitted_at: new Date(), submitted_by: ctx.user!.id },
      });
    }),

  update: protectedProcedure
    .input(z.object({
        id: z.string().uuid(),
        comments: z.string().optional(),
        rating: z.number().int().min(1).max(5).optional(),
        attachments: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      return await ctx.db.prototype_feedback.update({
        where: { id },
        data: updateData,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.prototype_feedback.delete({ where: { id: input.id } });
      return { success: true };
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, byType, avgRating] = await Promise.all([
      ctx.db.prototype_feedback.count(),
      ctx.db.prototype_feedback.groupBy({ by: ['feedback_type'], _count: true }),
      ctx.db.prototype_feedback.aggregate({ _avg: { rating: true } }),
    ]);
    return {
      total,
      byType: byType.map(t => ({ type: t.feedback_type, count: t._count })),
      avgRating: avgRating._avg.rating || 0,
    };
  }),
});

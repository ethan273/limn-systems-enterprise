import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

export const flipbookConversionsRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const conversion = await ctx.db.flipbook_conversions.findUnique({
        where: { id: input.id },
      });
      if (!conversion) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversion not found' });
      }
      return conversion;
    }),

  getAll: protectedProcedure
    .input(z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
        flipbook_id: z.string().uuid().optional(),
        status: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, flipbook_id, status } = input;
      const where: any = {};
      if (flipbook_id) where.flipbook_id = flipbook_id;
      if (status) where.status = status;

      const conversions = await ctx.db.flipbook_conversions.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { started_at: 'desc' },
      });

      let nextCursor: string | undefined;
      if (conversions.length > limit) {
        const nextItem = conversions.pop();
        nextCursor = nextItem?.id;
      }
      return { conversions, nextCursor };
    }),

  getByFlipbook: protectedProcedure
    .input(z.object({ flipbook_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.flipbook_conversions.findMany({
        where: { flipbook_id: input.flipbook_id },
        orderBy: { started_at: 'desc' },
      });
    }),

  create: protectedProcedure
    .input(z.object({
        flipbook_id: z.string().uuid(),
        source_file_url: z.string().url(),
        status: z.string().default('pending'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.flipbook_conversions.create({
        data: { ...input, started_at: new Date(), started_by: ctx.user!.id },
      });
    }),

  update: protectedProcedure
    .input(z.object({
        id: z.string().uuid(),
        status: z.string().optional(),
        completed_at: z.date().optional(),
        error_message: z.string().optional().nullable(),
        pages_converted: z.number().int().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      return await ctx.db.flipbook_conversions.update({
        where: { id },
        data: updateData,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.flipbook_conversions.delete({ where: { id: input.id } });
      return { success: true };
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, byStatus] = await Promise.all([
      ctx.db.flipbook_conversions.count(),
      ctx.db.flipbook_conversions.groupBy({ by: ['status'], _count: true }),
    ]);
    return {
      total,
      byStatus: byStatus.map(s => ({ status: s.status, count: s._count })),
    };
  }),
});

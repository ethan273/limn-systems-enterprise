import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

export const manufacturerCommunicationsRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const comm = await ctx.db.manufacturer_communications.findUnique({
        where: { id: input.id },
        include: { manufacturers: true, user_profiles: true },
      });
      if (!comm) throw new TRPCError({ code: 'NOT_FOUND', message: 'Communication not found' });
      return comm;
    }),

  getAll: protectedProcedure
    .input(z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
        manufacturer_id: z.string().uuid().optional(),
        communication_type: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, manufacturer_id, communication_type } = input;
      const where: any = {};
      if (manufacturer_id) where.manufacturer_id = manufacturer_id;
      if (communication_type) where.communication_type = communication_type;

      const communications = await ctx.db.manufacturer_communications.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { sent_at: 'desc' },
        include: { manufacturers: { select: { name: true } }, user_profiles: { select: { name: true } } },
      });

      let nextCursor: string | undefined;
      if (communications.length > limit) {
        nextCursor = communications.pop()?.id;
      }
      return { communications, nextCursor };
    }),

  getByManufacturer: protectedProcedure
    .input(z.object({ manufacturer_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.manufacturer_communications.findMany({
        where: { manufacturer_id: input.manufacturer_id },
        orderBy: { sent_at: 'desc' },
        include: { user_profiles: { select: { name: true, email: true } } },
      });
    }),

  create: protectedProcedure
    .input(z.object({
        manufacturer_id: z.string().uuid(),
        project_id: z.string().uuid().optional(),
        communication_type: z.string(),
        subject: z.string(),
        message: z.string(),
        attachments: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.manufacturer_communications.create({
        data: { ...input, sent_by: ctx.user!.id, sent_at: new Date() },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.manufacturer_communications.delete({ where: { id: input.id } });
      return { success: true };
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, byType] = await Promise.all([
      ctx.db.manufacturer_communications.count(),
      ctx.db.manufacturer_communications.groupBy({ by: ['communication_type'], _count: true }),
    ]);
    return { total, byType: byType.map(t => ({ type: t.communication_type, count: t._count })) };
  }),
});

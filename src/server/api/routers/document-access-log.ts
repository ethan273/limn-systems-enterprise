import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

/**
 * Document Access Log Router
 *
 * Manages document_access_log table using ctx.db pattern.
 * Tracks document access and views
 */

export const LLDocumentAccessLogRouterRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const record = await ctx.db.document_access_log.findUnique({ where: { id: input.id } });
      if (!record) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Record not found' });
      }
      return record;
    }),

  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;

      const records = await ctx.db.document_access_log.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { created_at: 'desc' },
      });

      let nextCursor: string | undefined;
      if (records.length > limit) {
        const nextItem = records.pop();
        nextCursor = nextItem?.id;
      }

      return { records, nextCursor };
    }),

  create: protectedProcedure
    .input(z.any())
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.document_access_log.create({ data: input });
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string().uuid(), data: z.any() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.document_access_log.update({
        where: { id: input.id },
        data: input.data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.document_access_log.delete({ where: { id: input.id } });
      return { success: true };
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const total = await ctx.db.document_access_log.count();
    return { total };
  }),
});

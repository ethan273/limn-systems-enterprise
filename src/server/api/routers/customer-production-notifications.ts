import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

export const customerProductionNotificationsRouter = createTRPCRouter({
  getById: protectedProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
    const record = await ctx.db.customer_production_notifications.findUnique({ where: { id: input.id } });
    if (!record) throw new TRPCError({ code: 'NOT_FOUND' });
    return record;
  }),
  getAll: protectedProcedure.input(z.object({ limit: z.number().default(50), cursor: z.string().uuid().optional() })).query(async ({ ctx, input }) => {
    const records = await ctx.db.customer_production_notifications.findMany({ take: input.limit + 1, cursor: input.cursor ? { id: input.cursor } : undefined, orderBy: { created_at: 'desc' } });
    let nextCursor: string | undefined;
    if (records.length > input.limit) nextCursor = records.pop()?.id;
    return { records, nextCursor };
  }),
  create: protectedProcedure.input(z.any()).mutation(async ({ ctx, input }) => {
    return await ctx.db.customer_production_notifications.create({ data: input });
  }),
  update: protectedProcedure.input(z.object({ id: z.string().uuid(), data: z.any() })).mutation(async ({ ctx, input }) => {
    return await ctx.db.customer_production_notifications.update({ where: { id: input.id }, data: input.data });
  }),
  delete: protectedProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
    await ctx.db.customer_production_notifications.delete({ where: { id: input.id } });
    return { success: true };
  }),
  getStats: protectedProcedure.query(async ({ ctx }) => {
    return { total: await ctx.db.customer_production_notifications.count() };
  }),
});

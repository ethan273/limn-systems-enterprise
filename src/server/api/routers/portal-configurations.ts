import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

export const portalConfigurationsRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const config = await ctx.db.portal_configurations.findUnique({
        where: { id: input.id },
        include: { customer_portals: true, user_profiles: true },
      });
      if (!config) throw new TRPCError({ code: 'NOT_FOUND', message: 'Configuration not found' });
      return config;
    }),

  getAll: protectedProcedure
    .input(z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
        portal_id: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, portal_id } = input;
      const where: any = {};
      if (portal_id) where.portal_id = portal_id;

      const configurations = await ctx.db.portal_configurations.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { created_at: 'desc' },
      });

      let nextCursor: string | undefined;
      if (configurations.length > limit) {
        nextCursor = configurations.pop()?.id;
      }
      return { configurations, nextCursor };
    }),

  getByPortal: protectedProcedure
    .input(z.object({ portal_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.portal_configurations.findMany({
        where: { portal_id: input.portal_id },
        orderBy: { config_key: 'asc' },
      });
    }),

  create: protectedProcedure
    .input(z.object({
        portal_id: z.string().uuid(),
        config_key: z.string(),
        config_value: z.any(),
        config_type: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.portal_configurations.create({
        data: { ...input, created_by: ctx.user!.id },
      });
    }),

  update: protectedProcedure
    .input(z.object({
        id: z.string().uuid(),
        config_value: z.any(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.portal_configurations.update({
        where: { id: input.id },
        data: { config_value: input.config_value, updated_at: new Date() },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.portal_configurations.delete({ where: { id: input.id } });
      return { success: true };
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const total = await ctx.db.portal_configurations.count();
    return { total };
  }),
});

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

export const organizationPermissionsRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const perm = await ctx.db.organization_permissions.findUnique({
        where: { id: input.id },
        include: { organization_members: true },
      });
      if (!perm) throw new TRPCError({ code: 'NOT_FOUND', message: 'Permission not found' });
      return perm;
    }),

  getAll: protectedProcedure
    .input(z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
        member_id: z.string().uuid().optional(),
        permission_type: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, member_id, permission_type } = input;
      const where: any = {};
      if (member_id) where.member_id = member_id;
      if (permission_type) where.permission_type = permission_type;

      const permissions = await ctx.db.organization_permissions.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { created_at: 'desc' },
      });

      let nextCursor: string | undefined;
      if (permissions.length > limit) {
        nextCursor = permissions.pop()?.id;
      }
      return { permissions, nextCursor };
    }),

  getByMember: protectedProcedure
    .input(z.object({ member_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.organization_permissions.findMany({
        where: { member_id: input.member_id },
        orderBy: { permission_type: 'asc' },
      });
    }),

  create: protectedProcedure
    .input(z.object({
        member_id: z.string().uuid(),
        resource_type: z.string(),
        permission_type: z.string(),
        granted: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.organization_permissions.create({
        data: { ...input, granted_by: ctx.user!.id, granted_at: new Date() },
      });
    }),

  update: protectedProcedure
    .input(z.object({
        id: z.string().uuid(),
        granted: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.organization_permissions.update({
        where: { id: input.id },
        data: { granted: input.granted, updated_at: new Date() },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.organization_permissions.delete({ where: { id: input.id } });
      return { success: true };
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, byType] = await Promise.all([
      ctx.db.organization_permissions.count(),
      ctx.db.organization_permissions.groupBy({ by: ['permission_type'], _count: true }),
    ]);
    return { total, byType: byType.map(t => ({ type: t.permission_type, count: t._count })) };
  }),
});

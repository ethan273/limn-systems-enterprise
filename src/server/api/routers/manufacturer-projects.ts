import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

export const manufacturerProjectsRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.manufacturer_projects.findUnique({
        where: { id: input.id },
        include: { manufacturers: true, projects: true },
      });
      if (!project) throw new TRPCError({ code: 'NOT_FOUND', message: 'Manufacturer project not found' });
      return project;
    }),

  getAll: protectedProcedure
    .input(z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
        manufacturer_id: z.string().uuid().optional(),
        project_id: z.string().uuid().optional(),
        status: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, manufacturer_id, project_id, status } = input;
      const where: any = {};
      if (manufacturer_id) where.manufacturer_id = manufacturer_id;
      if (project_id) where.project_id = project_id;
      if (status) where.status = status;

      const projects = await ctx.db.manufacturer_projects.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { created_at: 'desc' },
        include: {
          manufacturers: { select: { name: true } },
          projects: { select: { name: true } },
        },
      });

      let nextCursor: string | undefined;
      if (projects.length > limit) {
        nextCursor = projects.pop()?.id;
      }
      return { projects, nextCursor };
    }),

  getByManufacturer: protectedProcedure
    .input(z.object({ manufacturer_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.manufacturer_projects.findMany({
        where: { manufacturer_id: input.manufacturer_id },
        orderBy: { created_at: 'desc' },
        include: { projects: { select: { name: true, status: true } } },
      });
    }),

  getByProject: protectedProcedure
    .input(z.object({ project_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.manufacturer_projects.findMany({
        where: { project_id: input.project_id },
        include: { manufacturers: { select: { name: true, contact_email: true } } },
      });
    }),

  create: protectedProcedure
    .input(z.object({
        manufacturer_id: z.string().uuid(),
        project_id: z.string().uuid(),
        role: z.string().optional(),
        status: z.string().default('active'),
        start_date: z.date().optional(),
        end_date: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.manufacturer_projects.create({ data: { ...input, assigned_by: ctx.user!.id } });
    }),

  update: protectedProcedure
    .input(z.object({
        id: z.string().uuid(),
        role: z.string().optional(),
        status: z.string().optional(),
        start_date: z.date().optional(),
        end_date: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      return await ctx.db.manufacturer_projects.update({ where: { id }, data: updateData });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.manufacturer_projects.delete({ where: { id: input.id } });
      return { success: true };
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, byStatus] = await Promise.all([
      ctx.db.manufacturer_projects.count(),
      ctx.db.manufacturer_projects.groupBy({ by: ['status'], _count: true }),
    ]);
    return { total, byStatus: byStatus.map(s => ({ status: s.status, count: s._count })) };
  }),
});

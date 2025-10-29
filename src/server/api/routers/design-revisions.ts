import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

/**
 * Design Revisions Router
 *
 * Manages design_revisions table using ctx.db pattern.
 * Tracks design version history and changes.
 */

export const designRevisionsRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const revision = await ctx.db.design_revisions.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          design_id: true,
          project_id: true,
          revision_number: true,
          changes_description: true,
          revised_by: true,
          revision_date: true,
          files_url: true,
          status: true,
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

      if (!revision) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Revision not found' });
      }

      return revision;
    }),

  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
        design_id: z.string().uuid().optional(),
        project_id: z.string().uuid().optional(),
        revised_by: z.string().uuid().optional(),
        status: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, design_id, project_id, revised_by, status } = input;

      const where: any = {};
      if (design_id) where.design_id = design_id;
      if (project_id) where.project_id = project_id;
      if (revised_by) where.revised_by = revised_by;
      if (status) where.status = status;

      const revisions = await ctx.db.design_revisions.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { revision_date: 'desc' },
        select: {
          id: true,
          design_id: true,
          project_id: true,
          revision_number: true,
          changes_description: true,
          revised_by: true,
          revision_date: true,
          status: true,
          user_profiles: {
            select: { name: true },
          },
        },
      });

      let nextCursor: string | undefined;
      if (revisions.length > limit) {
        const nextItem = revisions.pop();
        nextCursor = nextItem?.id;
      }

      return { revisions, nextCursor };
    }),

  getByDesign: protectedProcedure
    .input(z.object({ design_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const revisions = await ctx.db.design_revisions.findMany({
        where: { design_id: input.design_id },
        orderBy: { revision_number: 'desc' },
        select: {
          id: true,
          revision_number: true,
          changes_description: true,
          revised_by: true,
          revision_date: true,
          files_url: true,
          status: true,
          user_profiles: {
            select: { name: true, email: true },
          },
        },
      });

      return revisions;
    }),

  create: protectedProcedure
    .input(
      z.object({
        design_id: z.string().uuid(),
        project_id: z.string().uuid(),
        revision_number: z.number().int().positive(),
        changes_description: z.string(),
        files_url: z.string().url().optional(),
        status: z.string().default('draft'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const newRevision = await ctx.db.design_revisions.create({
        data: {
          ...input,
          revised_by: ctx.user!.id,
          revision_date: new Date(),
        },
        select: {
          id: true,
          design_id: true,
          revision_number: true,
          changes_description: true,
          revision_date: true,
        },
      });

      return newRevision;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        changes_description: z.string().optional(),
        files_url: z.string().url().optional().nullable(),
        status: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      const updated = await ctx.db.design_revisions.update({
        where: { id },
        data: { ...updateData, updated_at: new Date() },
        select: {
          id: true,
          changes_description: true,
          files_url: true,
          status: true,
          updated_at: true,
        },
      });

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.design_revisions.delete({ where: { id: input.id } });
      return { success: true };
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, byStatus] = await Promise.all([
      ctx.db.design_revisions.count(),
      ctx.db.design_revisions.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    return {
      total,
      byStatus: byStatus.map(s => ({ status: s.status, count: s._count })),
    };
  }),
});

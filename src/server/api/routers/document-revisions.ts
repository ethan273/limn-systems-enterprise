import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

/**
 * Document Revisions Router
 *
 * Manages document_revisions table using ctx.db pattern.
 * Tracks document version history and changes.
 */

export const documentRevisionsRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const revision = await ctx.db.document_revisions.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          document_id: true,
          version_number: true,
          content_snapshot: true,
          changes_summary: true,
          revised_by: true,
          revision_date: true,
          file_url: true,
          file_size: true,
          created_at: true,
          documents: {
            select: {
              id: true,
              title: true,
            },
          },
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
        document_id: z.string().uuid().optional(),
        revised_by: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, document_id, revised_by } = input;

      const where: any = {};
      if (document_id) where.document_id = document_id;
      if (revised_by) where.revised_by = revised_by;

      const revisions = await ctx.db.document_revisions.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { revision_date: 'desc' },
        select: {
          id: true,
          document_id: true,
          version_number: true,
          changes_summary: true,
          revised_by: true,
          revision_date: true,
          file_size: true,
          user_profiles: {
            select: { name: true },
          },
          documents: {
            select: { title: true },
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

  getByDocument: protectedProcedure
    .input(z.object({ document_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const revisions = await ctx.db.document_revisions.findMany({
        where: { document_id: input.document_id },
        orderBy: { version_number: 'desc' },
        select: {
          id: true,
          version_number: true,
          changes_summary: true,
          revised_by: true,
          revision_date: true,
          file_url: true,
          file_size: true,
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
        document_id: z.string().uuid(),
        version_number: z.number().int().positive(),
        content_snapshot: z.any().optional(),
        changes_summary: z.string(),
        file_url: z.string().url().optional(),
        file_size: z.number().int().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const newRevision = await ctx.db.document_revisions.create({
        data: {
          ...input,
          revised_by: ctx.user!.id,
          revision_date: new Date(),
        },
        select: {
          id: true,
          document_id: true,
          version_number: true,
          changes_summary: true,
          revision_date: true,
        },
      });

      return newRevision;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.document_revisions.delete({ where: { id: input.id } });
      return { success: true };
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, byDocument] = await Promise.all([
      ctx.db.document_revisions.count(),
      ctx.db.document_revisions.groupBy({
        by: ['document_id'],
        _count: true,
        orderBy: { _count: { document_id: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      total,
      topDocuments: byDocument.map(d => ({ document_id: d.document_id, revision_count: d._count })),
    };
  }),
});

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

/**
 * Document Comments Router
 *
 * Manages document_comments table using ctx.db pattern.
 * Covers threaded comments, mentions, and comment resolution workflows.
 */

export const documentCommentsRouter = createTRPCRouter({
  /**
   * Get comment by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const comment = await ctx.db.document_comments.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          document_id: true,
          revision_id: true,
          comment_text: true,
          commented_by: true,
          parent_comment_id: true,
          mentioned_users: true,
          is_resolved: true,
          resolved_by: true,
          resolved_at: true,
          created_at: true,
          updated_at: true,
          user_profiles_document_comments_commented_byTouser_profiles: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          user_profiles_document_comments_resolved_byTouser_profiles: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!comment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Comment not found',
        });
      }

      return comment;
    }),

  /**
   * Get all comments (paginated)
   */
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
        document_id: z.string().uuid().optional(),
        revision_id: z.string().uuid().optional(),
        commented_by: z.string().uuid().optional(),
        is_resolved: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, document_id, revision_id, commented_by, is_resolved } = input;

      const where: any = {};

      if (document_id) {
        where.document_id = document_id;
      }

      if (revision_id) {
        where.revision_id = revision_id;
      }

      if (commented_by) {
        where.commented_by = commented_by;
      }

      if (is_resolved !== undefined) {
        where.is_resolved = is_resolved;
      }

      const comments = await ctx.db.document_comments.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          document_id: true,
          revision_id: true,
          comment_text: true,
          commented_by: true,
          parent_comment_id: true,
          is_resolved: true,
          created_at: true,
          user_profiles_document_comments_commented_byTouser_profiles: {
            select: {
              name: true,
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (comments.length > limit) {
        const nextItem = comments.pop();
        nextCursor = nextItem?.id;
      }

      return {
        comments,
        nextCursor,
      };
    }),

  /**
   * Get comments for document
   */
  getByDocument: protectedProcedure
    .input(
      z.object({
        document_id: z.string().uuid(),
        is_resolved: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const comments = await ctx.db.document_comments.findMany({
        where: {
          document_id: input.document_id,
          ...(input.is_resolved !== undefined && { is_resolved: input.is_resolved }),
        },
        orderBy: { created_at: 'asc' },
        select: {
          id: true,
          comment_text: true,
          commented_by: true,
          parent_comment_id: true,
          mentioned_users: true,
          is_resolved: true,
          resolved_by: true,
          resolved_at: true,
          created_at: true,
          user_profiles_document_comments_commented_byTouser_profiles: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          user_profiles_document_comments_resolved_byTouser_profiles: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return comments;
    }),

  /**
   * Get threaded comments (with replies)
   */
  getThreaded: protectedProcedure
    .input(z.object({ document_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Get all top-level comments (no parent)
      const topLevelComments = await ctx.db.document_comments.findMany({
        where: {
          document_id: input.document_id,
          parent_comment_id: null,
        },
        orderBy: { created_at: 'asc' },
        select: {
          id: true,
          comment_text: true,
          commented_by: true,
          mentioned_users: true,
          is_resolved: true,
          resolved_by: true,
          resolved_at: true,
          created_at: true,
          user_profiles_document_comments_commented_byTouser_profiles: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          other_document_comments: {
            orderBy: { created_at: 'asc' },
            select: {
              id: true,
              comment_text: true,
              commented_by: true,
              created_at: true,
              user_profiles_document_comments_commented_byTouser_profiles: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      return topLevelComments;
    }),

  /**
   * Get comments by user
   */
  getByUser: protectedProcedure
    .input(
      z.object({
        user_id: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const comments = await ctx.db.document_comments.findMany({
        where: {
          commented_by: input.user_id,
        },
        take: input.limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          document_id: true,
          comment_text: true,
          is_resolved: true,
          created_at: true,
        },
      });

      return comments;
    }),

  /**
   * Get my comments
   */
  getMy: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }))
    .query(async ({ ctx, input }) => {
      const comments = await ctx.db.document_comments.findMany({
        where: {
          commented_by: ctx.user!.id,
        },
        take: input.limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          document_id: true,
          comment_text: true,
          is_resolved: true,
          created_at: true,
        },
      });

      return comments;
    }),

  /**
   * Get comments mentioning user
   */
  getMentioning: protectedProcedure
    .input(
      z.object({
        user_id: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = input.user_id || ctx.user!.id;

      const comments = await ctx.db.document_comments.findMany({
        where: {
          mentioned_users: {
            has: userId,
          },
        },
        take: input.limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          document_id: true,
          comment_text: true,
          commented_by: true,
          is_resolved: true,
          created_at: true,
          user_profiles_document_comments_commented_byTouser_profiles: {
            select: {
              name: true,
            },
          },
        },
      });

      return comments;
    }),

  /**
   * Get unresolved comments
   */
  getUnresolved: protectedProcedure
    .input(z.object({ document_id: z.string().uuid().optional() }))
    .query(async ({ ctx, input }) => {
      const where: any = {
        is_resolved: false,
      };

      if (input.document_id) {
        where.document_id = input.document_id;
      }

      const comments = await ctx.db.document_comments.findMany({
        where,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          document_id: true,
          comment_text: true,
          commented_by: true,
          created_at: true,
          user_profiles_document_comments_commented_byTouser_profiles: {
            select: {
              name: true,
            },
          },
        },
      });

      return comments;
    }),

  /**
   * Create comment
   */
  create: protectedProcedure
    .input(
      z.object({
        document_id: z.string().uuid(),
        revision_id: z.string().uuid().optional(),
        comment_text: z.string().min(1),
        parent_comment_id: z.string().uuid().optional(),
        mentioned_users: z.array(z.string().uuid()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify parent comment exists if provided
      if (input.parent_comment_id) {
        const parentComment = await ctx.db.document_comments.findUnique({
          where: { id: input.parent_comment_id },
          select: { id: true, document_id: true },
        });

        if (!parentComment) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Parent comment not found',
          });
        }

        if (parentComment.document_id !== input.document_id) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Parent comment must be from the same document',
          });
        }
      }

      const newComment = await ctx.db.document_comments.create({
        data: {
          document_id: input.document_id,
          revision_id: input.revision_id,
          comment_text: input.comment_text,
          commented_by: ctx.user!.id,
          parent_comment_id: input.parent_comment_id,
          mentioned_users: input.mentioned_users || [],
          is_resolved: false,
        },
        select: {
          id: true,
          document_id: true,
          comment_text: true,
          commented_by: true,
          parent_comment_id: true,
          mentioned_users: true,
          created_at: true,
        },
      });

      return newComment;
    }),

  /**
   * Update comment
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        comment_text: z.string().min(1).optional(),
        mentioned_users: z.array(z.string().uuid()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.db.document_comments.findUnique({
        where: { id: input.id },
        select: { id: true, commented_by: true },
      });

      if (!comment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Comment not found',
        });
      }

      if (comment.commented_by !== ctx.user!.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only update your own comments',
        });
      }

      const { id, ...updateData } = input;

      const updatedComment = await ctx.db.document_comments.update({
        where: { id: input.id },
        data: {
          ...updateData,
          updated_at: new Date(),
        },
        select: {
          id: true,
          comment_text: true,
          mentioned_users: true,
          updated_at: true,
        },
      });

      return updatedComment;
    }),

  /**
   * Resolve comment
   */
  resolve: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const resolvedComment = await ctx.db.document_comments.update({
        where: { id: input.id },
        data: {
          is_resolved: true,
          resolved_by: ctx.user!.id,
          resolved_at: new Date(),
          updated_at: new Date(),
        },
        select: {
          id: true,
          is_resolved: true,
          resolved_by: true,
          resolved_at: true,
        },
      });

      return resolvedComment;
    }),

  /**
   * Unresolve comment
   */
  unresolve: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const unresolvedComment = await ctx.db.document_comments.update({
        where: { id: input.id },
        data: {
          is_resolved: false,
          resolved_by: null,
          resolved_at: null,
          updated_at: new Date(),
        },
        select: {
          id: true,
          is_resolved: true,
        },
      });

      return unresolvedComment;
    }),

  /**
   * Delete comment
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.db.document_comments.findUnique({
        where: { id: input.id },
        select: { id: true, commented_by: true },
      });

      if (!comment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Comment not found',
        });
      }

      if (comment.commented_by !== ctx.user!.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own comments',
        });
      }

      await ctx.db.document_comments.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Get statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, resolved, unresolved, byUser] = await Promise.all([
      ctx.db.document_comments.count(),
      ctx.db.document_comments.count({ where: { is_resolved: true } }),
      ctx.db.document_comments.count({ where: { is_resolved: false } }),
      ctx.db.document_comments.groupBy({
        by: ['commented_by'],
        _count: true,
        orderBy: {
          _count: {
            commented_by: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    const resolutionRate = total > 0 ? Math.round((resolved / total) * 1000) / 10 : 0;

    return {
      total,
      resolved,
      unresolved,
      resolutionRate,
      topCommenters: byUser.map(u => ({
        user_id: u.commented_by,
        comment_count: u._count,
      })),
    };
  }),
});

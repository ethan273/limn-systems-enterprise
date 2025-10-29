import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

/**
 * Board Votes Router
 *
 * Manages board_votes table using ctx.db pattern.
 * Handles voting/feedback on design board objects.
 */

export const boardVotesRouter = createTRPCRouter({
  /**
   * Get vote by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const vote = await ctx.db.board_votes.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          board_id: true,
          object_id: true,
          user_id: true,
          vote_type: true,
          comment: true,
          created_at: true,
          design_boards: {
            select: {
              id: true,
              title: true,
            },
          },
          board_objects: {
            select: {
              id: true,
              object_type: true,
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

      if (!vote) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Vote not found',
        });
      }

      return vote;
    }),

  /**
   * Get all votes (paginated)
   */
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
        board_id: z.string().uuid().optional(),
        object_id: z.string().uuid().optional(),
        user_id: z.string().uuid().optional(),
        vote_type: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, board_id, object_id, user_id, vote_type } = input;

      const where: any = {};

      if (board_id) {
        where.board_id = board_id;
      }

      if (object_id) {
        where.object_id = object_id;
      }

      if (user_id) {
        where.user_id = user_id;
      }

      if (vote_type) {
        where.vote_type = vote_type;
      }

      const votes = await ctx.db.board_votes.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          board_id: true,
          object_id: true,
          user_id: true,
          vote_type: true,
          comment: true,
          created_at: true,
          user_profiles: {
            select: {
              name: true,
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (votes.length > limit) {
        const nextItem = votes.pop();
        nextCursor = nextItem?.id;
      }

      return {
        votes,
        nextCursor,
      };
    }),

  /**
   * Get votes for board
   */
  getByBoard: protectedProcedure
    .input(
      z.object({
        board_id: z.string().uuid(),
        vote_type: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const votes = await ctx.db.board_votes.findMany({
        where: {
          board_id: input.board_id,
          ...(input.vote_type && { vote_type: input.vote_type }),
        },
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          object_id: true,
          user_id: true,
          vote_type: true,
          comment: true,
          created_at: true,
          user_profiles: {
            select: {
              name: true,
              email: true,
            },
          },
          board_objects: {
            select: {
              object_type: true,
            },
          },
        },
      });

      return votes;
    }),

  /**
   * Get votes for object
   */
  getByObject: protectedProcedure
    .input(z.object({ object_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const votes = await ctx.db.board_votes.findMany({
        where: {
          object_id: input.object_id,
        },
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          user_id: true,
          vote_type: true,
          comment: true,
          created_at: true,
          user_profiles: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      return votes;
    }),

  /**
   * Get user's votes
   */
  getByUser: protectedProcedure
    .input(
      z.object({
        user_id: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = input.user_id || ctx.user!.id;

      const votes = await ctx.db.board_votes.findMany({
        where: {
          user_id: userId,
        },
        take: input.limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          board_id: true,
          object_id: true,
          vote_type: true,
          comment: true,
          created_at: true,
          design_boards: {
            select: {
              title: true,
            },
          },
        },
      });

      return votes;
    }),

  /**
   * Cast/update vote
   */
  create: protectedProcedure
    .input(
      z.object({
        board_id: z.string().uuid(),
        object_id: z.string().uuid(),
        vote_type: z.string(),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user already voted on this object
      const existingVote = await ctx.db.board_votes.findFirst({
        where: {
          object_id: input.object_id,
          user_id: ctx.user!.id,
        },
      });

      if (existingVote) {
        // Update existing vote
        const updated = await ctx.db.board_votes.update({
          where: { id: existingVote.id },
          data: {
            vote_type: input.vote_type,
            comment: input.comment,
          },
          select: {
            id: true,
            vote_type: true,
            comment: true,
            created_at: true,
          },
        });

        return updated;
      }

      // Create new vote
      const newVote = await ctx.db.board_votes.create({
        data: {
          board_id: input.board_id,
          object_id: input.object_id,
          user_id: ctx.user!.id,
          vote_type: input.vote_type,
          comment: input.comment,
        },
        select: {
          id: true,
          board_id: true,
          object_id: true,
          vote_type: true,
          comment: true,
          created_at: true,
        },
      });

      return newVote;
    }),

  /**
   * Remove vote
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const vote = await ctx.db.board_votes.findUnique({
        where: { id: input.id },
        select: { id: true, user_id: true },
      });

      if (!vote) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Vote not found',
        });
      }

      if (vote.user_id !== ctx.user!.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own votes',
        });
      }

      await ctx.db.board_votes.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Get vote summary for object
   */
  getSummary: protectedProcedure
    .input(z.object({ object_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const votes = await ctx.db.board_votes.groupBy({
        by: ['vote_type'],
        where: {
          object_id: input.object_id,
        },
        _count: true,
      });

      const totalVotes = votes.reduce((sum, v) => sum + v._count, 0);

      return {
        totalVotes,
        byType: votes.map(v => ({
          vote_type: v.vote_type,
          count: v._count,
        })),
      };
    }),

  /**
   * Get statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, byType, byBoard] = await Promise.all([
      ctx.db.board_votes.count(),
      ctx.db.board_votes.groupBy({
        by: ['vote_type'],
        _count: true,
      }),
      ctx.db.board_votes.groupBy({
        by: ['board_id'],
        _count: true,
        orderBy: {
          _count: {
            board_id: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    return {
      total,
      byType: byType.map(v => ({
        vote_type: v.vote_type,
        count: v._count,
      })),
      topBoards: byBoard.map(b => ({
        board_id: b.board_id,
        vote_count: b._count,
      })),
    };
  }),
});

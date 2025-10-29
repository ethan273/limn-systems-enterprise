import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

/**
 * Board Collaborators Router
 *
 * Manages board_collaborators table using ctx.db pattern.
 * Handles user collaboration on design boards with role management.
 */

export const boardCollaboratorsRouter = createTRPCRouter({
  /**
   * Get collaborator by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const collaborator = await ctx.db.board_collaborators.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          board_id: true,
          user_id: true,
          role: true,
          added_by: true,
          added_at: true,
          design_boards: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          user_profiles_board_collaborators_user_idTouser_profiles: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          user_profiles_board_collaborators_added_byTouser_profiles: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!collaborator) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Collaborator not found',
        });
      }

      return collaborator;
    }),

  /**
   * Get all collaborators (paginated)
   */
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
        board_id: z.string().uuid().optional(),
        user_id: z.string().uuid().optional(),
        role: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, board_id, user_id, role } = input;

      const where: any = {};

      if (board_id) {
        where.board_id = board_id;
      }

      if (user_id) {
        where.user_id = user_id;
      }

      if (role) {
        where.role = role;
      }

      const collaborators = await ctx.db.board_collaborators.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { added_at: 'desc' },
        select: {
          id: true,
          board_id: true,
          user_id: true,
          role: true,
          added_by: true,
          added_at: true,
          user_profiles_board_collaborators_user_idTouser_profiles: {
            select: {
              name: true,
              email: true,
            },
          },
          design_boards: {
            select: {
              title: true,
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (collaborators.length > limit) {
        const nextItem = collaborators.pop();
        nextCursor = nextItem?.id;
      }

      return {
        collaborators,
        nextCursor,
      };
    }),

  /**
   * Get collaborators for board
   */
  getByBoard: protectedProcedure
    .input(z.object({ board_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const collaborators = await ctx.db.board_collaborators.findMany({
        where: {
          board_id: input.board_id,
        },
        orderBy: { added_at: 'asc' },
        select: {
          id: true,
          user_id: true,
          role: true,
          added_by: true,
          added_at: true,
          user_profiles_board_collaborators_user_idTouser_profiles: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return collaborators;
    }),

  /**
   * Get boards for user
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

      const collaborations = await ctx.db.board_collaborators.findMany({
        where: {
          user_id: userId,
        },
        take: input.limit,
        orderBy: { added_at: 'desc' },
        select: {
          id: true,
          board_id: true,
          role: true,
          added_at: true,
          design_boards: {
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              created_at: true,
            },
          },
        },
      });

      return collaborations;
    }),

  /**
   * Get my collaborations
   */
  getMy: protectedProcedure.query(async ({ ctx }) => {
    const collaborations = await ctx.db.board_collaborators.findMany({
      where: {
        user_id: ctx.user!.id,
      },
      orderBy: { added_at: 'desc' },
      select: {
        id: true,
        board_id: true,
        role: true,
        added_at: true,
        design_boards: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
          },
        },
      },
    });

    return collaborations;
  }),

  /**
   * Add collaborator to board
   */
  create: protectedProcedure
    .input(
      z.object({
        board_id: z.string().uuid(),
        user_id: z.string().uuid(),
        role: z.string().default('viewer'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if already exists
      const existing = await ctx.db.board_collaborators.findFirst({
        where: {
          board_id: input.board_id,
          user_id: input.user_id,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User is already a collaborator on this board',
        });
      }

      // Verify board exists
      const board = await ctx.db.design_boards.findUnique({
        where: { id: input.board_id },
        select: { id: true },
      });

      if (!board) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Board not found',
        });
      }

      // Verify user exists
      const user = await ctx.db.user_profiles.findUnique({
        where: { id: input.user_id },
        select: { id: true },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      const newCollaborator = await ctx.db.board_collaborators.create({
        data: {
          board_id: input.board_id,
          user_id: input.user_id,
          role: input.role,
          added_by: ctx.user!.id,
        },
        select: {
          id: true,
          board_id: true,
          user_id: true,
          role: true,
          added_at: true,
        },
      });

      return newCollaborator;
    }),

  /**
   * Update collaborator role
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        role: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const collaborator = await ctx.db.board_collaborators.findUnique({
        where: { id: input.id },
        select: { id: true },
      });

      if (!collaborator) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Collaborator not found',
        });
      }

      const updated = await ctx.db.board_collaborators.update({
        where: { id: input.id },
        data: {
          role: input.role,
        },
        select: {
          id: true,
          role: true,
        },
      });

      return updated;
    }),

  /**
   * Remove collaborator
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const collaborator = await ctx.db.board_collaborators.findUnique({
        where: { id: input.id },
        select: { id: true },
      });

      if (!collaborator) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Collaborator not found',
        });
      }

      await ctx.db.board_collaborators.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Remove user from board
   */
  removeFromBoard: protectedProcedure
    .input(
      z.object({
        board_id: z.string().uuid(),
        user_id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.board_collaborators.deleteMany({
        where: {
          board_id: input.board_id,
          user_id: input.user_id,
        },
      });

      if (result.count === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Collaborator not found',
        });
      }

      return { success: true };
    }),

  /**
   * Bulk add collaborators
   */
  bulkAdd: protectedProcedure
    .input(
      z.object({
        board_id: z.string().uuid(),
        user_ids: z.array(z.string().uuid()).min(1),
        role: z.string().default('viewer'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get existing collaborators
      const existing = await ctx.db.board_collaborators.findMany({
        where: {
          board_id: input.board_id,
          user_id: {
            in: input.user_ids,
          },
        },
        select: { user_id: true },
      });

      const existingUserIds = new Set(existing.map(c => c.user_id));
      const newUserIds = input.user_ids.filter(id => !existingUserIds.has(id));

      if (newUserIds.length === 0) {
        return {
          added: 0,
          skipped: input.user_ids.length,
          message: 'All users are already collaborators',
        };
      }

      const createData = newUserIds.map(user_id => ({
        board_id: input.board_id,
        user_id,
        role: input.role,
        added_by: ctx.user!.id,
      }));

      await ctx.db.board_collaborators.createMany({
        data: createData,
      });

      return {
        added: newUserIds.length,
        skipped: existingUserIds.size,
        message: `Added ${newUserIds.length} collaborators`,
      };
    }),

  /**
   * Get statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, byRole, byBoard] = await Promise.all([
      ctx.db.board_collaborators.count(),
      ctx.db.board_collaborators.groupBy({
        by: ['role'],
        _count: true,
      }),
      ctx.db.board_collaborators.groupBy({
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
      byRole: byRole.map(r => ({
        role: r.role,
        count: r._count,
      })),
      topBoards: byBoard.map(b => ({
        board_id: b.board_id,
        collaborator_count: b._count,
      })),
    };
  }),
});

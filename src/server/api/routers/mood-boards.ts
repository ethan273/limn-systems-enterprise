import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc/init';
import crypto from 'crypto';

/**
 * Mood Boards Router
 * Handles CRUD operations for mood boards with sharing capabilities
 */
export const moodBoardsRouter = createTRPCRouter({
  /**
   * Get all mood boards with optional filtering
   */
  getAll: protectedProcedure
    .input(
      z.object({
        projectId: z.string().optional(),
        designerId: z.string().optional(),
        boardType: z.string().optional(),
        status: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const { projectId, designerId, boardType, status, limit } = input;

      const boards = await ctx.db.mood_boards.findMany({
        where: {
          ...(projectId && { design_project_id: projectId }),
          ...(designerId && { designer_id: designerId }),
          ...(boardType && { board_type: boardType }),
          ...(status && { status }),
        },
        include: {
          design_projects: {
            select: {
              id: true,
              project_name: true,
              project_code: true,
            },
          },
          designers: {
            select: {
              id: true,
              name: true,
              company_name: true,
            },
          },
          users: {
            select: {
              id: true,
              email: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        take: limit,
      });

      return {
        boards,
        total: boards.length,
      };
    }),

  /**
   * Get a single mood board by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const board = await ctx.db.mood_boards.findUnique({
        where: { id: input.id },
        include: {
          design_projects: {
            include: {
              designers: true,
            },
          },
          designers: true,
          users: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      return board;
    }),

  /**
   * Get a mood board by share token (public access)
   */
  getByShareToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const board = await ctx.db.mood_boards.findFirst({
        where: {
          share_token: input.token,
          is_shared: true,
          OR: [
            { share_expires_at: null },
            { share_expires_at: { gt: new Date() } },
          ],
        },
        include: {
          design_projects: {
            select: {
              id: true,
              project_name: true,
            },
          },
          designers: {
            select: {
              id: true,
              name: true,
              company_name: true,
            },
          },
        },
      });

      if (!board) {
        throw new Error('Board not found or share link expired');
      }

      return board;
    }),

  /**
   * Create a new mood board
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        design_project_id: z.string().optional(),
        designer_id: z.string().optional(),
        board_type: z.string().default('mood'),
        layout: z.any().optional(),
        images: z.array(z.any()).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Generate unique board number
      const latestBoard = await ctx.db.mood_boards.findFirst({
        orderBy: { created_at: 'desc' },
        select: { board_number: true },
      });

      const year = new Date().getFullYear();
      const nextNumber = latestBoard
        ? parseInt(latestBoard.board_number.split('-')[2] || '0') + 1
        : 1;
      const board_number = `MB-${year}-${nextNumber.toString().padStart(4, '0')}`;

      const board = await ctx.db.mood_boards.create({
        data: {
          ...input,
          board_number,
          layout: input.layout || {},
          images: input.images || [],
          created_by: ctx.session.user.id,
        },
        include: {
          design_projects: true,
          designers: true,
        },
      });

      return board;
    }),

  /**
   * Update an existing mood board
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        design_project_id: z.string().optional(),
        designer_id: z.string().optional(),
        board_type: z.string().optional(),
        layout: z.any().optional(),
        images: z.array(z.any()).optional(),
        notes: z.string().optional(),
        status: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const board = await ctx.db.mood_boards.update({
        where: { id },
        data,
      });

      return board;
    }),

  /**
   * Update board layout
   */
  updateLayout: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        layout: z.any(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const board = await ctx.db.mood_boards.update({
        where: { id: input.id },
        data: {
          layout: input.layout,
        },
      });

      return board;
    }),

  /**
   * Generate a share link for a mood board
   */
  generateShareLink: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        expiresInDays: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const share_token = crypto.randomBytes(32).toString('hex');
      const share_expires_at = input.expiresInDays
        ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
        : null;

      await ctx.db.mood_boards.update({
        where: { id: input.id },
        data: {
          is_shared: true,
          share_token,
          share_expires_at,
        },
      });

      return {
        share_token,
        share_url: `${process.env.NEXT_PUBLIC_APP_URL}/boards/shared/${share_token}`,
        expires_at: share_expires_at,
      };
    }),

  /**
   * Revoke share link
   */
  revokeShareLink: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const board = await ctx.db.mood_boards.update({
        where: { id: input.id },
        data: {
          is_shared: false,
          share_token: null,
          share_expires_at: null,
        },
      });

      return board;
    }),

  /**
   * Delete a mood board
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.mood_boards.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});

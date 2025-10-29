import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

/**
 * QuickBooks Connections Router
 *
 * Manages quickbooks_connections table using ctx.db pattern.
 * Covers QuickBooks OAuth connections and token management.
 */

export const quickbooksConnectionsRouter = createTRPCRouter({
  /**
   * Get connection by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const connection = await ctx.db.quickbooks_connections.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          user_id: true,
          company_id: true,
          company_name: true,
          realm_id: true,
          scope: true,
          is_active: true,
          token_expires_at: true,
          created_at: true,
          updated_at: true,
          users: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      if (!connection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'QuickBooks connection not found',
        });
      }

      return connection;
    }),

  /**
   * Get all connections (paginated)
   */
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
        is_active: z.boolean().optional(),
        user_id: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, is_active, user_id } = input;

      const where: any = {};

      if (is_active !== undefined) {
        where.is_active = is_active;
      }

      if (user_id) {
        where.user_id = user_id;
      }

      const connections = await ctx.db.quickbooks_connections.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          user_id: true,
          company_id: true,
          company_name: true,
          realm_id: true,
          is_active: true,
          token_expires_at: true,
          created_at: true,
          updated_at: true,
          users: {
            select: {
              email: true,
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (connections.length > limit) {
        const nextItem = connections.pop();
        nextCursor = nextItem?.id;
      }

      return {
        connections,
        nextCursor,
      };
    }),

  /**
   * Get connections for current user
   */
  getMy: protectedProcedure
    .input(
      z.object({
        is_active: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const connections = await ctx.db.quickbooks_connections.findMany({
        where: {
          user_id: ctx.user!.id,
          ...(input.is_active !== undefined && { is_active: input.is_active }),
        },
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          company_id: true,
          company_name: true,
          realm_id: true,
          scope: true,
          is_active: true,
          token_expires_at: true,
          created_at: true,
        },
      });

      return connections;
    }),

  /**
   * Get active connection for company
   */
  getByCompany: protectedProcedure
    .input(z.object({ company_id: z.string() }))
    .query(async ({ ctx, input }) => {
      const connection = await ctx.db.quickbooks_connections.findFirst({
        where: {
          company_id: input.company_id,
          is_active: true,
        },
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          user_id: true,
          company_id: true,
          company_name: true,
          realm_id: true,
          is_active: true,
          token_expires_at: true,
          created_at: true,
        },
      });

      return connection;
    }),

  /**
   * Create QuickBooks connection
   */
  create: protectedProcedure
    .input(
      z.object({
        company_id: z.string(),
        company_name: z.string().optional(),
        access_token: z.string(),
        refresh_token: z.string(),
        token_expires_at: z.date().optional(),
        realm_id: z.string(),
        scope: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check for existing connection
      const existing = await ctx.db.quickbooks_connections.findFirst({
        where: {
          user_id: ctx.user!.id,
          company_id: input.company_id,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Connection already exists for this company',
        });
      }

      const newConnection = await ctx.db.quickbooks_connections.create({
        data: {
          user_id: ctx.user!.id,
          company_id: input.company_id,
          company_name: input.company_name,
          access_token: input.access_token,
          refresh_token: input.refresh_token,
          token_expires_at: input.token_expires_at,
          realm_id: input.realm_id,
          scope: input.scope,
          is_active: true,
        },
        select: {
          id: true,
          company_id: true,
          company_name: true,
          realm_id: true,
          is_active: true,
          created_at: true,
        },
      });

      return newConnection;
    }),

  /**
   * Update tokens
   */
  updateTokens: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        access_token: z.string(),
        refresh_token: z.string(),
        token_expires_at: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const connection = await ctx.db.quickbooks_connections.findUnique({
        where: { id: input.id },
        select: { id: true, user_id: true },
      });

      if (!connection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Connection not found',
        });
      }

      if (connection.user_id !== ctx.user!.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only update your own connections',
        });
      }

      const updatedConnection = await ctx.db.quickbooks_connections.update({
        where: { id: input.id },
        data: {
          access_token: input.access_token,
          refresh_token: input.refresh_token,
          token_expires_at: input.token_expires_at,
          updated_at: new Date(),
        },
        select: {
          id: true,
          token_expires_at: true,
          updated_at: true,
        },
      });

      return updatedConnection;
    }),

  /**
   * Activate connection
   */
  activate: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const connection = await ctx.db.quickbooks_connections.findUnique({
        where: { id: input.id },
        select: { id: true, user_id: true },
      });

      if (!connection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Connection not found',
        });
      }

      if (connection.user_id !== ctx.user!.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only activate your own connections',
        });
      }

      const updatedConnection = await ctx.db.quickbooks_connections.update({
        where: { id: input.id },
        data: {
          is_active: true,
          updated_at: new Date(),
        },
        select: {
          id: true,
          is_active: true,
        },
      });

      return updatedConnection;
    }),

  /**
   * Deactivate connection
   */
  deactivate: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const connection = await ctx.db.quickbooks_connections.findUnique({
        where: { id: input.id },
        select: { id: true, user_id: true },
      });

      if (!connection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Connection not found',
        });
      }

      if (connection.user_id !== ctx.user!.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only deactivate your own connections',
        });
      }

      const updatedConnection = await ctx.db.quickbooks_connections.update({
        where: { id: input.id },
        data: {
          is_active: false,
          updated_at: new Date(),
        },
        select: {
          id: true,
          is_active: true,
        },
      });

      return updatedConnection;
    }),

  /**
   * Delete connection
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const connection = await ctx.db.quickbooks_connections.findUnique({
        where: { id: input.id },
        select: { id: true, user_id: true },
      });

      if (!connection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Connection not found',
        });
      }

      if (connection.user_id !== ctx.user!.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own connections',
        });
      }

      await ctx.db.quickbooks_connections.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Get connection statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, active, expired] = await Promise.all([
      ctx.db.quickbooks_connections.count(),
      ctx.db.quickbooks_connections.count({ where: { is_active: true } }),
      ctx.db.quickbooks_connections.count({
        where: {
          token_expires_at: {
            lte: new Date(),
          },
        },
      }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      expired,
    };
  }),
});

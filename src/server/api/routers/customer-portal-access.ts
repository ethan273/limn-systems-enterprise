import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

/**
 * Customer Portal Access Router
 *
 * Manages customer_portal_access table using ctx.db pattern.
 * Controls customer access permissions to portal features and data.
 */

export const customerPortalAccessRouter = createTRPCRouter({
  /**
   * Get access record by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const access = await ctx.db.customer_portal_access.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          portal_id: true,
          customer_id: true,
          user_id: true,
          access_level: true,
          permissions: true,
          expires_at: true,
          granted_by: true,
          granted_at: true,
          revoked_at: true,
          created_at: true,
          updated_at: true,
          customer_portals: {
            select: {
              id: true,
              name: true,
            },
          },
          customers: {
            select: {
              id: true,
              name: true,
            },
          },
          user_profiles_customer_portal_access_user_idTouser_profiles: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          user_profiles_customer_portal_access_granted_byTouser_profiles: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!access) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Access record not found',
        });
      }

      return access;
    }),

  /**
   * Get all access records (paginated)
   */
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
        portal_id: z.string().uuid().optional(),
        customer_id: z.string().uuid().optional(),
        user_id: z.string().uuid().optional(),
        access_level: z.string().optional(),
        active_only: z.boolean().default(true),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, portal_id, customer_id, user_id, access_level, active_only } = input;

      const where: any = {};

      if (portal_id) {
        where.portal_id = portal_id;
      }

      if (customer_id) {
        where.customer_id = customer_id;
      }

      if (user_id) {
        where.user_id = user_id;
      }

      if (access_level) {
        where.access_level = access_level;
      }

      if (active_only) {
        where.revoked_at = null;
        where.OR = [
          { expires_at: null },
          { expires_at: { gt: new Date() } },
        ];
      }

      const accessRecords = await ctx.db.customer_portal_access.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { granted_at: 'desc' },
        select: {
          id: true,
          portal_id: true,
          customer_id: true,
          user_id: true,
          access_level: true,
          expires_at: true,
          granted_at: true,
          revoked_at: true,
          customers: {
            select: {
              name: true,
            },
          },
          user_profiles_customer_portal_access_user_idTouser_profiles: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (accessRecords.length > limit) {
        const nextItem = accessRecords.pop();
        nextCursor = nextItem?.id;
      }

      return {
        accessRecords,
        nextCursor,
      };
    }),

  /**
   * Get access for portal
   */
  getByPortal: protectedProcedure
    .input(
      z.object({
        portal_id: z.string().uuid(),
        active_only: z.boolean().default(true),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        portal_id: input.portal_id,
      };

      if (input.active_only) {
        where.revoked_at = null;
        where.OR = [
          { expires_at: null },
          { expires_at: { gt: new Date() } },
        ];
      }

      const accessRecords = await ctx.db.customer_portal_access.findMany({
        where,
        orderBy: { granted_at: 'desc' },
        select: {
          id: true,
          customer_id: true,
          user_id: true,
          access_level: true,
          permissions: true,
          expires_at: true,
          granted_at: true,
          customers: {
            select: {
              name: true,
            },
          },
          user_profiles_customer_portal_access_user_idTouser_profiles: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      return accessRecords;
    }),

  /**
   * Get access for customer
   */
  getByCustomer: protectedProcedure
    .input(
      z.object({
        customer_id: z.string().uuid(),
        active_only: z.boolean().default(true),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        customer_id: input.customer_id,
      };

      if (input.active_only) {
        where.revoked_at = null;
        where.OR = [
          { expires_at: null },
          { expires_at: { gt: new Date() } },
        ];
      }

      const accessRecords = await ctx.db.customer_portal_access.findMany({
        where,
        orderBy: { granted_at: 'desc' },
        select: {
          id: true,
          portal_id: true,
          user_id: true,
          access_level: true,
          permissions: true,
          expires_at: true,
          granted_at: true,
          customer_portals: {
            select: {
              name: true,
            },
          },
          user_profiles_customer_portal_access_user_idTouser_profiles: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      return accessRecords;
    }),

  /**
   * Grant access
   */
  create: protectedProcedure
    .input(
      z.object({
        portal_id: z.string().uuid(),
        customer_id: z.string().uuid(),
        user_id: z.string().uuid(),
        access_level: z.string().default('read'),
        permissions: z.any().optional(),
        expires_at: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check for existing active access
      const existing = await ctx.db.customer_portal_access.findFirst({
        where: {
          portal_id: input.portal_id,
          user_id: input.user_id,
          revoked_at: null,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User already has active access to this portal',
        });
      }

      const newAccess = await ctx.db.customer_portal_access.create({
        data: {
          portal_id: input.portal_id,
          customer_id: input.customer_id,
          user_id: input.user_id,
          access_level: input.access_level,
          permissions: input.permissions,
          expires_at: input.expires_at,
          granted_by: ctx.user!.id,
          granted_at: new Date(),
        },
        select: {
          id: true,
          portal_id: true,
          customer_id: true,
          user_id: true,
          access_level: true,
          expires_at: true,
          granted_at: true,
        },
      });

      return newAccess;
    }),

  /**
   * Update access
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        access_level: z.string().optional(),
        permissions: z.any().optional(),
        expires_at: z.date().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const access = await ctx.db.customer_portal_access.findUnique({
        where: { id: input.id },
        select: { id: true },
      });

      if (!access) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Access record not found',
        });
      }

      const { id: _id, ...updateData } = input;

      const updated = await ctx.db.customer_portal_access.update({
        where: { id: input.id },
        data: {
          ...updateData,
          updated_at: new Date(),
        },
        select: {
          id: true,
          access_level: true,
          permissions: true,
          expires_at: true,
          updated_at: true,
        },
      });

      return updated;
    }),

  /**
   * Revoke access
   */
  revoke: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const access = await ctx.db.customer_portal_access.findUnique({
        where: { id: input.id },
        select: { id: true, revoked_at: true },
      });

      if (!access) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Access record not found',
        });
      }

      if (access.revoked_at) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Access already revoked',
        });
      }

      const revoked = await ctx.db.customer_portal_access.update({
        where: { id: input.id },
        data: {
          revoked_at: new Date(),
          updated_at: new Date(),
        },
        select: {
          id: true,
          revoked_at: true,
        },
      });

      return revoked;
    }),

  /**
   * Delete access record
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const access = await ctx.db.customer_portal_access.findUnique({
        where: { id: input.id },
        select: { id: true },
      });

      if (!access) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Access record not found',
        });
      }

      await ctx.db.customer_portal_access.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Check if user has access
   */
  checkAccess: protectedProcedure
    .input(
      z.object({
        portal_id: z.string().uuid(),
        user_id: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const access = await ctx.db.customer_portal_access.findFirst({
        where: {
          portal_id: input.portal_id,
          user_id: input.user_id,
          revoked_at: null,
          OR: [
            { expires_at: null },
            { expires_at: { gt: new Date() } },
          ],
        },
        select: {
          id: true,
          access_level: true,
          permissions: true,
          expires_at: true,
        },
      });

      return {
        hasAccess: !!access,
        access: access || null,
      };
    }),

  /**
   * Get statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, active, byLevel, byPortal] = await Promise.all([
      ctx.db.customer_portal_access.count(),
      ctx.db.customer_portal_access.count({
        where: {
          revoked_at: null,
          OR: [
            { expires_at: null },
            { expires_at: { gt: new Date() } },
          ],
        },
      }),
      ctx.db.customer_portal_access.groupBy({
        by: ['access_level'],
        _count: true,
      }),
      ctx.db.customer_portal_access.groupBy({
        by: ['portal_id'],
        _count: true,
        orderBy: {
          _count: {
            portal_id: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    return {
      total,
      active,
      revoked: total - active,
      byLevel: byLevel.map(l => ({
        access_level: l.access_level,
        count: l._count,
      })),
      topPortals: byPortal.map(p => ({
        portal_id: p.portal_id,
        access_count: p._count,
      })),
    };
  }),
});

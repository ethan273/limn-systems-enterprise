import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

/**
 * Portal Access Router
 *
 * Manages portal_access table using ctx.db pattern.
 * Controls user access permissions to portal features and data across all portal types.
 */

export const customerPortalAccessRouter = createTRPCRouter({
  /**
   * Get access record by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const access = await ctx.db.portal_access.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          user_id: true,
          portal_type: true,
          allowed_modules: true,
          customer_id: true,
          partner_id: true,
          is_active: true,
          granted_by: true,
          granted_at: true,
          revoked_at: true,
          revoked_by: true,
          last_accessed_at: true,
          metadata: true,
          created_at: true,
          updated_at: true,
          customers: {
            select: {
              id: true,
              company_name: true,
            },
          },
          partners: {
            select: {
              id: true,
              company_name: true,
            },
          },
          users_portal_access_user_idTousers: {
            select: {
              id: true,
              email: true,
            },
          },
          users_portal_access_granted_byTousers: {
            select: {
              id: true,
              email: true,
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
        portal_type: z.enum(['customer', 'designer', 'factory', 'qc']).optional(),
        customer_id: z.string().uuid().optional(),
        partner_id: z.string().uuid().optional(),
        user_id: z.string().uuid().optional(),
        active_only: z.boolean().default(true),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, portal_type, customer_id, partner_id, user_id, active_only } = input;

      const where: any = {};

      if (portal_type) {
        where.portal_type = portal_type;
      }

      if (customer_id) {
        where.customer_id = customer_id;
      }

      if (partner_id) {
        where.partner_id = partner_id;
      }

      if (user_id) {
        where.user_id = user_id;
      }

      if (active_only) {
        where.is_active = true;
        where.revoked_at = null;
      }

      const accessRecords = await ctx.db.portal_access.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { granted_at: 'desc' },
        select: {
          id: true,
          user_id: true,
          portal_type: true,
          allowed_modules: true,
          customer_id: true,
          partner_id: true,
          is_active: true,
          granted_at: true,
          revoked_at: true,
          customers: {
            select: {
              company_name: true,
            },
          },
          partners: {
            select: {
              company_name: true,
            },
          },
          users_portal_access_user_idTousers: {
            select: {
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
   * Get access for portal type
   */
  getByPortalType: protectedProcedure
    .input(
      z.object({
        portal_type: z.enum(['customer', 'designer', 'factory', 'qc']),
        active_only: z.boolean().default(true),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        portal_type: input.portal_type,
      };

      if (input.active_only) {
        where.is_active = true;
        where.revoked_at = null;
      }

      const accessRecords = await ctx.db.portal_access.findMany({
        where,
        orderBy: { granted_at: 'desc' },
        select: {
          id: true,
          user_id: true,
          portal_type: true,
          allowed_modules: true,
          customer_id: true,
          partner_id: true,
          is_active: true,
          granted_at: true,
          customers: {
            select: {
              company_name: true,
            },
          },
          partners: {
            select: {
              company_name: true,
            },
          },
          users_portal_access_user_idTousers: {
            select: {
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
        where.is_active = true;
        where.revoked_at = null;
      }

      const accessRecords = await ctx.db.portal_access.findMany({
        where,
        orderBy: { granted_at: 'desc' },
        select: {
          id: true,
          user_id: true,
          portal_type: true,
          allowed_modules: true,
          customer_id: true,
          is_active: true,
          granted_at: true,
          customers: {
            select: {
              company_name: true,
            },
          },
          users_portal_access_user_idTousers: {
            select: {
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
        user_id: z.string().uuid(),
        portal_type: z.enum(['customer', 'designer', 'factory', 'qc']),
        allowed_modules: z.array(z.string()),
        customer_id: z.string().uuid().optional(),
        partner_id: z.string().uuid().optional(),
        metadata: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check for existing active access
      const existingArray = await ctx.db.portal_access.findMany({
        where: {
          user_id: input.user_id,
          portal_type: input.portal_type,
          is_active: true,
          revoked_at: null,
        },
        take: 1,
      });

      if (existingArray.length > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User already has active access to this portal type',
        });
      }

      const newAccess = await ctx.db.portal_access.create({
        data: {
          user_id: input.user_id,
          portal_type: input.portal_type,
          allowed_modules: input.allowed_modules,
          customer_id: input.customer_id || null,
          partner_id: input.partner_id || null,
          is_active: true,
          granted_by: ctx.user!.id,
          granted_at: new Date(),
          metadata: input.metadata || {},
        },
        select: {
          id: true,
          user_id: true,
          portal_type: true,
          allowed_modules: true,
          customer_id: true,
          partner_id: true,
          is_active: true,
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
        allowed_modules: z.array(z.string()).optional(),
        is_active: z.boolean().optional(),
        metadata: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const access = await ctx.db.portal_access.findUnique({
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

      const updated = await ctx.db.portal_access.update({
        where: { id: input.id },
        data: {
          ...updateData,
          updated_at: new Date(),
        },
        select: {
          id: true,
          allowed_modules: true,
          is_active: true,
          metadata: true,
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
      const access = await ctx.db.portal_access.findUnique({
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

      const revoked = await ctx.db.portal_access.update({
        where: { id: input.id },
        data: {
          is_active: false,
          revoked_at: new Date(),
          revoked_by: ctx.user!.id,
          updated_at: new Date(),
        },
        select: {
          id: true,
          is_active: true,
          revoked_at: true,
          revoked_by: true,
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
      const access = await ctx.db.portal_access.findUnique({
        where: { id: input.id },
        select: { id: true },
      });

      if (!access) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Access record not found',
        });
      }

      await ctx.db.portal_access.delete({
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
        user_id: z.string().uuid(),
        portal_type: z.enum(['customer', 'designer', 'factory', 'qc']),
      })
    )
    .query(async ({ ctx, input }) => {
      const accessArray = await ctx.db.portal_access.findMany({
        where: {
          user_id: input.user_id,
          portal_type: input.portal_type,
          is_active: true,
          revoked_at: null,
        },
        select: {
          id: true,
          portal_type: true,
          allowed_modules: true,
          customer_id: true,
          partner_id: true,
          is_active: true,
        },
        take: 1,
      });

      const access = accessArray.length > 0 ? accessArray[0] : null;

      return {
        hasAccess: !!access,
        access: access || null,
      };
    }),

  /**
   * Get statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, active, byType] = await Promise.all([
      ctx.db.portal_access.count(),
      ctx.db.portal_access.count({
        where: {
          is_active: true,
          revoked_at: null,
        },
      }),
      ctx.db.portal_access.groupBy({
        by: ['portal_type'],
        _count: true,
      }),
    ]);

    return {
      total,
      active,
      revoked: total - active,
      byType: byType.map(t => ({
        portal_type: t.portal_type,
        count: t._count,
      })),
    };
  }),
});

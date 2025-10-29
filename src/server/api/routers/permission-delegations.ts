import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

/**
 * Permission Delegations Router
 *
 * Manages permission_delegations table using ctx.db pattern.
 * Covers temporary permission delegation workflows.
 */

const delegationStatusEnum = z.enum(['active', 'expired', 'revoked']);

export const permissionDelegationsRouter = createTRPCRouter({
  /**
   * Get delegation by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const delegation = await ctx.db.permission_delegations.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          delegator_id: true,
          delegatee_id: true,
          permission_id: true,
          resource_type: true,
          resource_id: true,
          valid_from: true,
          valid_until: true,
          status: true,
          revoked_at: true,
          revoked_by: true,
          revoke_reason: true,
          delegation_reason: true,
          created_at: true,
          updated_at: true,
          users_permission_delegations_delegator_idTousers: {
            select: { id: true, name: true, email: true },
          },
          users_permission_delegations_delegatee_idTousers: {
            select: { id: true, name: true, email: true },
          },
          permission_definitions: {
            select: {
              permission_key: true,
              permission_name: true,
              description: true,
            },
          },
        },
      });

      if (!delegation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Permission delegation not found',
        });
      }

      return delegation;
    }),

  /**
   * Get all delegations (paginated)
   */
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
        status: delegationStatusEnum.optional(),
        delegator_id: z.string().uuid().optional(),
        delegatee_id: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, status, delegator_id, delegatee_id } = input;

      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (delegator_id) {
        where.delegator_id = delegator_id;
      }

      if (delegatee_id) {
        where.delegatee_id = delegatee_id;
      }

      const delegations = await ctx.db.permission_delegations.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          delegator_id: true,
          delegatee_id: true,
          permission_id: true,
          valid_from: true,
          valid_until: true,
          status: true,
          created_at: true,
          users_permission_delegations_delegator_idTousers: {
            select: { name: true },
          },
          users_permission_delegations_delegatee_idTousers: {
            select: { name: true },
          },
          permission_definitions: {
            select: { permission_name: true },
          },
        },
      });

      let nextCursor: string | undefined;
      if (delegations.length > limit) {
        const nextItem = delegations.pop();
        nextCursor = nextItem?.id;
      }

      return {
        delegations,
        nextCursor,
      };
    }),

  /**
   * Get my delegated permissions (where I'm the delegatee)
   */
  getMyDelegations: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        status: delegationStatusEnum.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const delegations = await ctx.db.permission_delegations.findMany({
        where: {
          delegatee_id: ctx.user!.id,
          ...(input.status && { status: input.status }),
        },
        take: input.limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          delegator_id: true,
          permission_id: true,
          resource_type: true,
          valid_from: true,
          valid_until: true,
          status: true,
          delegation_reason: true,
          users_permission_delegations_delegator_idTousers: {
            select: { name: true, email: true },
          },
          permission_definitions: {
            select: {
              permission_key: true,
              permission_name: true,
              description: true,
            },
          },
        },
      });

      return delegations;
    }),

  /**
   * Get delegations I've given
   */
  getMyGivenDelegations: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        status: delegationStatusEnum.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const delegations = await ctx.db.permission_delegations.findMany({
        where: {
          delegator_id: ctx.user!.id,
          ...(input.status && { status: input.status }),
        },
        take: input.limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          delegatee_id: true,
          permission_id: true,
          resource_type: true,
          valid_from: true,
          valid_until: true,
          status: true,
          delegation_reason: true,
          users_permission_delegations_delegatee_idTousers: {
            select: { name: true, email: true },
          },
          permission_definitions: {
            select: {
              permission_key: true,
              permission_name: true,
            },
          },
        },
      });

      return delegations;
    }),

  /**
   * Create delegation
   */
  create: protectedProcedure
    .input(
      z.object({
        delegatee_id: z.string().uuid(),
        permission_id: z.string().uuid(),
        resource_type: z.string().optional(),
        resource_id: z.string().optional(),
        valid_from: z.date().optional(),
        valid_until: z.date(),
        delegation_reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify permission exists
      const permission = await ctx.db.permission_definitions.findUnique({
        where: { id: input.permission_id },
        select: { id: true },
      });

      if (!permission) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Permission definition not found',
        });
      }

      // Verify delegatee exists
      const delegatee = await ctx.db.users.findUnique({
        where: { id: input.delegatee_id },
        select: { id: true },
      });

      if (!delegatee) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Delegatee user not found',
        });
      }

      // Check for duplicate active delegation
      const existingDelegation = await ctx.db.permission_delegations.findFirst({
        where: {
          delegator_id: ctx.user!.id,
          delegatee_id: input.delegatee_id,
          permission_id: input.permission_id,
          status: 'active',
          valid_until: {
            gte: new Date(),
          },
        },
      });

      if (existingDelegation) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Active delegation already exists for this permission and user',
        });
      }

      const newDelegation = await ctx.db.permission_delegations.create({
        data: {
          delegator_id: ctx.user!.id,
          delegatee_id: input.delegatee_id,
          permission_id: input.permission_id,
          resource_type: input.resource_type,
          resource_id: input.resource_id,
          valid_from: input.valid_from || new Date(),
          valid_until: input.valid_until,
          delegation_reason: input.delegation_reason,
          status: 'active',
        },
        select: {
          id: true,
          delegatee_id: true,
          permission_id: true,
          valid_from: true,
          valid_until: true,
          status: true,
        },
      });

      return newDelegation;
    }),

  /**
   * Revoke delegation
   */
  revoke: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        revoke_reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const delegation = await ctx.db.permission_delegations.findUnique({
        where: { id: input.id },
        select: { id: true, delegator_id: true, status: true },
      });

      if (!delegation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Delegation not found',
        });
      }

      if (delegation.delegator_id !== ctx.user!.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only revoke your own delegations',
        });
      }

      if (delegation.status === 'revoked') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Delegation is already revoked',
        });
      }

      const revokedDelegation = await ctx.db.permission_delegations.update({
        where: { id: input.id },
        data: {
          status: 'revoked',
          revoked_at: new Date(),
          revoked_by: ctx.user!.id,
          revoke_reason: input.revoke_reason,
          updated_at: new Date(),
        },
        select: {
          id: true,
          status: true,
          revoked_at: true,
        },
      });

      return revokedDelegation;
    }),

  /**
   * Get delegation statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, byStatus] = await Promise.all([
      ctx.db.permission_delegations.count(),
      ctx.db.permission_delegations.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    const active = byStatus.find(s => s.status === 'active')?._count || 0;
    const expired = byStatus.find(s => s.status === 'expired')?._count || 0;
    const revoked = byStatus.find(s => s.status === 'revoked')?._count || 0;

    return {
      total,
      active,
      expired,
      revoked,
      byStatus: byStatus.map(s => ({
        status: s.status,
        count: s._count,
      })),
    };
  }),
});

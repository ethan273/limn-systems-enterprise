import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

/**
 * Permission Requests Router
 *
 * Manages permission_requests table using ctx.db pattern.
 * Covers permission request workflows, approval processes, and temporary access grants.
 */

const requestStatusEnum = z.enum([
  'pending',
  'approved',
  'denied',
  'expired',
  'cancelled',
]);

export const permissionRequestsRouter = createTRPCRouter({
  /**
   * Get permission request by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const request = await ctx.db.permission_requests.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          requester_id: true,
          permission_id: true,
          resource_type: true,
          resource_id: true,
          request_reason: true,
          duration_hours: true,
          status: true,
          approver_id: true,
          approved_at: true,
          denied_at: true,
          approval_reason: true,
          auto_approved: true,
          auto_approval_reason: true,
          requested_at: true,
          expires_at: true,
          metadata: true,
          created_at: true,
          updated_at: true,
          users_permission_requests_requester_idTousers: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          users_permission_requests_approver_idTousers: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          permission_definitions: {
            select: {
              id: true,
              permission_key: true,
              permission_name: true,
              description: true,
            },
          },
        },
      });

      if (!request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Permission request not found',
        });
      }

      return request;
    }),

  /**
   * Get all permission requests (with pagination and filtering)
   */
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
        status: requestStatusEnum.optional(),
        requester_id: z.string().uuid().optional(),
        approver_id: z.string().uuid().optional(),
        permission_id: z.string().uuid().optional(),
        resource_type: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, status, requester_id, approver_id, permission_id, resource_type } = input;

      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (requester_id) {
        where.requester_id = requester_id;
      }

      if (approver_id) {
        where.approver_id = approver_id;
      }

      if (permission_id) {
        where.permission_id = permission_id;
      }

      if (resource_type) {
        where.resource_type = resource_type;
      }

      const requests = await ctx.db.permission_requests.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { requested_at: 'desc' },
        select: {
          id: true,
          requester_id: true,
          permission_id: true,
          resource_type: true,
          resource_id: true,
          request_reason: true,
          duration_hours: true,
          status: true,
          requested_at: true,
          approved_at: true,
          denied_at: true,
          expires_at: true,
          users_permission_requests_requester_idTousers: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          permission_definitions: {
            select: {
              permission_key: true,
              permission_name: true,
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (requests.length > limit) {
        const nextItem = requests.pop();
        nextCursor = nextItem?.id;
      }

      return {
        requests,
        nextCursor,
      };
    }),

  /**
   * Get my permission requests (current user)
   */
  getMyRequests: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        status: requestStatusEnum.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const requests = await ctx.db.permission_requests.findMany({
        where: {
          requester_id: ctx.user!.id,
          ...(input.status && { status: input.status }),
        },
        take: input.limit,
        orderBy: { requested_at: 'desc' },
        select: {
          id: true,
          permission_id: true,
          resource_type: true,
          resource_id: true,
          request_reason: true,
          duration_hours: true,
          status: true,
          requested_at: true,
          approved_at: true,
          denied_at: true,
          approval_reason: true,
          expires_at: true,
          permission_definitions: {
            select: {
              permission_key: true,
              permission_name: true,
              description: true,
            },
          },
          users_permission_requests_approver_idTousers: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return requests;
    }),

  /**
   * Get pending requests (for approvers)
   */
  getPendingRequests: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const requests = await ctx.db.permission_requests.findMany({
        where: {
          status: 'pending',
        },
        take: input.limit,
        orderBy: { requested_at: 'asc' }, // Oldest first for queue processing
        select: {
          id: true,
          requester_id: true,
          permission_id: true,
          resource_type: true,
          resource_id: true,
          request_reason: true,
          duration_hours: true,
          requested_at: true,
          metadata: true,
          users_permission_requests_requester_idTousers: {
            select: {
              id: true,
              name: true,
              email: true,
            },
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

      return requests;
    }),

  /**
   * Create permission request
   */
  create: protectedProcedure
    .input(
      z.object({
        permission_id: z.string().uuid(),
        resource_type: z.string().optional(),
        resource_id: z.string().optional(),
        request_reason: z.string().min(10),
        duration_hours: z.number().positive().optional(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify permission definition exists
      const permission = await ctx.db.permission_definitions.findUnique({
        where: { id: input.permission_id },
        select: { id: true, permission_key: true },
      });

      if (!permission) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Permission definition not found',
        });
      }

      // Check for duplicate pending request
      const existingRequest = await ctx.db.permission_requests.findFirst({
        where: {
          requester_id: ctx.user!.id,
          permission_id: input.permission_id,
          status: 'pending',
          ...(input.resource_type && { resource_type: input.resource_type }),
          ...(input.resource_id && { resource_id: input.resource_id }),
        },
      });

      if (existingRequest) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You already have a pending request for this permission',
        });
      }

      // Calculate expiration if duration provided
      const expires_at = input.duration_hours
        ? new Date(Date.now() + input.duration_hours * 60 * 60 * 1000)
        : null;

      const newRequest = await ctx.db.permission_requests.create({
        data: {
          requester_id: ctx.user!.id,
          permission_id: input.permission_id,
          resource_type: input.resource_type,
          resource_id: input.resource_id,
          request_reason: input.request_reason,
          duration_hours: input.duration_hours,
          expires_at,
          metadata: input.metadata,
        },
        select: {
          id: true,
          permission_id: true,
          status: true,
          requested_at: true,
          expires_at: true,
        },
      });

      return newRequest;
    }),

  /**
   * Approve permission request
   */
  approve: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        approval_reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify request exists and is pending
      const request = await ctx.db.permission_requests.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          status: true,
          requester_id: true,
          permission_id: true,
        },
      });

      if (!request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Permission request not found',
        });
      }

      if (request.status !== 'pending') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot approve request with status: ${request.status}`,
        });
      }

      const approvedRequest = await ctx.db.permission_requests.update({
        where: { id: input.id },
        data: {
          status: 'approved',
          approver_id: ctx.user!.id,
          approved_at: new Date(),
          approval_reason: input.approval_reason,
          updated_at: new Date(),
        },
        select: {
          id: true,
          status: true,
          approved_at: true,
          permission_definitions: {
            select: {
              permission_key: true,
              permission_name: true,
            },
          },
        },
      });

      return approvedRequest;
    }),

  /**
   * Deny permission request
   */
  deny: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        approval_reason: z.string().min(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify request exists and is pending
      const request = await ctx.db.permission_requests.findUnique({
        where: { id: input.id },
        select: { id: true, status: true },
      });

      if (!request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Permission request not found',
        });
      }

      if (request.status !== 'pending') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot deny request with status: ${request.status}`,
        });
      }

      const deniedRequest = await ctx.db.permission_requests.update({
        where: { id: input.id },
        data: {
          status: 'denied',
          approver_id: ctx.user!.id,
          denied_at: new Date(),
          approval_reason: input.approval_reason,
          updated_at: new Date(),
        },
        select: {
          id: true,
          status: true,
          denied_at: true,
          approval_reason: true,
        },
      });

      return deniedRequest;
    }),

  /**
   * Cancel permission request (requester only)
   */
  cancel: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify request exists, is pending, and belongs to current user
      const request = await ctx.db.permission_requests.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          status: true,
          requester_id: true,
        },
      });

      if (!request) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Permission request not found',
        });
      }

      if (request.requester_id !== ctx.user!.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only cancel your own requests',
        });
      }

      if (request.status !== 'pending') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot cancel request with status: ${request.status}`,
        });
      }

      const cancelledRequest = await ctx.db.permission_requests.update({
        where: { id: input.id },
        data: {
          status: 'cancelled',
          updated_at: new Date(),
        },
        select: {
          id: true,
          status: true,
          updated_at: true,
        },
      });

      return cancelledRequest;
    }),

  /**
   * Get permission request statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, byStatus, avgApprovalTime] = await Promise.all([
      ctx.db.permission_requests.count(),
      ctx.db.permission_requests.groupBy({
        by: ['status'],
        _count: true,
      }),
      // Calculate average approval time
      ctx.db.$queryRaw<Array<{ avg_hours: number }>>`
        SELECT EXTRACT(EPOCH FROM AVG(approved_at - requested_at)) / 3600 as avg_hours
        FROM permission_requests
        WHERE status = 'approved' AND approved_at IS NOT NULL
      `,
    ]);

    const pending = byStatus.find(s => s.status === 'pending')?._count || 0;
    const approved = byStatus.find(s => s.status === 'approved')?._count || 0;
    const denied = byStatus.find(s => s.status === 'denied')?._count || 0;

    return {
      total,
      pending,
      approved,
      denied,
      byStatus: byStatus.map(s => ({
        status: s.status,
        count: s._count,
      })),
      avgApprovalTimeHours: avgApprovalTime[0]?.avg_hours ? Math.round(avgApprovalTime[0].avg_hours * 10) / 10 : 0,
    };
  }),
});

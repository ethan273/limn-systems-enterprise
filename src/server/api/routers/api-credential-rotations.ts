import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

/**
 * API Credential Rotations Router
 *
 * Manages api_credential_rotations table using ctx.db pattern.
 * Covers credential rotation workflows, tracking, and rollback capabilities.
 */

const rotationStatusEnum = z.enum([
  'idle',
  'in_progress',
  'completed',
  'failed',
  'rolled_back',
  'cancelled',
]);

const rotationTypeEnum = z.enum([
  'manual',
  'scheduled',
  'emergency',
  'auto',
  'policy_triggered',
]);

export const apiCredentialRotationsRouter = createTRPCRouter({
  /**
   * Get rotation by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rotation = await ctx.db.api_credential_rotations.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          credential_id: true,
          rotation_type: true,
          old_credential_id: true,
          performed_by: true,
          success: true,
          error_message: true,
          rollback_at: true,
          metadata: true,
          created_at: true,
          status: true,
          new_credential_preview: true,
          initiated_by: true,
          started_at: true,
          grace_period_ends_at: true,
          completed_at: true,
          api_credentials: {
            select: {
              id: true,
              service_name: true,
              display_name: true,
              credential_type: true,
            },
          },
          users: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!rotation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Credential rotation not found',
        });
      }

      return rotation;
    }),

  /**
   * Get all rotations (paginated, with filters)
   */
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
        status: rotationStatusEnum.optional(),
        credential_id: z.string().uuid().optional(),
        rotation_type: rotationTypeEnum.optional(),
        success: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, status, credential_id, rotation_type, success } = input;

      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (credential_id) {
        where.credential_id = credential_id;
      }

      if (rotation_type) {
        where.rotation_type = rotation_type;
      }

      if (success !== undefined) {
        where.success = success;
      }

      const rotations = await ctx.db.api_credential_rotations.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          credential_id: true,
          rotation_type: true,
          performed_by: true,
          success: true,
          status: true,
          started_at: true,
          completed_at: true,
          created_at: true,
          api_credentials: {
            select: {
              service_name: true,
              display_name: true,
            },
          },
          users: {
            select: {
              name: true,
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (rotations.length > limit) {
        const nextItem = rotations.pop();
        nextCursor = nextItem?.id;
      }

      return {
        rotations,
        nextCursor,
      };
    }),

  /**
   * Get rotations for specific credential
   */
  getByCredential: protectedProcedure
    .input(
      z.object({
        credential_id: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const rotations = await ctx.db.api_credential_rotations.findMany({
        where: {
          credential_id: input.credential_id,
        },
        take: input.limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          rotation_type: true,
          status: true,
          success: true,
          started_at: true,
          completed_at: true,
          created_at: true,
          error_message: true,
          users: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      return rotations;
    }),

  /**
   * Get rotations by status
   */
  getByStatus: protectedProcedure
    .input(
      z.object({
        status: rotationStatusEnum,
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const rotations = await ctx.db.api_credential_rotations.findMany({
        where: {
          status: input.status,
        },
        take: input.limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          credential_id: true,
          rotation_type: true,
          started_at: true,
          grace_period_ends_at: true,
          created_at: true,
          api_credentials: {
            select: {
              service_name: true,
              display_name: true,
            },
          },
          users: {
            select: {
              name: true,
            },
          },
        },
      });

      return rotations;
    }),

  /**
   * Get recent rotations
   */
  getRecent: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
        days: z.number().min(1).max(90).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);

      const rotations = await ctx.db.api_credential_rotations.findMany({
        where: {
          created_at: {
            gte: since,
          },
        },
        take: input.limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          credential_id: true,
          rotation_type: true,
          status: true,
          success: true,
          started_at: true,
          completed_at: true,
          created_at: true,
          api_credentials: {
            select: {
              service_name: true,
              display_name: true,
            },
          },
        },
      });

      return rotations;
    }),

  /**
   * Create new rotation record
   */
  create: protectedProcedure
    .input(
      z.object({
        credential_id: z.string().uuid(),
        rotation_type: rotationTypeEnum,
        old_credential_id: z.string().uuid().optional(),
        grace_period_hours: z.number().positive().optional(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify credential exists
      const credential = await ctx.db.api_credentials.findUnique({
        where: { id: input.credential_id },
        select: { id: true, service_name: true },
      });

      if (!credential) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'API credential not found',
        });
      }

      // Check for pending rotation
      const pendingRotation = await ctx.db.api_credential_rotations.findFirst({
        where: {
          credential_id: input.credential_id,
          status: { in: ['idle', 'in_progress'] },
        },
      });

      if (pendingRotation) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A rotation is already pending or in progress for this credential',
        });
      }

      // Calculate grace period end
      const gracePeriodEndsAt = input.grace_period_hours
        ? new Date(Date.now() + input.grace_period_hours * 60 * 60 * 1000)
        : null;

      const newRotation = await ctx.db.api_credential_rotations.create({
        data: {
          credential_id: input.credential_id,
          rotation_type: input.rotation_type,
          old_credential_id: input.old_credential_id,
          initiated_by: ctx.user!.id,
          status: 'idle',
          grace_period_ends_at: gracePeriodEndsAt,
          metadata: input.metadata,
        },
        select: {
          id: true,
          credential_id: true,
          rotation_type: true,
          status: true,
          grace_period_ends_at: true,
          created_at: true,
        },
      });

      return newRotation;
    }),

  /**
   * Initiate rotation (change status from idle to in_progress)
   */
  initiateRotation: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const rotation = await ctx.db.api_credential_rotations.findUnique({
        where: { id: input.id },
        select: { id: true, status: true },
      });

      if (!rotation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Rotation not found',
        });
      }

      if (rotation.status !== 'idle') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot initiate rotation with status: ${rotation.status}`,
        });
      }

      const updatedRotation = await ctx.db.api_credential_rotations.update({
        where: { id: input.id },
        data: {
          status: 'in_progress',
          started_at: new Date(),
          performed_by: ctx.user!.id,
        },
        select: {
          id: true,
          status: true,
          started_at: true,
        },
      });

      return updatedRotation;
    }),

  /**
   * Complete rotation successfully
   */
  completeRotation: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        new_credential_preview: z.string().max(10).optional(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const rotation = await ctx.db.api_credential_rotations.findUnique({
        where: { id: input.id },
        select: { id: true, status: true },
      });

      if (!rotation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Rotation not found',
        });
      }

      if (rotation.status !== 'in_progress') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot complete rotation with status: ${rotation.status}`,
        });
      }

      const updatedRotation = await ctx.db.api_credential_rotations.update({
        where: { id: input.id },
        data: {
          status: 'completed',
          success: true,
          completed_at: new Date(),
          new_credential_preview: input.new_credential_preview,
          metadata: input.metadata,
        },
        select: {
          id: true,
          status: true,
          success: true,
          completed_at: true,
        },
      });

      return updatedRotation;
    }),

  /**
   * Mark rotation as failed
   */
  failRotation: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        error_message: z.string(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const rotation = await ctx.db.api_credential_rotations.findUnique({
        where: { id: input.id },
        select: { id: true, status: true },
      });

      if (!rotation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Rotation not found',
        });
      }

      if (!['in_progress', 'idle'].includes(rotation.status || '')) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot fail rotation with status: ${rotation.status}`,
        });
      }

      const updatedRotation = await ctx.db.api_credential_rotations.update({
        where: { id: input.id },
        data: {
          status: 'failed',
          success: false,
          error_message: input.error_message,
          completed_at: new Date(),
          metadata: input.metadata,
        },
        select: {
          id: true,
          status: true,
          success: true,
          error_message: true,
          completed_at: true,
        },
      });

      return updatedRotation;
    }),

  /**
   * Rollback rotation
   */
  rollback: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        reason: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const rotation = await ctx.db.api_credential_rotations.findUnique({
        where: { id: input.id },
        select: { id: true, status: true, old_credential_backup: true },
      });

      if (!rotation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Rotation not found',
        });
      }

      if (rotation.status !== 'completed') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Can only rollback completed rotations',
        });
      }

      if (!rotation.old_credential_backup) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No backup credential available for rollback',
        });
      }

      const updatedRotation = await ctx.db.api_credential_rotations.update({
        where: { id: input.id },
        data: {
          status: 'rolled_back',
          rollback_at: new Date(),
          metadata: {
            ...(rotation as any).metadata,
            rollback_reason: input.reason,
            rolled_back_by: ctx.user!.id,
            rolled_back_at: new Date(),
          },
        },
        select: {
          id: true,
          status: true,
          rollback_at: true,
        },
      });

      return updatedRotation;
    }),

  /**
   * Cancel pending rotation
   */
  cancel: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const rotation = await ctx.db.api_credential_rotations.findUnique({
        where: { id: input.id },
        select: { id: true, status: true },
      });

      if (!rotation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Rotation not found',
        });
      }

      if (!['idle', 'in_progress'].includes(rotation.status || '')) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot cancel rotation with status: ${rotation.status}`,
        });
      }

      const updatedRotation = await ctx.db.api_credential_rotations.update({
        where: { id: input.id },
        data: {
          status: 'cancelled',
          completed_at: new Date(),
        },
        select: {
          id: true,
          status: true,
          completed_at: true,
        },
      });

      return updatedRotation;
    }),

  /**
   * Get rotation statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, byStatus, byType, avgDuration] = await Promise.all([
      ctx.db.api_credential_rotations.count(),
      ctx.db.api_credential_rotations.groupBy({
        by: ['status'],
        _count: true,
      }),
      ctx.db.api_credential_rotations.groupBy({
        by: ['rotation_type'],
        _count: true,
      }),
      // Calculate average rotation duration
      ctx.db.$queryRaw<Array<{ avg_minutes: number }>>`
        SELECT EXTRACT(EPOCH FROM AVG(completed_at - started_at)) / 60 as avg_minutes
        FROM api_credential_rotations
        WHERE completed_at IS NOT NULL AND started_at IS NOT NULL
      `,
    ]);

    const successful = await ctx.db.api_credential_rotations.count({
      where: { success: true },
    });

    const failed = await ctx.db.api_credential_rotations.count({
      where: { success: false },
    });

    const successRate = total > 0 ? Math.round((successful / total) * 1000) / 10 : 0;

    // Get rotations by credential (top 10)
    const rotationsByCredential = await ctx.db.api_credential_rotations.groupBy({
      by: ['credential_id'],
      _count: true,
      orderBy: {
        _count: {
          credential_id: 'desc',
        },
      },
      take: 10,
    });

    return {
      total,
      successful,
      failed,
      successRate,
      avgDurationMinutes: avgDuration[0]?.avg_minutes
        ? Math.round(avgDuration[0].avg_minutes * 10) / 10
        : 0,
      byStatus: byStatus.map(s => ({
        status: s.status,
        count: s._count,
      })),
      byType: byType.map(t => ({
        type: t.rotation_type,
        count: t._count,
      })),
      topCredentials: rotationsByCredential.map(r => ({
        credential_id: r.credential_id,
        rotation_count: r._count,
      })),
    };
  }),
});

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

/**
 * Task Attachments Router
 *
 * Manages task_attachments table using ctx.db pattern.
 * Covers file attachments on tasks and file movement to entity documents.
 */

export const taskAttachmentsRouter = createTRPCRouter({
  /**
   * Get attachment by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const attachment = await ctx.db.task_attachments.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          task_id: true,
          file_name: true,
          file_path: true,
          file_size: true,
          mime_type: true,
          thumbnail_path: true,
          uploaded_by: true,
          can_move_to_system: true,
          moved_to_entity_type: true,
          moved_to_entity_id: true,
          moved_at: true,
          created_at: true,
          updated_at: true,
          tasks: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      });

      if (!attachment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task attachment not found',
        });
      }

      return attachment;
    }),

  /**
   * Get attachments for task
   */
  getByTask: protectedProcedure
    .input(z.object({ task_id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const attachments = await ctx.db.task_attachments.findMany({
        where: {
          task_id: input.task_id,
        },
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          file_name: true,
          file_path: true,
          file_size: true,
          mime_type: true,
          thumbnail_path: true,
          uploaded_by: true,
          can_move_to_system: true,
          moved_to_entity_type: true,
          moved_at: true,
          created_at: true,
        },
      });

      return attachments;
    }),

  /**
   * Get attachments moved to entity
   */
  getByMovedEntity: protectedProcedure
    .input(
      z.object({
        entity_type: z.string(),
        entity_id: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const attachments = await ctx.db.task_attachments.findMany({
        where: {
          moved_to_entity_type: input.entity_type,
          moved_to_entity_id: input.entity_id,
        },
        orderBy: { moved_at: 'desc' },
        select: {
          id: true,
          task_id: true,
          file_name: true,
          file_path: true,
          file_size: true,
          mime_type: true,
          thumbnail_path: true,
          moved_at: true,
          tasks: {
            select: {
              title: true,
            },
          },
        },
      });

      return attachments;
    }),

  /**
   * Create attachment
   */
  create: protectedProcedure
    .input(
      z.object({
        task_id: z.string().uuid(),
        file_name: z.string(),
        file_path: z.string(),
        file_size: z.bigint(),
        mime_type: z.string().optional(),
        thumbnail_path: z.string().optional(),
        can_move_to_system: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify task exists
      const task = await ctx.db.tasks.findUnique({
        where: { id: input.task_id },
        select: { id: true },
      });

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      const newAttachment = await ctx.db.task_attachments.create({
        data: {
          task_id: input.task_id,
          file_name: input.file_name,
          file_path: input.file_path,
          file_size: input.file_size,
          mime_type: input.mime_type,
          thumbnail_path: input.thumbnail_path,
          uploaded_by: ctx.user!.id,
          can_move_to_system: input.can_move_to_system,
        },
        select: {
          id: true,
          task_id: true,
          file_name: true,
          file_path: true,
          file_size: true,
          created_at: true,
        },
      });

      return newAttachment;
    }),

  /**
   * Update attachment metadata
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        file_name: z.string().optional(),
        can_move_to_system: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const attachment = await ctx.db.task_attachments.findUnique({
        where: { id: input.id },
        select: { id: true, uploaded_by: true },
      });

      if (!attachment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Attachment not found',
        });
      }

      if (attachment.uploaded_by !== ctx.user!.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only update your own attachments',
        });
      }

      const { id: _id, ...updateData } = input;

      const updatedAttachment = await ctx.db.task_attachments.update({
        where: { id: input.id },
        data: {
          ...updateData,
          updated_at: new Date(),
        },
        select: {
          id: true,
          file_name: true,
          can_move_to_system: true,
          updated_at: true,
        },
      });

      return updatedAttachment;
    }),

  /**
   * Move attachment to entity document system
   */
  moveToEntity: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        entity_type: z.string(),
        entity_id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const attachment = await ctx.db.task_attachments.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          can_move_to_system: true,
          moved_to_entity_type: true,
        },
      });

      if (!attachment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Attachment not found',
        });
      }

      if (!attachment.can_move_to_system) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This attachment cannot be moved to the entity system',
        });
      }

      if (attachment.moved_to_entity_type) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Attachment has already been moved to another entity',
        });
      }

      const movedAttachment = await ctx.db.task_attachments.update({
        where: { id: input.id },
        data: {
          moved_to_entity_type: input.entity_type,
          moved_to_entity_id: input.entity_id,
          moved_at: new Date(),
          updated_at: new Date(),
        },
        select: {
          id: true,
          moved_to_entity_type: true,
          moved_to_entity_id: true,
          moved_at: true,
        },
      });

      return movedAttachment;
    }),

  /**
   * Delete attachment
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const attachment = await ctx.db.task_attachments.findUnique({
        where: { id: input.id },
        select: { id: true, uploaded_by: true },
      });

      if (!attachment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Attachment not found',
        });
      }

      if (attachment.uploaded_by !== ctx.user!.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own attachments',
        });
      }

      await ctx.db.task_attachments.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Get attachment statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, movedToEntity, byMimeType] = await Promise.all([
      ctx.db.task_attachments.count(),
      ctx.db.task_attachments.count({
        where: {
          moved_to_entity_type: { not: null },
        },
      }),
      ctx.db.task_attachments.groupBy({
        by: ['mime_type'],
        _count: true,
        orderBy: {
          _count: {
            mime_type: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    // Calculate total storage size
    const allAttachments = await ctx.db.task_attachments.findMany({
      select: { file_size: true },
    });

    const totalBytes = allAttachments.reduce(
      (sum, att) => sum + Number(att.file_size),
      0
    );
    const totalMB = Math.round((totalBytes / (1024 * 1024)) * 10) / 10;

    return {
      total,
      movedToEntity,
      totalStorageMB: totalMB,
      byMimeType: byMimeType.map(m => ({
        mime_type: m.mime_type,
        count: m._count,
      })),
    };
  }),
});

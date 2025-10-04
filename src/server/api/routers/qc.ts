/**
 * QC Mobile tRPC Router
 *
 * Mobile-optimized quality control API for prototype and production inspections
 * with photo-based issue tracking, voice notes, and multi-party collaboration.
 */

import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

export const qcRouter = createTRPCRouter({
  // ============================================================================
  // QC INSPECTIONS
  // ============================================================================

  /**
   * Get all QC inspections with filters
   */
  getAllInspections: publicProcedure
    .input(
      z.object({
        prototypeProductionId: z.string().uuid().optional(),
        productionItemId: z.string().uuid().optional(),
        status: z.enum(['pending', 'in_progress', 'passed', 'failed', 'on_hold']).optional(),
        assignedInspectorId: z.string().uuid().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.prototypeProductionId) {
        where.prototype_production_id = input.prototypeProductionId;
      }

      if (input.productionItemId) {
        where.production_item_id = input.productionItemId;
      }

      if (input.status) {
        where.status = input.status;
      }

      if (input.assignedInspectorId) {
        where.assigned_inspector_id = input.assignedInspectorId;
      }

      const [inspections, total] = await Promise.all([
        ctx.db.qc_inspections.findMany({
          where,
          include: {
            prototype_production: {
              include: {
                prototypes: {
                  select: {
                    name: true,
                    prototype_number: true,
                  },
                },
              },
            },
            production_items: {
              select: {
                item_name: true,
              },
            },
            _count: {
              select: {
                qc_defects: true,
                qc_photos: true,
              },
            },
          },
          orderBy: {
            created_at: 'desc',
          },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.qc_inspections.count({ where }),
      ]);

      return {
        inspections,
        total,
        hasMore: input.offset + input.limit < total,
        nextOffset: input.offset + input.limit < total ? input.offset + input.limit : null,
      };
    }),

  /**
   * Get single QC inspection by ID
   */
  getInspectionById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const inspection = await ctx.db.qc_inspections.findUnique({
        where: { id: input.id },
        include: {
          prototype_production: {
            include: {
              prototypes: {
                select: {
                  id: true,
                  name: true,
                  prototype_number: true,
                },
              },
            },
          },
          production_items: {
            select: {
              id: true,
              item_name: true,
            },
          },
          qc_defects: {
            include: {
              qc_photos: {
                orderBy: {
                  created_at: 'desc',
                },
              },
              qc_issue_comments: {
                include: {
                  users: {
                    select: {
                      email: true,
                    },
                  },
                },
                orderBy: {
                  created_at: 'asc',
                },
              },
              _count: {
                select: {
                  qc_photos: true,
                  qc_issue_comments: true,
                },
              },
            },
            orderBy: {
              created_at: 'desc',
            },
          },
          qc_photos: {
            orderBy: {
              created_at: 'desc',
            },
          },
        },
      });

      if (!inspection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'QC inspection not found',
        });
      }

      return inspection;
    }),

  /**
   * Create QC inspection
   */
  createInspection: publicProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        prototypeProductionId: z.string().uuid().optional(),
        productionItemId: z.string().uuid().optional(),
        qcStage: z.enum(['incoming_inspection', 'in_process_check', 'final_inspection', 'packaging_check']),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User must be logged in',
        });
      }

      const userId = ctx.session.user.id;

      const inspection = await ctx.db.qc_inspections.create({
        data: {
          order_id: input.orderId,
          prototype_production_id: input.prototypeProductionId,
          production_item_id: input.productionItemId,
          assigned_inspector_id: userId,
          qc_stage: input.qcStage,
          notes: input.notes,
          status: 'in_progress',
        },
        include: {
          prototype_production: {
            include: {
              prototypes: true,
            },
          },
          production_items: true,
        },
      });

      return {
        success: true,
        message: 'QC inspection created successfully',
        inspection,
      };
    }),

  /**
   * Update QC inspection status
   */
  updateInspectionStatus: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(['pending', 'in_progress', 'passed', 'failed', 'on_hold']),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const inspection = await ctx.db.qc_inspections.update({
        where: { id: input.id },
        data: {
          status: input.status,
          notes: input.notes,
          completed_at: input.status === 'passed' || input.status === 'failed' ? new Date() : undefined,
        },
      });

      return {
        success: true,
        message: 'QC inspection status updated',
        inspection,
      };
    }),

  // ============================================================================
  // QC DEFECTS (ISSUES)
  // ============================================================================

  /**
   * Get defects for inspection
   */
  getDefects: publicProcedure
    .input(
      z.object({
        inspectionId: z.string().uuid(),
        severity: z.enum(['critical', 'major', 'minor', 'cosmetic']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        qc_inspection_id: input.inspectionId,
      };

      if (input.severity) {
        where.severity = input.severity;
      }

      const defects = await ctx.db.qc_defects.findMany({
        where,
        include: {
          qc_photos: {
            orderBy: {
              created_at: 'desc',
            },
          },
          qc_issue_comments: {
            include: {
              users: {
                select: {
                  email: true,
                },
              },
            },
            orderBy: {
              created_at: 'asc',
            },
          },
          _count: {
            select: {
              qc_photos: true,
              qc_issue_comments: true,
            },
          },
        },
        orderBy: [
          { severity: 'asc' }, // critical first
          { created_at: 'desc' },
        ],
      });

      return defects;
    }),

  /**
   * Add defect (issue) to inspection
   */
  addDefect: publicProcedure
    .input(
      z.object({
        inspectionId: z.string().uuid(),
        defectType: z.string(),
        severity: z.enum(['critical', 'major', 'minor', 'cosmetic']),
        description: z.string(),
        location: z.string().optional(),
        actionRequired: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const defect = await ctx.db.qc_defects.create({
        data: {
          qc_inspection_id: input.inspectionId,
          defect_type: input.defectType,
          severity: input.severity,
          description: input.description,
          location: input.location,
          action_required: input.actionRequired,
        },
      });

      return {
        success: true,
        message: 'Defect added successfully',
        defect,
      };
    }),

  /**
   * Update defect
   */
  updateDefect: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        actionRequired: z.string().optional(),
        resolvedAt: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const defect = await ctx.db.qc_defects.update({
        where: { id: input.id },
        data: {
          action_required: input.actionRequired,
          resolved_at: input.resolvedAt,
        },
      });

      return {
        success: true,
        message: 'Defect updated',
        defect,
      };
    }),

  // ============================================================================
  // QC PHOTOS
  // ============================================================================

  /**
   * Get photos for inspection or defect
   */
  getPhotos: publicProcedure
    .input(
      z.object({
        inspectionId: z.string().uuid().optional(),
        defectId: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!input.inspectionId && !input.defectId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Either inspectionId or defectId must be provided',
        });
      }

      const where: any = {};

      if (input.inspectionId) where.qc_inspection_id = input.inspectionId;
      if (input.defectId) where.qc_defect_id = input.defectId;

      const photos = await ctx.db.qc_photos.findMany({
        where,
        orderBy: {
          created_at: 'desc',
        },
      });

      return photos;
    }),

  /**
   * Upload photo to inspection or defect
   */
  uploadPhoto: publicProcedure
    .input(
      z.object({
        inspectionId: z.string().uuid().optional(),
        defectId: z.string().uuid().optional(),
        photoUrl: z.string(),
        caption: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User must be logged in',
        });
      }

      if (!input.inspectionId && !input.defectId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Either inspectionId or defectId must be provided',
        });
      }

      const userId = ctx.session.user.id;

      const photo = await ctx.db.qc_photos.create({
        data: {
          qc_inspection_id: input.inspectionId,
          qc_defect_id: input.defectId,
          photo_url: input.photoUrl,
          caption: input.caption,
          uploaded_by: userId,
        },
      });

      return {
        success: true,
        message: 'Photo uploaded successfully',
        photo,
      };
    }),

  /**
   * Delete photo
   */
  deletePhoto: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.qc_photos.delete({
        where: { id: input.id },
      });

      return {
        success: true,
        message: 'Photo deleted successfully',
      };
    }),

  // ============================================================================
  // QC ISSUE COMMENTS (MOBILE-OPTIMIZED)
  // ============================================================================

  /**
   * Get comments for an issue
   */
  getComments: publicProcedure
    .input(z.object({ issueId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const comments = await ctx.db.qc_issue_comments.findMany({
        where: {
          issue_id: input.issueId,
        },
        include: {
          users: {
            select: {
              email: true,
            },
          },
        },
        orderBy: {
          created_at: 'asc',
        },
      });

      return comments;
    }),

  /**
   * Add comment to issue
   */
  addComment: publicProcedure
    .input(
      z.object({
        issueId: z.string().uuid(),
        commentText: z.string(),
        authorRole: z.enum(['qc_team', 'factory', 'limn_team']),
        voiceNoteUrl: z.string().optional(),
        voiceNoteDuration: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User must be logged in',
        });
      }

      const userId = ctx.session.user.id;

      const comment = await ctx.db.qc_issue_comments.create({
        data: {
          issue_id: input.issueId,
          comment_text: input.commentText,
          author_id: userId,
          author_role: input.authorRole,
          voice_note_url: input.voiceNoteUrl,
          voice_note_duration: input.voiceNoteDuration,
        },
        include: {
          users: {
            select: {
              email: true,
            },
          },
        },
      });

      return {
        success: true,
        message: 'Comment added successfully',
        comment,
      };
    }),

  /**
   * Delete comment
   */
  deleteComment: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.qc_issue_comments.delete({
        where: { id: input.id },
      });

      return {
        success: true,
        message: 'Comment deleted successfully',
      };
    }),

  // ============================================================================
  // QC CHECKPOINTS
  // ============================================================================

  /**
   * Get checkpoints for inspection
   */
  getCheckpoints: publicProcedure
    .input(z.object({ inspectionId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const checkpoints = await ctx.db.qc_checkpoints.findMany({
        where: {
          qc_inspection_id: input.inspectionId,
        },
        orderBy: {
          created_at: 'asc',
        },
      });

      return checkpoints;
    }),

  /**
   * Add checkpoint to inspection
   */
  addCheckpoint: publicProcedure
    .input(
      z.object({
        inspectionId: z.string().uuid(),
        checkpointName: z.string(),
        status: z.enum(['pending', 'passed', 'failed']).default('pending'),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User must be logged in',
        });
      }

      const userId = ctx.session.user.id;

      const checkpoint = await ctx.db.qc_checkpoints.create({
        data: {
          qc_inspection_id: input.inspectionId,
          checkpoint_name: input.checkpointName,
          status: input.status,
          notes: input.notes,
          inspector_id: userId,
          completed_at: input.status !== 'pending' ? new Date() : undefined,
        },
      });

      return {
        success: true,
        message: 'Checkpoint added successfully',
        checkpoint,
      };
    }),

  /**
   * Update checkpoint status
   */
  updateCheckpoint: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(['pending', 'passed', 'failed']),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const checkpoint = await ctx.db.qc_checkpoints.update({
        where: { id: input.id },
        data: {
          status: input.status,
          notes: input.notes,
          completed_at: input.status !== 'pending' ? new Date() : null,
        },
      });

      return {
        success: true,
        message: 'Checkpoint updated successfully',
        checkpoint,
      };
    }),

  // ============================================================================
  // STATISTICS & REPORTING
  // ============================================================================

  /**
   * Get inspection statistics
   */
  getInspectionStats: publicProcedure
    .input(
      z.object({
        prototypeProductionId: z.string().uuid().optional(),
        productionItemId: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.prototypeProductionId) {
        where.prototype_production_id = input.prototypeProductionId;
      }

      if (input.productionItemId) {
        where.production_item_id = input.productionItemId;
      }

      const [
        totalInspections,
        pendingInspections,
        inProgressInspections,
        passedInspections,
        failedInspections,
        totalDefects,
        criticalDefects,
        majorDefects,
        minorDefects,
      ] = await Promise.all([
        ctx.db.qc_inspections.count({ where }),
        ctx.db.qc_inspections.count({ where: { ...where, status: 'pending' } }),
        ctx.db.qc_inspections.count({ where: { ...where, status: 'in_progress' } }),
        ctx.db.qc_inspections.count({ where: { ...where, status: 'passed' } }),
        ctx.db.qc_inspections.count({ where: { ...where, status: 'failed' } }),
        ctx.db.qc_defects.count({
          where: {
            qc_inspections: where,
          },
        }),
        ctx.db.qc_defects.count({
          where: {
            qc_inspections: where,
            severity: 'critical',
          },
        }),
        ctx.db.qc_defects.count({
          where: {
            qc_inspections: where,
            severity: 'major',
          },
        }),
        ctx.db.qc_defects.count({
          where: {
            qc_inspections: where,
            severity: 'minor',
          },
        }),
      ]);

      return {
        inspections: {
          total: totalInspections,
          pending: pendingInspections,
          inProgress: inProgressInspections,
          passed: passedInspections,
          failed: failedInspections,
        },
        defects: {
          total: totalDefects,
          critical: criticalDefects,
          major: majorDefects,
          minor: minorDefects,
        },
      };
    }),

  // ============================================================================
  // CATALOG ITEM QC OPERATIONS
  // ============================================================================

  /**
   * Get QC inspections for a catalog item
   * Links: catalog item → order_items → qc_inspections
   */
  getInspectionsByCatalogItem: publicProcedure
    .input(
      z.object({
        itemId: z.string().uuid(),
        limit: z.number().min(1).max(50).default(5),
      })
    )
    .query(async ({ ctx, input }) => {
      // First get all order items for this catalog item
      const orderItems = await (ctx.db as any).order_items.findMany({
        where: { item_id: input.itemId },
        select: { id: true },
      });

      const orderItemIds = orderItems.map((oi: any) => oi.id);

      if (orderItemIds.length === 0) {
        // No orders yet for this catalog item
        return {
          inspections: [],
          summary: {
            totalInspections: 0,
            passRate: 0,
            avgDefects: 0,
            lastInspectionDate: null,
          },
        };
      }

      // Get all inspections for these order items
      const allInspections = await ctx.db.qc_inspections.findMany({
        where: {
          order_item_id: { in: orderItemIds },
        },
        include: {
          order_items: {
            select: {
              id: true,
              full_sku: true,
              description: true,
            },
          },
          _count: {
            select: {
              qc_defects: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      // Calculate summary statistics
      const totalInspections = allInspections.length;
      const passedInspections = allInspections.filter((i) => i.status === 'passed').length;
      const passRate = totalInspections > 0 ? Math.round((passedInspections / totalInspections) * 100) : 0;
      const totalDefects = allInspections.reduce((sum, i) => sum + (i._count.qc_defects || 0), 0);
      const avgDefects = totalInspections > 0 ? Math.round((totalDefects / totalInspections) * 100) / 100 : 0;
      const lastInspectionDate =
        allInspections.length > 0 ? allInspections[0].created_at : null;

      // Return recent inspections (limited)
      const recentInspections = allInspections.slice(0, input.limit);

      return {
        inspections: recentInspections,
        summary: {
          totalInspections,
          passRate,
          avgDefects,
          lastInspectionDate,
        },
      };
    }),
});

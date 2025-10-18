/**
 * Prototypes tRPC Router
 *
 * Comprehensive API for prototype management including production tracking,
 * milestone management, photo documentation, reviews, feedback, and revisions.
 */

import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

export const prototypesRouter = createTRPCRouter({
  // ============================================================================
  // PROTOTYPES (Core Model) - 10 endpoints
  // ============================================================================

  /**
   * Get all prototypes with filters and pagination
   */
  getAll: publicProcedure
    .input(
      z.object({
        status: z.string().optional(),
        priority: z.string().optional(),
        prototypeType: z.string().optional(),
        designProjectId: z.string().uuid().optional(),
        crmProjectId: z.string().uuid().optional(),
        search: z.string().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {};

      if (input.status) {
        where.status = input.status;
      }

      if (input.priority) {
        where.priority = input.priority;
      }

      if (input.prototypeType) {
        where.prototype_type = input.prototypeType;
      }

      if (input.designProjectId) {
        where.design_project_id = input.designProjectId;
      }

      if (input.crmProjectId) {
        where.crm_project_id = input.crmProjectId;
      }

      if (input.search) {
        where.OR = [
          { name: { contains: input.search, mode: 'insensitive' } },
          { prototype_number: { contains: input.search, mode: 'insensitive' } },
          { description: { contains: input.search, mode: 'insensitive' } },
        ];
      }

      const [prototypes, total] = await Promise.all([
        ctx.db.prototypes.findMany({
          where,
          include: {
            design_projects: {
              select: {
                project_name: true,
              },
            },
            projects: {
              select: {
                name: true,
              },
            },
            items: {
              select: {
                name: true,
                sku_full: true,
              },
            },
            prototype_production: {
              select: {
                status: true,
                overall_progress: true,
              },
            },
          },
          orderBy: {
            created_at: 'desc',
          },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.prototypes.count({ where }),
      ]);

      return {
        prototypes,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  /**
   * Get single prototype with all relations
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const prototype = await ctx.db.prototypes.findUnique({
        where: { id: input.id },
        include: {
          design_projects: {
            select: {
              project_name: true,
            },
          },
          projects: {
            select: {
              name: true,
              customer_id: true,
            },
          },
          items: {
            select: {
              name: true,
              sku_full: true,
              description: true,
            },
          },
          prototype_production: {
            include: {
              partners: {
                select: {
                  company_name: true,
                },
              },
              users: {
                select: {
                  email: true,
                },
              },
            },
          },
          users: {
            select: {
              email: true,
            },
          },
          prototype_milestones: {
            orderBy: {
              sequence_order: 'asc',
            },
            take: 5, // Get first 5 milestones for overview
          },
          prototype_photos: {
            where: {
              is_featured: true,
            },
            take: 3,
          },
          prototype_reviews: {
            orderBy: {
              review_date: 'desc',
            },
            take: 3,
          },
        },
      });

      if (!prototype) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Prototype not found',
        });
      }

      return prototype;
    }),

  /**
   * Get prototype by prototype_number (PROTO-2025-0001)
   */
  getByNumber: publicProcedure
    .input(z.object({ prototypeNumber: z.string() }))
    .query(async ({ ctx, input }) => {
      const prototype = await ctx.db.prototypes.findUnique({
        where: { prototype_number: input.prototypeNumber },
        include: {
          design_projects: true,
          projects: true,
          items: true,
          prototype_production: {
            include: {
              partners: true,
              users: true,
            },
          },
        },
      });

      if (!prototype) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Prototype ${input.prototypeNumber} not found`,
        });
      }

      return prototype;
    }),

  /**
   * Get prototype statistics
   */
  getStats: publicProcedure.query(async ({ ctx }) => {
    // Note: groupBy not supported by wrapper, using findMany + manual grouping
    const [
      total,
      allPrototypes,
    ] = await Promise.all([
      ctx.db.prototypes.count(),
      ctx.db.prototypes.findMany(),
    ]);

    // Manual grouping by status, priority, and type
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const byType: Record<string, number> = {};

    allPrototypes.forEach((proto: any) => {
      // Count by status
      if (proto.status) {
        byStatus[proto.status] = (byStatus[proto.status] || 0) + 1;
      }

      // Count by priority
      if (proto.priority) {
        byPriority[proto.priority] = (byPriority[proto.priority] || 0) + 1;
      }

      // Count by prototype_type
      if (proto.prototype_type) {
        byType[proto.prototype_type] = (byType[proto.prototype_type] || 0) + 1;
      }
    });

    return {
      total,
      byStatus,
      byPriority,
      byType,
    };
  }),

  /**
   * Create new prototype with auto-generated prototype_number
   */
  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        prototypeType: z.string().default('furniture'),
        designProjectId: z.string().uuid().optional(),
        baseItemId: z.string().uuid().optional(),
        crmProjectId: z.string().uuid().optional(),
        priority: z.string().default('medium'),
        isClientSpecific: z.boolean().default(false),
        isCatalogCandidate: z.boolean().default(false),
        specifications: z.any().optional(),
        targetPriceUsd: z.number().optional(),
        targetCostUsd: z.number().optional(),
        notes: z.string().optional(),
        tags: z.array(z.string()).optional(),
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

      // Generate prototype number: PROTO-2025-0001
      const year = new Date().getFullYear();
      const lastPrototypes = await ctx.db.prototypes.findMany({
        where: {
          prototype_number: {
            startsWith: `PROTO-${year}-`,
          },
        },
        orderBy: {
          prototype_number: 'desc',
        },
      });
      const lastPrototype = lastPrototypes.length > 0 ? lastPrototypes[0] : null;

      let nextNumber = 1;
      if (lastPrototype) {
        const lastNumber = parseInt(lastPrototype.prototype_number.split('-')[2] || '0');
        nextNumber = lastNumber + 1;
      }

      const prototypeNumber = `PROTO-${year}-${nextNumber.toString().padStart(4, '0')}`;

      const prototype = await ctx.db.prototypes.create({
        data: {
          prototype_number: prototypeNumber,
          name: input.name,
          description: input.description,
          prototype_type: input.prototypeType,
          design_project_id: input.designProjectId,
          base_item_id: input.baseItemId,
          crm_project_id: input.crmProjectId,
          status: 'concept',
          priority: input.priority,
          is_client_specific: input.isClientSpecific,
          is_catalog_candidate: input.isCatalogCandidate,
          specifications: input.specifications,
          target_price_usd: input.targetPriceUsd,
          target_cost_usd: input.targetCostUsd,
          notes: input.notes,
          tags: input.tags || [],
          created_by: userId,
        },
      });

      return {
        success: true,
        prototype,
        message: `Prototype ${prototypeNumber} created successfully`,
      };
    }),

  /**
   * Update prototype
   */
  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().optional(),
        description: z.string().optional(),
        prototypeType: z.string().optional(),
        priority: z.string().optional(),
        isClientSpecific: z.boolean().optional(),
        isCatalogCandidate: z.boolean().optional(),
        specifications: z.any().optional(),
        targetPriceUsd: z.number().optional(),
        targetCostUsd: z.number().optional(),
        notes: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const prototype = await ctx.db.prototypes.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          prototype_type: data.prototypeType,
          priority: data.priority,
          is_client_specific: data.isClientSpecific,
          is_catalog_candidate: data.isCatalogCandidate,
          specifications: data.specifications,
          target_price_usd: data.targetPriceUsd,
          target_cost_usd: data.targetCostUsd,
          notes: data.notes,
          tags: data.tags,
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        prototype,
        message: 'Prototype updated successfully',
      };
    }),

  /**
   * Delete prototype
   */
  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.prototypes.delete({
        where: { id: input.id },
      });

      return {
        success: true,
        message: 'Prototype deleted successfully',
      };
    }),

  /**
   * Update prototype status
   */
  updateStatus: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum([
          'concept',
          'design_review',
          'design_approved',
          'production_pending',
          'in_production',
          'assembly_complete',
          'quality_review',
          'client_review',
          'approved',
          'rejected',
          'ready_for_catalog',
          'archived',
        ]),
        statusNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const prototype = await ctx.db.prototypes.update({
        where: { id: input.id },
        data: {
          status: input.status,
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        prototype,
        message: `Prototype status updated to ${input.status}`,
      };
    }),

  /**
   * Advanced search prototypes
   */
  search: publicProcedure
    .input(
      z.object({
        query: z.string(),
        filters: z
          .object({
            status: z.array(z.string()).optional(),
            priority: z.array(z.string()).optional(),
            prototypeType: z.array(z.string()).optional(),
            isClientSpecific: z.boolean().optional(),
            isCatalogCandidate: z.boolean().optional(),
          })
          .optional(),
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        OR: [
          { name: { contains: input.query, mode: 'insensitive' } },
          { prototype_number: { contains: input.query, mode: 'insensitive' } },
          { description: { contains: input.query, mode: 'insensitive' } },
          {
            tags: {
              has: input.query,
            },
          },
          { notes: { contains: input.query, mode: 'insensitive' } },
        ],
      };

      if (input.filters) {
        if (input.filters.status && input.filters.status.length > 0) {
          where.status = { in: input.filters.status };
        }
        if (input.filters.priority && input.filters.priority.length > 0) {
          where.priority = { in: input.filters.priority };
        }
        if (input.filters.prototypeType && input.filters.prototypeType.length > 0) {
          where.prototype_type = { in: input.filters.prototypeType };
        }
        if (input.filters.isClientSpecific !== undefined) {
          where.is_client_specific = input.filters.isClientSpecific;
        }
        if (input.filters.isCatalogCandidate !== undefined) {
          where.is_catalog_candidate = input.filters.isCatalogCandidate;
        }
      }

      const prototypes = await ctx.db.prototypes.findMany({
        where,
        include: {
          design_projects: {
            select: {
              project_name: true,
            },
          },
          projects: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        take: input.limit,
      });

      return prototypes;
    }),

  /**
   * Get recently created/updated prototypes
   */
  getRecent: publicProcedure
    .input(
      z.object({
        limit: z.number().default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const prototypes = await ctx.db.prototypes.findMany({
        orderBy: {
          updated_at: 'desc',
        },
        take: input.limit,
        include: {
          prototype_production: {
            select: {
              status: true,
              overall_progress: true,
            },
          },
        },
      });

      return prototypes;
    }),

  // ============================================================================
  // PROTOTYPE PRODUCTION - 6 endpoints
  // ============================================================================

  /**
   * Get production details for a prototype
   */
  getProduction: publicProcedure
    .input(z.object({ prototypeId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const production = await ctx.db.prototype_production.findUnique({
        where: { prototype_id: input.prototypeId },
        include: {
          partners: {
            select: {
              company_name: true,
              primary_contact: true,
              primary_email: true,
            },
          },
          users: {
            select: {
              email: true,
            },
          },
          shop_drawings: {
            select: {
              id: true,
              drawing_number: true,
              status: true,
            },
          },
          qc_inspections: {
            select: {
              id: true,
              qc_stage: true,
              status: true,
            },
          },
        },
      });

      return production;
    }),

  /**
   * Create production record for prototype
   */
  createProduction: publicProcedure
    .input(
      z.object({
        prototypeId: z.string().uuid(),
        factoryId: z.string().uuid().optional(),
        productionManagerId: z.string().uuid().optional(),
        startDate: z.date().optional(),
        targetDate: z.date().optional(),
        estimatedCost: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const production = await ctx.db.prototype_production.create({
        data: {
          prototype_id: input.prototypeId,
          factory_id: input.factoryId,
          production_manager_id: input.productionManagerId,
          status: 'not_started',
          start_date: input.startDate,
          target_date: input.targetDate,
          estimated_cost: input.estimatedCost,
          notes: input.notes,
        },
      });

      return {
        success: true,
        production,
        message: 'Production record created successfully',
      };
    }),

  /**
   * Update production details
   */
  updateProduction: publicProcedure
    .input(
      z.object({
        prototypeId: z.string().uuid(),
        status: z.string().optional(),
        startDate: z.date().optional(),
        targetDate: z.date().optional(),
        estimatedCompletion: z.date().optional(),
        actualCompletion: z.date().optional(),
        currentPhase: z.string().optional(),
        estimatedCost: z.number().optional(),
        actualCost: z.number().optional(),
        costNotes: z.string().optional(),
        qualityScore: z.number().min(0).max(100).optional(),
        defectsFound: z.number().optional(),
        reworkRequired: z.boolean().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { prototypeId, ...data } = input;

      const production = await ctx.db.prototype_production.update({
        where: { prototype_id: prototypeId },
        data: {
          status: data.status,
          start_date: data.startDate,
          target_date: data.targetDate,
          estimated_completion: data.estimatedCompletion,
          actual_completion: data.actualCompletion,
          current_phase: data.currentPhase,
          estimated_cost: data.estimatedCost,
          actual_cost: data.actualCost,
          cost_notes: data.costNotes,
          quality_score: data.qualityScore,
          defects_found: data.defectsFound,
          rework_required: data.reworkRequired,
          notes: data.notes,
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        production,
        message: 'Production details updated successfully',
      };
    }),

  /**
   * Update production progress percentage
   */
  updateProgress: publicProcedure
    .input(
      z.object({
        prototypeId: z.string().uuid(),
        progress: z.number().min(0).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const production = await ctx.db.prototype_production.update({
        where: { prototype_id: input.prototypeId },
        data: {
          overall_progress: input.progress,
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        production,
        message: `Production progress updated to ${input.progress}%`,
      };
    }),

  /**
   * Assign factory to production
   */
  assignFactory: publicProcedure
    .input(
      z.object({
        prototypeId: z.string().uuid(),
        factoryId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const production = await ctx.db.prototype_production.update({
        where: { prototype_id: input.prototypeId },
        data: {
          factory_id: input.factoryId,
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        production,
        message: 'Factory assigned successfully',
      };
    }),

  /**
   * Assign production manager
   */
  assignManager: publicProcedure
    .input(
      z.object({
        prototypeId: z.string().uuid(),
        managerId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const production = await ctx.db.prototype_production.update({
        where: { prototype_id: input.prototypeId },
        data: {
          production_manager_id: input.managerId,
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        production,
        message: 'Production manager assigned successfully',
      };
    }),

  // ============================================================================
  // PROTOTYPE MILESTONES - 8 endpoints
  // ============================================================================

  /**
   * Get all milestones for a prototype
   */
  getMilestones: publicProcedure
    .input(z.object({ prototypeId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const milestones = await ctx.db.prototype_milestones.findMany({
        where: { prototype_id: input.prototypeId },
        include: {
          users_prototype_milestones_assigned_toTousers: {
            select: {
              email: true,
            },
          },
          users_prototype_milestones_completed_byTousers: {
            select: {
              email: true,
            },
          },
          prototype_milestones: {
            select: {
              id: true,
              milestone_name: true,
              status: true,
            },
          },
          prototype_photos: {
            select: {
              id: true,
              photo_type: true,
            },
          },
          prototype_documents: {
            select: {
              id: true,
              document_type: true,
            },
          },
        },
        orderBy: {
          sequence_order: 'asc',
        },
      });

      return milestones;
    }),

  /**
   * Get single milestone details
   */
  getMilestoneById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const milestone = await ctx.db.prototype_milestones.findUnique({
        where: { id: input.id },
        include: {
          users_prototype_milestones_assigned_toTousers: {
            select: {
              email: true,
            },
          },
          users_prototype_milestones_completed_byTousers: {
            select: {
              email: true,
            },
          },
          prototype_milestones: {
            select: {
              milestone_name: true,
              status: true,
            },
          },
          other_prototype_milestones: {
            select: {
              id: true,
              milestone_name: true,
              status: true,
            },
          },
          prototype_photos: true,
          prototype_documents: true,
        },
      });

      if (!milestone) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Milestone not found',
        });
      }

      return milestone;
    }),

  /**
   * Create new milestone
   */
  createMilestone: publicProcedure
    .input(
      z.object({
        prototypeId: z.string().uuid(),
        milestoneName: z.string(),
        milestoneType: z.string().default('production'),
        description: z.string().optional(),
        sequenceOrder: z.number(),
        dependsOnMilestone: z.string().uuid().optional(),
        plannedStart: z.date().optional(),
        plannedEnd: z.date().optional(),
        assignedTo: z.string().uuid().optional(),
        qualityCheckpoint: z.boolean().default(false),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const milestone = await ctx.db.prototype_milestones.create({
        data: {
          prototype_id: input.prototypeId,
          milestone_name: input.milestoneName,
          milestone_type: input.milestoneType,
          description: input.description,
          sequence_order: input.sequenceOrder,
          depends_on_milestone: input.dependsOnMilestone,
          status: 'pending',
          completion_percentage: 0,
          planned_start: input.plannedStart,
          planned_end: input.plannedEnd,
          assigned_to: input.assignedTo,
          quality_checkpoint: input.qualityCheckpoint,
          notes: input.notes,
        },
      });

      return {
        success: true,
        milestone,
        message: 'Milestone created successfully',
      };
    }),

  /**
   * Update milestone details
   */
  updateMilestone: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        milestoneName: z.string().optional(),
        milestoneType: z.string().optional(),
        description: z.string().optional(),
        sequenceOrder: z.number().optional(),
        dependsOnMilestone: z.string().uuid().optional(),
        plannedStart: z.date().optional(),
        plannedEnd: z.date().optional(),
        actualStart: z.date().optional(),
        actualEnd: z.date().optional(),
        assignedTo: z.string().uuid().optional(),
        qualityCheckpoint: z.boolean().optional(),
        qualityPassed: z.boolean().optional(),
        qualityNotes: z.string().optional(),
        notes: z.string().optional(),
        blockers: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const milestone = await ctx.db.prototype_milestones.update({
        where: { id },
        data: {
          milestone_name: data.milestoneName,
          milestone_type: data.milestoneType,
          description: data.description,
          sequence_order: data.sequenceOrder,
          depends_on_milestone: data.dependsOnMilestone,
          planned_start: data.plannedStart,
          planned_end: data.plannedEnd,
          actual_start: data.actualStart,
          actual_end: data.actualEnd,
          assigned_to: data.assignedTo,
          quality_checkpoint: data.qualityCheckpoint,
          quality_passed: data.qualityPassed,
          quality_notes: data.qualityNotes,
          notes: data.notes,
          blockers: data.blockers,
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        milestone,
        message: 'Milestone updated successfully',
      };
    }),

  /**
   * Update milestone status
   */
  updateMilestoneStatus: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(['pending', 'in_progress', 'blocked', 'completed', 'skipped']),
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
      const updateData: any = {
        status: input.status,
        updated_at: new Date(),
      };

      // If completed, set completion timestamp and user
      if (input.status === 'completed') {
        updateData.completed_at = new Date();
        updateData.completed_by = userId;
        updateData.completion_percentage = 100;
      }

      // If starting, set actual start date
      if (input.status === 'in_progress') {
        const milestone = await ctx.db.prototype_milestones.findUnique({
          where: { id: input.id },
        });

        if (milestone && !milestone.actual_start) {
          updateData.actual_start = new Date();
        }
      }

      const milestone = await ctx.db.prototype_milestones.update({
        where: { id: input.id },
        data: updateData,
      });

      return {
        success: true,
        milestone,
        message: `Milestone status updated to ${input.status}`,
      };
    }),

  /**
   * Update milestone progress percentage
   */
  updateMilestoneProgress: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        progress: z.number().min(0).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const milestone = await ctx.db.prototype_milestones.update({
        where: { id: input.id },
        data: {
          completion_percentage: input.progress,
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        milestone,
        message: `Milestone progress updated to ${input.progress}%`,
      };
    }),

  /**
   * Delete milestone
   */
  deleteMilestone: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.prototype_milestones.delete({
        where: { id: input.id },
      });

      return {
        success: true,
        message: 'Milestone deleted successfully',
      };
    }),

  /**
   * Reorder milestones
   */
  reorderMilestones: publicProcedure
    .input(
      z.object({
        milestones: z.array(
          z.object({
            id: z.string().uuid(),
            sequenceOrder: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Update sequence_order for each milestone in transaction
      await ctx.db.$transaction(
        input.milestones.map((m) =>
          ctx.db.prototype_milestones.update({
            where: { id: m.id },
            data: { sequence_order: m.sequenceOrder },
          })
        )
      );

      return {
        success: true,
        message: 'Milestones reordered successfully',
      };
    }),

  // ============================================================================
  // PROTOTYPE PHOTOS - 7 endpoints
  // ============================================================================

  /**
   * Get photos for prototype
   */
  getPhotos: publicProcedure
    .input(
      z.object({
        prototypeId: z.string().uuid(),
        milestoneId: z.string().uuid().optional(),
        photoType: z.string().optional(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        prototype_id: input.prototypeId,
      };

      if (input.milestoneId) {
        where.milestone_id = input.milestoneId;
      }

      if (input.photoType) {
        where.photo_type = input.photoType;
      }

      const photos = await ctx.db.prototype_photos.findMany({
        where,
        include: {
          prototype_milestones: {
            select: {
              milestone_name: true,
            },
          },
          users: {
            select: {
              email: true,
            },
          },
          prototype_photo_comments: {
            where: {
              parent_comment_id: null,
            },
            orderBy: {
              created_at: 'desc',
            },
            take: 3,
          },
        },
        orderBy: {
          uploaded_at: 'desc',
        },
        take: input.limit,
      });

      return photos;
    }),

  /**
   * Get single photo with comments
   */
  getPhotoById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const photo = await ctx.db.prototype_photos.findUnique({
        where: { id: input.id },
        include: {
          prototype_milestones: {
            select: {
              milestone_name: true,
              sequence_order: true,
            },
          },
          users: {
            select: {
              email: true,
            },
          },
          prototype_photo_comments: {
            where: {
              parent_comment_id: null,
            },
            include: {
              users_prototype_photo_comments_author_idTousers: {
                select: {
                  email: true,
                },
              },
              users_prototype_photo_comments_resolved_byTousers: {
                select: {
                  email: true,
                },
              },
              other_prototype_photo_comments: {
                include: {
                  users_prototype_photo_comments_author_idTousers: {
                    select: {
                      email: true,
                    },
                  },
                },
                orderBy: {
                  created_at: 'asc',
                },
              },
            },
            orderBy: {
              created_at: 'desc',
            },
          },
        },
      });

      if (!photo) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Photo not found',
        });
      }

      return photo;
    }),

  /**
   * Upload photo (create photo record)
   */
  uploadPhoto: publicProcedure
    .input(
      z.object({
        prototypeId: z.string().uuid(),
        milestoneId: z.string().uuid().optional(),
        photoType: z.string().default('progress'),
        title: z.string().optional(),
        description: z.string().optional(),
        fileUrl: z.string(),
        thumbnailUrl: z.string().optional(),
        fileName: z.string(),
        fileSize: z.number(),
        mimeType: z.string(),
        width: z.number().optional(),
        height: z.number().optional(),
        location: z.string().optional(),
        showsDefect: z.boolean().default(false),
        requiresAction: z.boolean().default(false),
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

      const photo = await ctx.db.prototype_photos.create({
        data: {
          prototype_id: input.prototypeId,
          milestone_id: input.milestoneId,
          photo_type: input.photoType,
          title: input.title,
          description: input.description,
          file_url: input.fileUrl,
          thumbnail_url: input.thumbnailUrl,
          file_name: input.fileName,
          file_size: BigInt(input.fileSize),
          mime_type: input.mimeType,
          width: input.width,
          height: input.height,
          location: input.location,
          shows_defect: input.showsDefect,
          requires_action: input.requiresAction,
          uploaded_by: userId,
        },
      });

      return {
        success: true,
        photo,
        message: 'Photo uploaded successfully',
      };
    }),

  /**
   * Update photo metadata
   */
  updatePhoto: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().optional(),
        description: z.string().optional(),
        photoType: z.string().optional(),
        location: z.string().optional(),
        isFeatured: z.boolean().optional(),
        showsDefect: z.boolean().optional(),
        requiresAction: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const photo = await ctx.db.prototype_photos.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          photo_type: data.photoType,
          location: data.location,
          is_featured: data.isFeatured,
          shows_defect: data.showsDefect,
          requires_action: data.requiresAction,
        },
      });

      return {
        success: true,
        photo,
        message: 'Photo updated successfully',
      };
    }),

  /**
   * Delete photo
   */
  deletePhoto: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.prototype_photos.delete({
        where: { id: input.id },
      });

      return {
        success: true,
        message: 'Photo deleted successfully',
      };
    }),

  /**
   * Add photo annotation
   */
  addPhotoAnnotation: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        annotation: z.object({
          x: z.number(),
          y: z.number(),
          text: z.string(),
          type: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const photo = await ctx.db.prototype_photos.findUnique({
        where: { id: input.id },
      });

      if (!photo) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Photo not found',
        });
      }

      const currentAnnotations = (photo.annotations as any[]) || [];
      const updatedAnnotations = [...currentAnnotations, input.annotation];

      const updatedPhoto = await ctx.db.prototype_photos.update({
        where: { id: input.id },
        data: {
          annotations: updatedAnnotations,
        },
      });

      return {
        success: true,
        photo: updatedPhoto,
        message: 'Annotation added successfully',
      };
    }),

  /**
   * Set photo as featured
   */
  setFeaturedPhoto: publicProcedure
    .input(
      z.object({
        prototypeId: z.string().uuid(),
        photoId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Remove featured flag from all photos of this prototype
      // Note: updateMany not supported by wrapper, using findMany + Promise.all with individual updates
      const featuredPhotos = await ctx.db.prototype_photos.findMany({
        where: {
          prototype_id: input.prototypeId,
          is_featured: true,
        },
        select: {
          id: true,
        },
      });

      if (featuredPhotos.length > 0) {
        await Promise.all(
          featuredPhotos.map(photo =>
            ctx.db.prototype_photos.update({
              where: { id: photo.id },
              data: { is_featured: false },
            })
          )
        );
      }

      // Set the specified photo as featured
      const photo = await ctx.db.prototype_photos.update({
        where: { id: input.photoId },
        data: {
          is_featured: true,
        },
      });

      return {
        success: true,
        photo,
        message: 'Featured photo set successfully',
      };
    }),

  // ============================================================================
  // PROTOTYPE PHOTO COMMENTS - 4 endpoints
  // ============================================================================

  /**
   * Get comments for a photo (with threaded replies)
   */
  getPhotoComments: publicProcedure
    .input(
      z.object({
        photoId: z.string().uuid(),
        status: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        photo_id: input.photoId,
        parent_comment_id: null, // Only get top-level comments
      };

      if (input.status) {
        where.status = input.status;
      }

      const comments = await ctx.db.prototype_photo_comments.findMany({
        where,
        include: {
          users_prototype_photo_comments_author_idTousers: {
            select: {
              email: true,
            },
          },
          users_prototype_photo_comments_resolved_byTousers: {
            select: {
              email: true,
            },
          },
          other_prototype_photo_comments: {
            include: {
              users_prototype_photo_comments_author_idTousers: {
                select: {
                  email: true,
                },
              },
            },
            orderBy: {
              created_at: 'asc',
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      return comments;
    }),

  /**
   * Add comment to photo
   */
  addPhotoComment: publicProcedure
    .input(
      z.object({
        photoId: z.string().uuid(),
        commentText: z.string(),
        commentType: z.string().default('general'),
        positionX: z.number().optional(),
        positionY: z.number().optional(),
        parentCommentId: z.string().uuid().optional(),
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

      const comment = await ctx.db.prototype_photo_comments.create({
        data: {
          photo_id: input.photoId,
          comment_text: input.commentText,
          comment_type: input.commentType,
          position_x: input.positionX,
          position_y: input.positionY,
          parent_comment_id: input.parentCommentId,
          author_id: userId,
          status: 'open',
        },
        include: {
          users_prototype_photo_comments_author_idTousers: {
            select: {
              email: true,
            },
          },
        },
      });

      return {
        success: true,
        comment,
        message: 'Comment added successfully',
      };
    }),

  /**
   * Resolve photo comment
   */
  resolvePhotoComment: publicProcedure
    .input(z.object({ commentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User must be logged in',
        });
      }

      const userId = ctx.session.user.id;

      const comment = await ctx.db.prototype_photo_comments.update({
        where: { id: input.commentId },
        data: {
          status: 'resolved',
          resolved_by: userId,
          resolved_at: new Date(),
        },
      });

      return {
        success: true,
        comment,
        message: 'Comment resolved successfully',
      };
    }),

  /**
   * Delete photo comment
   */
  deletePhotoComment: publicProcedure
    .input(z.object({ commentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.prototype_photo_comments.delete({
        where: { id: input.commentId },
      });

      return {
        success: true,
        message: 'Comment deleted successfully',
      };
    }),

  // ============================================================================
  // PROTOTYPE DOCUMENTS - 6 endpoints
  // ============================================================================

  /**
   * Get documents for prototype
   */
  getDocuments: publicProcedure
    .input(
      z.object({
        prototypeId: z.string().uuid(),
        milestoneId: z.string().uuid().optional(),
        documentType: z.string().optional(),
        status: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        prototype_id: input.prototypeId,
      };

      if (input.milestoneId) {
        where.milestone_id = input.milestoneId;
      }

      if (input.documentType) {
        where.document_type = input.documentType;
      }

      if (input.status) {
        where.status = input.status;
      }

      const documents = await ctx.db.prototype_documents.findMany({
        where,
        include: {
          prototype_milestones: {
            select: {
              milestone_name: true,
            },
          },
          users_prototype_documents_uploaded_byTousers: {
            select: {
              email: true,
            },
          },
          users_prototype_documents_approved_byTousers: {
            select: {
              email: true,
            },
          },
        },
        orderBy: {
          uploaded_at: 'desc',
        },
      });

      return documents;
    }),

  /**
   * Get single document
   */
  getDocumentById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const document = await ctx.db.prototype_documents.findUnique({
        where: { id: input.id },
        include: {
          prototype_milestones: {
            select: {
              milestone_name: true,
              sequence_order: true,
            },
          },
          users_prototype_documents_uploaded_byTousers: {
            select: {
              email: true,
            },
          },
          users_prototype_documents_approved_byTousers: {
            select: {
              email: true,
            },
          },
        },
      });

      if (!document) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Document not found',
        });
      }

      return document;
    }),

  /**
   * Upload document (create document record)
   */
  uploadDocument: publicProcedure
    .input(
      z.object({
        prototypeId: z.string().uuid(),
        milestoneId: z.string().uuid().optional(),
        documentType: z.string(),
        title: z.string(),
        description: z.string().optional(),
        version: z.string().optional(),
        fileUrl: z.string(),
        fileName: z.string(),
        fileSize: z.number(),
        mimeType: z.string(),
        requiresApproval: z.boolean().default(false),
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

      const document = await ctx.db.prototype_documents.create({
        data: {
          prototype_id: input.prototypeId,
          milestone_id: input.milestoneId,
          document_type: input.documentType,
          title: input.title,
          description: input.description,
          version: input.version,
          file_url: input.fileUrl,
          file_name: input.fileName,
          file_size: BigInt(input.fileSize),
          mime_type: input.mimeType,
          status: 'draft',
          requires_approval: input.requiresApproval,
          uploaded_by: userId,
        },
      });

      return {
        success: true,
        document,
        message: 'Document uploaded successfully',
      };
    }),

  /**
   * Update document metadata
   */
  updateDocument: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().optional(),
        description: z.string().optional(),
        version: z.string().optional(),
        status: z.string().optional(),
        requiresApproval: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const document = await ctx.db.prototype_documents.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          version: data.version,
          status: data.status,
          requires_approval: data.requiresApproval,
        },
      });

      return {
        success: true,
        document,
        message: 'Document updated successfully',
      };
    }),

  /**
   * Delete document
   */
  deleteDocument: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.prototype_documents.delete({
        where: { id: input.id },
      });

      return {
        success: true,
        message: 'Document deleted successfully',
      };
    }),

  /**
   * Approve document
   */
  approveDocument: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User must be logged in',
        });
      }

      const userId = ctx.session.user.id;

      const document = await ctx.db.prototype_documents.update({
        where: { id: input.id },
        data: {
          status: 'approved',
          approved_by: userId,
          approved_at: new Date(),
        },
      });

      return {
        success: true,
        document,
        message: 'Document approved successfully',
      };
    }),

  // ============================================================================
  // PROTOTYPE REVIEWS - 6 endpoints
  // ============================================================================

  /**
   * Get reviews for prototype
   */
  getReviews: publicProcedure
    .input(
      z.object({
        prototypeId: z.string().uuid(),
        reviewType: z.string().optional(),
        status: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        prototype_id: input.prototypeId,
      };

      if (input.reviewType) {
        where.review_type = input.reviewType;
      }

      if (input.status) {
        where.status = input.status;
      }

      const reviews = await ctx.db.prototype_reviews.findMany({
        where,
        include: {
          users: {
            select: {
              email: true,
            },
          },
          prototype_review_participants: {
            include: {
              users: {
                select: {
                  email: true,
                },
              },
            },
          },
          prototype_review_actions: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
            },
          },
        },
        orderBy: {
          review_date: 'desc',
        },
      });

      return reviews;
    }),

  /**
   * Get review with participants and action items
   */
  getReviewById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const review = await ctx.db.prototype_reviews.findUnique({
        where: { id: input.id },
        include: {
          users: {
            select: {
              email: true,
            },
          },
          prototype_review_participants: {
            include: {
              users: {
                select: {
                  email: true,
                },
              },
            },
          },
          prototype_review_actions: {
            include: {
              users_prototype_review_actions_assigned_toTousers: {
                select: {
                  email: true,
                },
              },
              users_prototype_review_actions_verified_byTousers: {
                select: {
                  email: true,
                },
              },
            },
            orderBy: {
              created_at: 'asc',
            },
          },
        },
      });

      if (!review) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Review not found',
        });
      }

      return review;
    }),

  /**
   * Create review session
   */
  createReview: publicProcedure
    .input(
      z.object({
        prototypeId: z.string().uuid(),
        reviewType: z.string(),
        reviewDate: z.date(),
        location: z.string().optional(),
        meetingNotes: z.string().optional(),
        photoReferences: z.array(z.string()).optional(),
        documentReferences: z.array(z.string()).optional(),
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

      const review = await ctx.db.prototype_reviews.create({
        data: {
          prototype_id: input.prototypeId,
          review_type: input.reviewType,
          review_date: input.reviewDate,
          location: input.location,
          status: 'scheduled',
          meeting_notes: input.meetingNotes,
          photo_references: input.photoReferences || [],
          document_references: input.documentReferences || [],
          created_by: userId,
        },
      });

      return {
        success: true,
        review,
        message: 'Review session created successfully',
      };
    }),

  /**
   * Update review details
   */
  updateReview: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.string().optional(),
        decision: z.string().optional(),
        summary: z.string().optional(),
        findings: z.any().optional(),
        meetingNotes: z.string().optional(),
        photoReferences: z.array(z.string()).optional(),
        documentReferences: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const review = await ctx.db.prototype_reviews.update({
        where: { id },
        data: {
          status: data.status,
          decision: data.decision,
          summary: data.summary,
          findings: data.findings,
          meeting_notes: data.meetingNotes,
          photo_references: data.photoReferences,
          document_references: data.documentReferences,
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        review,
        message: 'Review updated successfully',
      };
    }),

  /**
   * Add review participant
   */
  addReviewParticipant: publicProcedure
    .input(
      z.object({
        reviewId: z.string().uuid(),
        userId: z.string().uuid().optional(),
        externalName: z.string().optional(),
        externalEmail: z.string().optional(),
        externalCompany: z.string().optional(),
        role: z.string(),
        attended: z.boolean().default(true),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const participant = await ctx.db.prototype_review_participants.create({
        data: {
          review_id: input.reviewId,
          user_id: input.userId,
          external_name: input.externalName,
          external_email: input.externalEmail,
          external_company: input.externalCompany,
          role: input.role,
          attended: input.attended,
          notes: input.notes,
        },
      });

      return {
        success: true,
        participant,
        message: 'Participant added successfully',
      };
    }),

  /**
   * Remove review participant
   */
  removeReviewParticipant: publicProcedure
    .input(z.object({ participantId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.prototype_review_participants.delete({
        where: { id: input.participantId },
      });

      return {
        success: true,
        message: 'Participant removed successfully',
      };
    }),

  // ============================================================================
  // PROTOTYPE REVIEW ACTIONS - 5 endpoints
  // ============================================================================

  /**
   * Get action items for a review
   */
  getReviewActions: publicProcedure
    .input(
      z.object({
        reviewId: z.string().uuid(),
        status: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        review_id: input.reviewId,
      };

      if (input.status) {
        where.status = input.status;
      }

      const actions = await ctx.db.prototype_review_actions.findMany({
        where,
        include: {
          users_prototype_review_actions_assigned_toTousers: {
            select: {
              email: true,
            },
          },
          users_prototype_review_actions_verified_byTousers: {
            select: {
              email: true,
            },
          },
        },
        orderBy: {
          created_at: 'asc',
        },
      });

      return actions;
    }),

  /**
   * Create review action item
   */
  createReviewAction: publicProcedure
    .input(
      z.object({
        reviewId: z.string().uuid(),
        actionType: z.string().default('task'),
        title: z.string(),
        description: z.string(),
        priority: z.string().default('medium'),
        assignedTo: z.string().uuid().optional(),
        dueDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const action = await ctx.db.prototype_review_actions.create({
        data: {
          review_id: input.reviewId,
          action_type: input.actionType,
          title: input.title,
          description: input.description,
          priority: input.priority,
          assigned_to: input.assignedTo,
          status: 'open',
          due_date: input.dueDate,
        },
      });

      return {
        success: true,
        action,
        message: 'Action item created successfully',
      };
    }),

  /**
   * Update review action details
   */
  updateReviewAction: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        actionType: z.string().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        priority: z.string().optional(),
        dueDate: z.date().optional(),
        resolutionNotes: z.string().optional(),
        verifiedBy: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const action = await ctx.db.prototype_review_actions.update({
        where: { id },
        data: {
          action_type: data.actionType,
          title: data.title,
          description: data.description,
          priority: data.priority,
          due_date: data.dueDate,
          resolution_notes: data.resolutionNotes,
          verified_by: data.verifiedBy,
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        action,
        message: 'Action item updated successfully',
      };
    }),

  /**
   * Update action status
   */
  updateActionStatus: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(['open', 'in_progress', 'blocked', 'completed', 'cancelled']),
        resolutionNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: any = {
        status: input.status,
        updated_at: new Date(),
      };

      if (input.status === 'completed') {
        updateData.completed_at = new Date();
        updateData.resolution_notes = input.resolutionNotes;
      }

      const action = await ctx.db.prototype_review_actions.update({
        where: { id: input.id },
        data: updateData,
      });

      return {
        success: true,
        action,
        message: `Action status updated to ${input.status}`,
      };
    }),

  /**
   * Assign action to user
   */
  assignAction: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        assignedTo: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const action = await ctx.db.prototype_review_actions.update({
        where: { id: input.id },
        data: {
          assigned_to: input.assignedTo,
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        action,
        message: 'Action assigned successfully',
      };
    }),

  // ============================================================================
  // PROTOTYPE FEEDBACK - 5 endpoints
  // ============================================================================

  /**
   * Get feedback for prototype
   */
  getFeedback: publicProcedure
    .input(
      z.object({
        prototypeId: z.string().uuid(),
        feedbackType: z.string().optional(),
        status: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        prototype_id: input.prototypeId,
      };

      if (input.feedbackType) {
        where.feedback_type = input.feedbackType;
      }

      if (input.status) {
        where.status = input.status;
      }

      const feedback = await ctx.db.prototype_feedback.findMany({
        where,
        include: {
          users_prototype_feedback_submitted_byTousers: {
            select: {
              email: true,
            },
          },
          users_prototype_feedback_addressed_byTousers: {
            select: {
              email: true,
            },
          },
        },
        orderBy: {
          submitted_at: 'desc',
        },
      });

      return feedback;
    }),

  /**
   * Submit new feedback
   */
  submitFeedback: publicProcedure
    .input(
      z.object({
        prototypeId: z.string().uuid(),
        feedbackType: z.string().default('general'),
        feedbackSource: z.string(),
        title: z.string().optional(),
        feedbackText: z.string(),
        sentiment: z.string().default('neutral'),
        priority: z.string().default('medium'),
        requiresAction: z.boolean().default(false),
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

      const feedback = await ctx.db.prototype_feedback.create({
        data: {
          prototype_id: input.prototypeId,
          feedback_type: input.feedbackType,
          feedback_source: input.feedbackSource,
          title: input.title,
          feedback_text: input.feedbackText,
          sentiment: input.sentiment,
          priority: input.priority,
          requires_action: input.requiresAction,
          status: 'new',
          submitted_by: userId,
        },
      });

      return {
        success: true,
        feedback,
        message: 'Feedback submitted successfully',
      };
    }),

  /**
   * Update feedback details
   */
  updateFeedback: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().optional(),
        feedbackText: z.string().optional(),
        sentiment: z.string().optional(),
        priority: z.string().optional(),
        requiresAction: z.boolean().optional(),
        actionTaken: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const feedback = await ctx.db.prototype_feedback.update({
        where: { id },
        data: {
          title: data.title,
          feedback_text: data.feedbackText,
          sentiment: data.sentiment,
          priority: data.priority,
          requires_action: data.requiresAction,
          action_taken: data.actionTaken,
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        feedback,
        message: 'Feedback updated successfully',
      };
    }),

  /**
   * Mark feedback as addressed
   */
  addressFeedback: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        actionTaken: z.string(),
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

      const feedback = await ctx.db.prototype_feedback.update({
        where: { id: input.id },
        data: {
          status: 'addressed',
          action_taken: input.actionTaken,
          addressed_by: userId,
          addressed_at: new Date(),
        },
      });

      return {
        success: true,
        feedback,
        message: 'Feedback marked as addressed',
      };
    }),

  /**
   * Close feedback item
   */
  closeFeedback: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const feedback = await ctx.db.prototype_feedback.update({
        where: { id: input.id },
        data: {
          status: 'closed',
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        feedback,
        message: 'Feedback closed successfully',
      };
    }),

  // ============================================================================
  // PROTOTYPE REVISIONS - 4 endpoints
  // ============================================================================

  /**
   * Get revision history for prototype
   */
  getRevisions: publicProcedure
    .input(z.object({ prototypeId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const revisions = await ctx.db.prototype_revisions.findMany({
        where: { prototype_id: input.prototypeId },
        include: {
          users_prototype_revisions_created_byTousers: {
            select: {
              email: true,
            },
          },
          users_prototype_revisions_approved_byTousers: {
            select: {
              email: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      return revisions;
    }),

  /**
   * Create new revision record
   */
  createRevision: publicProcedure
    .input(
      z.object({
        prototypeId: z.string().uuid(),
        revisionNumber: z.string(),
        revisionType: z.string(),
        title: z.string(),
        description: z.string(),
        changesSummary: z.any().optional(),
        reasonForChange: z.string(),
        beforePhotos: z.array(z.string()).optional(),
        afterPhotos: z.array(z.string()).optional(),
        documents: z.array(z.string()).optional(),
        costImpact: z.number().optional(),
        timelineImpactDays: z.number().optional(),
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

      const revision = await ctx.db.prototype_revisions.create({
        data: {
          prototype_id: input.prototypeId,
          revision_number: input.revisionNumber,
          revision_type: input.revisionType,
          title: input.title,
          description: input.description,
          changes_summary: input.changesSummary,
          reason_for_change: input.reasonForChange,
          before_photos: input.beforePhotos || [],
          after_photos: input.afterPhotos || [],
          documents: input.documents || [],
          cost_impact: input.costImpact,
          timeline_impact_days: input.timelineImpactDays,
          created_by: userId,
        },
      });

      return {
        success: true,
        revision,
        message: `Revision ${input.revisionNumber} created successfully`,
      };
    }),

  /**
   * Approve revision
   */
  approveRevision: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User must be logged in',
        });
      }

      const userId = ctx.session.user.id;

      const revision = await ctx.db.prototype_revisions.update({
        where: { id: input.id },
        data: {
          approved_by: userId,
          approved_at: new Date(),
        },
      });

      return {
        success: true,
        revision,
        message: 'Revision approved successfully',
      };
    }),

  /**
   * Get single revision details
   */
  getRevisionById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const revision = await ctx.db.prototype_revisions.findUnique({
        where: { id: input.id },
        include: {
          users_prototype_revisions_created_byTousers: {
            select: {
              email: true,
            },
          },
          users_prototype_revisions_approved_byTousers: {
            select: {
              email: true,
            },
          },
          prototypes: {
            select: {
              prototype_number: true,
              name: true,
            },
          },
        },
      });

      if (!revision) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Revision not found',
        });
      }

      return revision;
    }),
});

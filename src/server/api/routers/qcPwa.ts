/**
 * QC PWA Router - Mobile-optimized Quality Control endpoints
 * Part of QC & Factory Review PWA Enhancement
 *
 * Provides endpoints for:
 * - Template management and conditional sections
 * - Guided 9-section checklist workflow
 * - Checkpoint result tracking
 * - Historical issue hints
 * - Rework inspections
 * - Supervisor dashboard
 */

import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';
import { Prisma } from '@prisma/client';

export const qcPwaRouter = createTRPCRouter({
  // ==========================================================================
  // TEMPLATE MANAGEMENT
  // ==========================================================================

  /**
   * Get all QC templates
   */
  getTemplates: publicProcedure
    .input(z.object({
      template_type: z.enum(['qc', 'factory_review']).optional(),
      is_active: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (input.template_type) where.template_type = input.template_type;
      if (input.is_active !== undefined) where.is_active = input.is_active;

      return await ctx.db.qc_capture_templates.findMany({
        where,
        include: {
          _count: {
            select: {
              qc_template_sections: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });
    }),

  /**
   * Get default template by type
   */
  getDefaultTemplate: publicProcedure
    .input(z.object({
      template_type: z.enum(['qc', 'factory_review']),
    }))
    .query(async ({ ctx, input }) => {
      const template = await ctx.db.qc_capture_templates.findFirst({
        where: {
          template_type: input.template_type,
          is_default: true,
          is_active: true,
        },
        include: {
          qc_template_sections: {
            include: {
              qc_template_checkpoints: {
                orderBy: { display_order: 'asc' },
              },
            },
            orderBy: { section_number: 'asc' },
          },
        },
      });

      if (!template) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `No default template found for type: ${input.template_type}`,
        });
      }

      return template;
    }),

  /**
   * Get template with conditional sections filtered by item metadata
   */
  getTemplateWithConditionals: publicProcedure
    .input(z.object({
      template_id: z.string().uuid(),
      item_metadata: z.record(z.any()).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const template = await ctx.db.qc_capture_templates.findUnique({
        where: { id: input.template_id },
        include: {
          qc_template_sections: {
            include: {
              qc_template_checkpoints: {
                orderBy: { display_order: 'asc' },
              },
            },
            orderBy: { section_number: 'asc' },
          },
        },
      });

      if (!template) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Template not found',
        });
      }

      // Filter sections based on conditional logic
      if (input.item_metadata) {
        template.qc_template_sections = template.qc_template_sections.filter((section) => {
          if (!section.conditional_logic) return true;

          // Evaluate conditional logic
          const logic = section.conditional_logic as any;
          if (logic.show_if) {
            return Object.entries(logic.show_if).every(([key, value]) => {
              // eslint-disable-next-line security/detect-object-injection
              return input.item_metadata?.[key] === value;
            });
          }

          return true;
        });

        // Filter checkpoints within sections
        template.qc_template_sections = template.qc_template_sections.map((section) => ({
          ...section,
          qc_template_checkpoints: section.qc_template_checkpoints.filter((checkpoint) => {
            if (!checkpoint.conditional_logic) return true;

            const logic = checkpoint.conditional_logic as any;
            if (logic.show_if) {
              return Object.entries(logic.show_if).every(([key, value]) => {
                // eslint-disable-next-line security/detect-object-injection
                return input.item_metadata?.[key] === value;
              });
            }

            return true;
          }),
        }));
      }

      return template;
    }),

  // ==========================================================================
  // READY ITEMS
  // ==========================================================================

  /**
   * Get items ready for QC inspection
   */
  getReadyForQcItems: publicProcedure
    .input(z.object({
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const [items, total] = await Promise.all([
        ctx.db.production_items.findMany({
          where: {
            qc_status: 'ready_for_qc',
          },
          include: {
            items: {
              select: {
                item_name: true,
                item_metadata: true,
              },
            },
            manufacturers: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            qc_ready_at: 'asc', // Oldest first (FIFO)
          },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.production_items.count({
          where: { qc_status: 'ready_for_qc' },
        }),
      ]);

      return {
        items,
        total,
        hasMore: input.offset + input.limit < total,
        nextOffset: input.offset + input.limit < total ? input.offset + input.limit : null,
      };
    }),

  /**
   * Get prototypes ready for factory review
   */
  getReadyForReviewPrototypes: publicProcedure
    .input(z.object({
      limit: z.number().default(20),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const [prototypes, total] = await Promise.all([
        ctx.db.prototype_production.findMany({
          where: {
            review_status: 'ready_for_review',
          },
          include: {
            prototypes: {
              select: {
                name: true,
                prototype_number: true,
              },
            },
            manufacturers: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            review_ready_at: 'asc', // Oldest first (FIFO)
          },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.prototype_production.count({
          where: { review_status: 'ready_for_review' },
        }),
      ]);

      return {
        prototypes,
        total,
        hasMore: input.offset + input.limit < total,
        nextOffset: input.offset + input.limit < total ? input.offset + input.limit : null,
      };
    }),

  // ==========================================================================
  // INSPECTION MANAGEMENT
  // ==========================================================================

  /**
   * Start a new QC inspection
   */
  startInspection: publicProcedure
    .input(z.object({
      production_item_id: z.string().uuid().optional(),
      prototype_production_id: z.string().uuid().optional(),
      template_id: z.string().uuid(),
      station_id: z.string().optional(),
      idempotency_key: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if inspection already exists with this idempotency key
      const existing = await ctx.db.qc_inspections.findUnique({
        where: { idempotency_key: input.idempotency_key },
      });

      if (existing) {
        return existing; // Return existing instead of error (idempotency)
      }

      // Create inspection
      const inspection = await ctx.db.qc_inspections.create({
        data: {
          production_item_id: input.production_item_id,
          prototype_production_id: input.prototype_production_id,
          status: 'in_progress',
          inspection_date: new Date(),
          station_id: input.station_id,
          idempotency_key: input.idempotency_key,
        },
      });

      // Update item status
      if (input.production_item_id) {
        await ctx.db.production_items.update({
          where: { id: input.production_item_id },
          data: { qc_status: 'in_qc' },
        });
      } else if (input.prototype_production_id) {
        await ctx.db.prototype_production.update({
          where: { id: input.prototype_production_id },
          data: { review_status: 'in_review' },
        });
      }

      // Create section results for all sections in template
      const sections = await ctx.db.qc_template_sections.findMany({
        where: { template_id: input.template_id },
        orderBy: { section_number: 'asc' },
      });

      await ctx.db.qc_section_results.createMany({
        data: sections.map((section) => ({
          inspection_id: inspection.id,
          section_id: section.id,
          status: 'pending',
        })),
      });

      return inspection;
    }),

  /**
   * Get inspection with progress
   */
  getInspectionProgress: publicProcedure
    .input(z.object({
      inspection_id: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const inspection = await ctx.db.qc_inspections.findUnique({
        where: { id: input.inspection_id },
        include: {
          qc_section_results: {
            include: {
              qc_template_sections: {
                include: {
                  qc_template_checkpoints: {
                    include: {
                      qc_checkpoint_results: {
                        where: { inspection_id: input.inspection_id },
                      },
                    },
                    orderBy: { display_order: 'asc' },
                  },
                },
              },
            },
            orderBy: {
              qc_template_sections: {
                section_number: 'asc',
              },
            },
          },
          production_items: {
            include: {
              items: {
                select: {
                  item_name: true,
                  item_metadata: true,
                },
              },
            },
          },
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
        },
      });

      if (!inspection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Inspection not found',
        });
      }

      // Calculate progress
      const totalSections = inspection.qc_section_results.length;
      const completedSections = inspection.qc_section_results.filter(
        (sr) => sr.status === 'completed' || sr.status === 'passed' || sr.status === 'failed'
      ).length;

      return {
        ...inspection,
        progress: {
          total_sections: totalSections,
          completed_sections: completedSections,
          percent_complete: Math.round((completedSections / totalSections) * 100),
        },
      };
    }),

  // ==========================================================================
  // CHECKPOINT RESULTS
  // ==========================================================================

  /**
   * Submit checkpoint result (pass/issue/na)
   */
  submitCheckpointResult: publicProcedure
    .input(z.object({
      inspection_id: z.string().uuid(),
      checkpoint_id: z.string().uuid(),
      status: z.enum(['pass', 'fail', 'issue', 'na']),
      severity: z.enum(['minor', 'major', 'critical']).optional(),
      note: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.qc_checkpoint_results.upsert({
        where: {
          inspection_id_checkpoint_id: {
            inspection_id: input.inspection_id,
            checkpoint_id: input.checkpoint_id,
          },
        },
        create: {
          inspection_id: input.inspection_id,
          checkpoint_id: input.checkpoint_id,
          status: input.status,
          severity: input.severity,
          note: input.note,
        },
        update: {
          status: input.status,
          severity: input.severity,
          note: input.note,
          updated_at: new Date(),
        },
      });
    }),

  /**
   * Batch pass all checkpoints in a section
   */
  batchPassSection: publicProcedure
    .input(z.object({
      inspection_id: z.string().uuid(),
      section_id: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get all checkpoints in section
      const checkpoints = await ctx.db.qc_template_checkpoints.findMany({
        where: { section_id: input.section_id },
      });

      // Create/update results for all as 'pass'
      await Promise.all(
        checkpoints.map((checkpoint) =>
          ctx.db.qc_checkpoint_results.upsert({
            where: {
              inspection_id_checkpoint_id: {
                inspection_id: input.inspection_id,
                checkpoint_id: checkpoint.id,
              },
            },
            create: {
              inspection_id: input.inspection_id,
              checkpoint_id: checkpoint.id,
              status: 'pass',
            },
            update: {
              status: 'pass',
              updated_at: new Date(),
            },
          })
        )
      );

      // Update section result
      await ctx.db.qc_section_results.updateMany({
        where: {
          inspection_id: input.inspection_id,
          section_id: input.section_id,
        },
        data: {
          status: 'passed',
          completed_at: new Date(),
          updated_at: new Date(),
        },
      });

      return { success: true, checkpoints_passed: checkpoints.length };
    }),

  // ==========================================================================
  // HISTORICAL ISSUES
  // ==========================================================================

  /**
   * Get historical issues for a checkpoint from same factory/vendor
   */
  getHistoricalIssues: publicProcedure
    .input(z.object({
      checkpoint_code: z.string(),
      factory_id: z.string().uuid(),
      days_back: z.number().default(90),
      limit: z.number().default(5),
    }))
    .query(async ({ ctx, input }) => {
      const since = new Date();
      since.setDate(since.getDate() - input.days_back);

      // Find checkpoint results with issues from this factory
      const issues = await ctx.db.qc_checkpoint_results.findMany({
        where: {
          status: 'issue',
          qc_template_checkpoints: {
            checkpoint_code: input.checkpoint_code,
          },
          qc_inspections: {
            production_items: {
              vendor_id: input.factory_id,
            },
            created_at: {
              gte: since,
            },
          },
        },
        include: {
          qc_inspections: {
            select: {
              inspection_date: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        take: input.limit,
      });

      // Aggregate by issue note to find most common
      const issueGroups = new Map<string, number>();
      issues.forEach((issue) => {
        const note = issue.note || 'No note provided';
        issueGroups.set(note, (issueGroups.get(note) || 0) + 1);
      });

      const topIssues = Array.from(issueGroups.entries())
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 3)
        .map(([note, count]) => ({ note, count }));

      return {
        total_issues: issues.length,
        top_issues: topIssues,
        time_period_days: input.days_back,
      };
    }),

  // ==========================================================================
  // INSPECTION SUBMISSION
  // ==========================================================================

  /**
   * Validate if inspection can be passed
   */
  validateCanPass: publicProcedure
    .input(z.object({
      inspection_id: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const blockers: string[] = [];

      // Check for critical issues
      const criticalIssues = await ctx.db.qc_checkpoint_results.count({
        where: {
          inspection_id: input.inspection_id,
          status: 'issue',
          severity: 'critical',
        },
      });
      if (criticalIssues > 0) {
        blockers.push(`${criticalIssues} critical issue(s) still open`);
      }

      // Check for pending uploads
      const pendingUploads = await ctx.db.qc_photos.count({
        where: {
          inspection_id: input.inspection_id,
          upload_status: { in: ['pending', 'uploading'] },
        },
      });
      if (pendingUploads > 0) {
        blockers.push(`${pendingUploads} upload(s) still pending`);
      }

      // Check for incomplete sections
      const incompleteSections = await ctx.db.qc_section_results.count({
        where: {
          inspection_id: input.inspection_id,
          status: { in: ['pending', 'in_progress'] },
        },
      });
      if (incompleteSections > 0) {
        blockers.push(`${incompleteSections} section(s) incomplete`);
      }

      return {
        can_pass: blockers.length === 0,
        blockers,
      };
    }),

  /**
   * Submit inspection (pass or fail)
   */
  submitInspection: publicProcedure
    .input(z.object({
      inspection_id: z.string().uuid(),
      final_status: z.enum(['passed', 'failed']),
      summary_note: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Validate can submit
      if (input.final_status === 'passed') {
        const validation = await ctx.db.qc_checkpoint_results.findFirst({
          where: {
            inspection_id: input.inspection_id,
            status: 'issue',
            severity: 'critical',
          },
        });

        if (validation) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot pass inspection with critical issues open',
          });
        }
      }

      // Update inspection
      const inspection = await ctx.db.qc_inspections.update({
        where: { id: input.inspection_id },
        data: {
          status: input.final_status,
          completed_at: new Date(),
          inspector_notes: input.summary_note,
        },
        include: {
          production_items: true,
          prototype_production: true,
        },
      });

      // Update item status
      if (inspection.production_item_id) {
        await ctx.db.production_items.update({
          where: { id: inspection.production_item_id },
          data: {
            qc_status: input.final_status === 'passed' ? 'passed' : 'rework_required',
          },
        });
      } else if (inspection.prototype_production_id) {
        await ctx.db.prototype_production.update({
          where: { id: inspection.prototype_production_id },
          data: {
            review_status:
              input.final_status === 'passed' ? 'approved' : 'revision_required',
          },
        });
      }

      return inspection;
    }),

  // ==========================================================================
  // REWORK INSPECTIONS
  // ==========================================================================

  /**
   * Get previous failed inspection for rework mode
   */
  getReworkInspection: publicProcedure
    .input(z.object({
      production_item_id: z.string().uuid().optional(),
      prototype_production_id: z.string().uuid().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {
        status: 'failed',
      };
      if (input.production_item_id) {
        where.production_item_id = input.production_item_id;
      } else if (input.prototype_production_id) {
        where.prototype_production_id = input.prototype_production_id;
      }

      const previousInspection = await ctx.db.qc_inspections.findFirst({
        where,
        include: {
          qc_checkpoint_results: {
            where: {
              status: 'issue',
            },
            include: {
              qc_template_checkpoints: true,
            },
          },
          qc_section_results: {
            include: {
              qc_template_sections: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      return previousInspection;
    }),

  // ==========================================================================
  // SUPERVISOR DASHBOARD
  // ==========================================================================

  /**
   * Get active inspection sessions for supervisor monitoring
   */
  getSupervisorDashboard: publicProcedure
    .input(z.object({
      status_filter: z.enum(['in_progress', 'all']).default('in_progress'),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {};
      if (input.status_filter === 'in_progress') {
        where.status = 'in_progress';
      }

      const sessions = await ctx.db.qc_inspections.findMany({
        where,
        include: {
          production_items: {
            select: {
              id: true,
              items: {
                select: {
                  item_name: true,
                },
              },
            },
          },
          prototype_production: {
            select: {
              id: true,
              prototypes: {
                select: {
                  name: true,
                },
              },
            },
          },
          qc_section_results: {
            select: {
              status: true,
              qc_template_sections: {
                select: {
                  section_number: true,
                  section_name: true,
                },
              },
            },
            orderBy: {
              qc_template_sections: {
                section_number: 'asc',
              },
            },
          },
          _count: {
            select: {
              qc_checkpoint_results: true,
              qc_defects: true,
            },
          },
        },
        orderBy: { inspection_date: 'desc' },
        take: 50,
      });

      return sessions.map((session) => {
        const currentSection = session.qc_section_results.find(
          (sr) => sr.status === 'in_progress'
        );
        const completedSections = session.qc_section_results.filter(
          (sr) => sr.status === 'completed' || sr.status === 'passed'
        ).length;

        const elapsedMinutes = Math.round(
          (new Date().getTime() - new Date(session.inspection_date).getTime()) / 60000
        );

        return {
          ...session,
          current_section: currentSection?.qc_template_sections,
          progress_percent: Math.round(
            (completedSections / session.qc_section_results.length) * 100
          ),
          elapsed_minutes: elapsedMinutes,
        };
      });
    }),

  // ==========================================================================
  // ANALYTICS & REPORTING
  // ==========================================================================

  /**
   * Get checkpoint performance metrics
   */
  getCheckpointMetrics: publicProcedure
    .input(z.object({
      factory_id: z.string().uuid().optional(),
      days_back: z.number().default(30),
      limit: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - input.days_back);

      // Get checkpoint results with counts
      // Use prisma client directly for raw queries
      const { PrismaClient } = await import('@prisma/client');
      const _prisma = new PrismaClient();

      const results = await ctx.db.$queryRaw<Array<{
        checkpoint_code: string;
        checkpoint_text: string;
        pass_count: bigint;
        fail_count: bigint;
        na_count: bigint;
        total_count: bigint;
      }>>`
        SELECT
          tc.checkpoint_code,
          tc.checkpoint_text,
          COUNT(CASE WHEN cr.status = 'pass' THEN 1 END) as pass_count,
          COUNT(CASE WHEN cr.status = 'fail' THEN 1 END) as fail_count,
          COUNT(CASE WHEN cr.status = 'na' THEN 1 END) as na_count,
          COUNT(*) as total_count
        FROM qc_checkpoint_results cr
        INNER JOIN qc_template_checkpoints tc ON cr.checkpoint_id = tc.id
        INNER JOIN qc_inspections i ON cr.inspection_id = i.id
        WHERE i.inspection_date >= ${sinceDate}
          ${input.factory_id ? Prisma.sql`AND i.factory_id = ${input.factory_id}` : Prisma.empty}
          AND cr.status != 'pending'
        GROUP BY tc.checkpoint_code, tc.checkpoint_text
        ORDER BY total_count DESC
        LIMIT ${input.limit}
      `;

      return results.map(r => ({
        checkpoint_code: r.checkpoint_code,
        checkpoint_text: r.checkpoint_text,
        pass_count: Number(r.pass_count),
        fail_count: Number(r.fail_count),
        na_count: Number(r.na_count),
        total_count: Number(r.total_count),
        pass_rate: Number(r.total_count) > 0
          ? Math.round((Number(r.pass_count) / Number(r.total_count)) * 100)
          : 0,
        fail_rate: Number(r.total_count) > 0
          ? Math.round((Number(r.fail_count) / Number(r.total_count)) * 100)
          : 0,
      }));
    }),

  /**
   * Get factory performance metrics
   */
  getFactoryMetrics: publicProcedure
    .input(z.object({
      factory_id: z.string().uuid().optional(),
      days_back: z.number().default(30),
    }))
    .query(async ({ ctx, input }) => {
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - input.days_back);

      // Use prisma client directly for raw queries
      const { PrismaClient } = await import('@prisma/client');
      const _prisma = new PrismaClient();

      const metrics = await ctx.db.$queryRaw<Array<{
        factory_id: string;
        factory_name: string;
        total_inspections: bigint;
        passed_inspections: bigint;
        failed_inspections: bigint;
        avg_duration_minutes: number | null;
      }>>`
        SELECT
          f.id as factory_id,
          f.factory_name,
          COUNT(DISTINCT i.id) as total_inspections,
          COUNT(DISTINCT CASE WHEN i.status = 'passed' THEN i.id END) as passed_inspections,
          COUNT(DISTINCT CASE WHEN i.status = 'failed' THEN i.id END) as failed_inspections,
          AVG(EXTRACT(EPOCH FROM (i.completed_at - i.inspection_date)) / 60) as avg_duration_minutes
        FROM qc_inspections i
        LEFT JOIN factories f ON i.factory_id = f.id
        WHERE i.inspection_date >= ${sinceDate}
          AND i.status IN ('passed', 'failed')
          ${input.factory_id ? Prisma.sql`AND f.id = ${input.factory_id}` : Prisma.empty}
        GROUP BY f.id, f.factory_name
        ORDER BY total_inspections DESC
      `;

      return metrics.map(m => ({
        factory_id: m.factory_id,
        factory_name: m.factory_name || 'Unknown Factory',
        total_inspections: Number(m.total_inspections),
        passed_inspections: Number(m.passed_inspections),
        failed_inspections: Number(m.failed_inspections),
        pass_rate: Number(m.total_inspections) > 0
          ? Math.round((Number(m.passed_inspections) / Number(m.total_inspections)) * 100)
          : 0,
        avg_inspection_duration_minutes: m.avg_duration_minutes ? Math.round(m.avg_duration_minutes) : 0,
      }));
    }),

  /**
   * Get inspector performance metrics
   */
  getInspectorMetrics: publicProcedure
    .input(z.object({
      inspector_id: z.string().uuid().optional(),
      days_back: z.number().default(30),
    }))
    .query(async ({ ctx, input }) => {
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - input.days_back);

      // Use prisma client directly for raw queries
      const { PrismaClient } = await import('@prisma/client');
      const _prisma = new PrismaClient();

      const metrics = await ctx.db.$queryRaw<Array<{
        inspector_id: string;
        inspector_name: string;
        total_inspections: bigint;
        completed_inspections: bigint;
        avg_duration_minutes: number | null;
        total_photos: bigint;
        total_notes: bigint;
      }>>`
        SELECT
          u.id as inspector_id,
          u.name as inspector_name,
          COUNT(DISTINCT i.id) as total_inspections,
          COUNT(DISTINCT CASE WHEN i.status IN ('passed', 'failed') THEN i.id END) as completed_inspections,
          AVG(CASE
            WHEN i.completed_at IS NOT NULL
            THEN EXTRACT(EPOCH FROM (i.completed_at - i.inspection_date)) / 60
            ELSE NULL
          END) as avg_duration_minutes,
          COUNT(p.id) as total_photos,
          COUNT(CASE WHEN cr.notes IS NOT NULL AND cr.notes != '' THEN 1 END) as total_notes
        FROM qc_inspections i
        LEFT JOIN users u ON i.inspector_id = u.id
        LEFT JOIN qc_checkpoint_results cr ON i.id = cr.inspection_id
        LEFT JOIN qc_photos p ON cr.id = p.checkpoint_result_id
        WHERE i.inspection_date >= ${sinceDate}
          ${input.inspector_id ? Prisma.sql`AND u.id = ${input.inspector_id}` : Prisma.empty}
        GROUP BY u.id, u.name
        ORDER BY completed_inspections DESC
      `;

      return metrics.map(m => ({
        inspector_id: m.inspector_id,
        inspector_name: m.inspector_name || 'Unknown Inspector',
        total_inspections: Number(m.total_inspections),
        completed_inspections: Number(m.completed_inspections),
        completion_rate: Number(m.total_inspections) > 0
          ? Math.round((Number(m.completed_inspections) / Number(m.total_inspections)) * 100)
          : 0,
        avg_inspection_duration_minutes: m.avg_duration_minutes ? Math.round(m.avg_duration_minutes) : 0,
        photos_per_inspection: Number(m.completed_inspections) > 0
          ? Math.round(Number(m.total_photos) / Number(m.completed_inspections))
          : 0,
        notes_per_inspection: Number(m.completed_inspections) > 0
          ? Math.round(Number(m.total_notes) / Number(m.completed_inspections))
          : 0,
        thoroughness_score: Number(m.completed_inspections) > 0
          ? Math.min(100, Math.round(
              ((Number(m.total_photos) + Number(m.total_notes)) / Number(m.completed_inspections)) * 10
            ))
          : 0,
      }));
    }),
});

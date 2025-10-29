import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

/**
 * Concepts Router
 *
 * Manages concepts table using ctx.db pattern.
 * Covers product design concepts, prototyping workflow, and concept lifecycle.
 */

const conceptStatusEnum = z.enum([
  'concept',
  'in_review',
  'approved',
  'prototype',
  'production',
  'archived',
  'rejected',
]);

const conceptPriorityEnum = z.enum([
  'low',
  'medium',
  'high',
  'urgent',
]);

export const conceptsRouter = createTRPCRouter({
  /**
   * Get concept by ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const concept = await ctx.db.concepts.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          name: true,
          description: true,
          concept_number: true,
          designer_id: true,
          collection_id: true,
          created_by: true,
          status: true,
          priority: true,
          specifications: true,
          target_price: true,
          estimated_cost: true,
          tags: true,
          notes: true,
          internal_notes: true,
          created_at: true,
          updated_at: true,
          collections: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          designers: {
            select: {
              id: true,
              name: true,
              company_name: true,
              contact_email: true,
            },
          },
          users: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          documents: {
            select: {
              id: true,
              name: true,
              file_type: true,
              created_at: true,
            },
            orderBy: { created_at: 'desc' },
            take: 20,
          },
          prototypes: {
            select: {
              id: true,
              name: true,
              status: true,
              created_at: true,
            },
            orderBy: { created_at: 'desc' },
            take: 10,
          },
        },
      });

      if (!concept) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Concept not found',
        });
      }

      return concept;
    }),

  /**
   * Get all concepts (with pagination and filtering)
   */
  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
        search: z.string().optional(),
        status: conceptStatusEnum.optional(),
        priority: conceptPriorityEnum.optional(),
        designer_id: z.string().uuid().optional(),
        collection_id: z.string().uuid().optional(),
        created_by: z.string().uuid().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, search, status, priority, designer_id, collection_id, created_by, tags } = input;

      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (priority) {
        where.priority = priority;
      }

      if (designer_id) {
        where.designer_id = designer_id;
      }

      if (collection_id) {
        where.collection_id = collection_id;
      }

      if (created_by) {
        where.created_by = created_by;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { concept_number: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (tags && tags.length > 0) {
        where.tags = {
          hasSome: tags,
        };
      }

      const concepts = await ctx.db.concepts.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          concept_number: true,
          status: true,
          priority: true,
          target_price: true,
          estimated_cost: true,
          tags: true,
          created_at: true,
          updated_at: true,
          collections: {
            select: {
              id: true,
              name: true,
            },
          },
          designers: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              documents: true,
              prototypes: true,
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (concepts.length > limit) {
        const nextItem = concepts.pop();
        nextCursor = nextItem?.id;
      }

      return {
        concepts,
        nextCursor,
      };
    }),

  /**
   * Get concepts by status
   */
  getByStatus: publicProcedure
    .input(
      z.object({
        status: conceptStatusEnum,
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const concepts = await ctx.db.concepts.findMany({
        where: {
          status: input.status,
        },
        take: input.limit,
        orderBy: [{ priority: 'desc' }, { created_at: 'desc' }],
        select: {
          id: true,
          name: true,
          description: true,
          concept_number: true,
          status: true,
          priority: true,
          target_price: true,
          estimated_cost: true,
          created_at: true,
          designers: {
            select: {
              id: true,
              name: true,
            },
          },
          collections: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return concepts;
    }),

  /**
   * Get concepts by designer
   */
  getByDesigner: publicProcedure
    .input(
      z.object({
        designer_id: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
        status: conceptStatusEnum.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const concepts = await ctx.db.concepts.findMany({
        where: {
          designer_id: input.designer_id,
          ...(input.status && { status: input.status }),
        },
        take: input.limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          concept_number: true,
          status: true,
          priority: true,
          target_price: true,
          created_at: true,
        },
      });

      return concepts;
    }),

  /**
   * Get concepts by collection
   */
  getByCollection: publicProcedure
    .input(
      z.object({
        collection_id: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
        status: conceptStatusEnum.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const concepts = await ctx.db.concepts.findMany({
        where: {
          collection_id: input.collection_id,
          ...(input.status && { status: input.status }),
        },
        take: input.limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          concept_number: true,
          status: true,
          priority: true,
          target_price: true,
          created_at: true,
          designers: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return concepts;
    }),

  /**
   * Create concept
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        concept_number: z.string().max(50).optional(),
        designer_id: z.string().uuid().optional(),
        collection_id: z.string().uuid().optional(),
        status: conceptStatusEnum.default('concept'),
        priority: conceptPriorityEnum.default('medium'),
        specifications: z.record(z.any()).optional(),
        target_price: z.number().optional(),
        estimated_cost: z.number().optional(),
        tags: z.array(z.string()).default([]),
        notes: z.string().optional(),
        internal_notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if concept_number already exists (if provided)
      if (input.concept_number) {
        const existingConcept = await ctx.db.concepts.findUnique({
          where: {
            concept_number: input.concept_number,
          },
        });

        if (existingConcept) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Concept with this concept number already exists',
          });
        }
      }

      const newConcept = await ctx.db.concepts.create({
        data: {
          ...input,
          created_by: ctx.user!.id,
        },
        select: {
          id: true,
          name: true,
          concept_number: true,
          status: true,
          priority: true,
          created_at: true,
        },
      });

      return newConcept;
    }),

  /**
   * Update concept
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        concept_number: z.string().max(50).optional(),
        designer_id: z.string().uuid().optional(),
        collection_id: z.string().uuid().optional(),
        status: conceptStatusEnum.optional(),
        priority: conceptPriorityEnum.optional(),
        specifications: z.record(z.any()).optional(),
        target_price: z.number().optional(),
        estimated_cost: z.number().optional(),
        tags: z.array(z.string()).optional(),
        notes: z.string().optional(),
        internal_notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Verify concept exists
      const existingConcept = await ctx.db.concepts.findUnique({
        where: { id },
        select: { id: true, concept_number: true },
      });

      if (!existingConcept) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Concept not found',
        });
      }

      // If concept_number is being changed, verify it's not already taken
      if (data.concept_number && data.concept_number !== existingConcept.concept_number) {
        const numberTaken = await ctx.db.concepts.findUnique({
          where: {
            concept_number: data.concept_number,
          },
        });

        if (numberTaken) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Concept number already in use',
          });
        }
      }

      const updatedConcept = await ctx.db.concepts.update({
        where: { id },
        data: {
          ...data,
          updated_at: new Date(),
        },
        select: {
          id: true,
          name: true,
          concept_number: true,
          status: true,
          priority: true,
          updated_at: true,
        },
      });

      return updatedConcept;
    }),

  /**
   * Delete concept
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify concept exists and check for dependencies
      const existingConcept = await ctx.db.concepts.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          _count: {
            select: {
              documents: true,
              prototypes: true,
            },
          },
        },
      });

      if (!existingConcept) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Concept not found',
        });
      }

      // Check if concept has prototypes (should archive instead of delete)
      if (existingConcept._count.prototypes > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Cannot delete concept with prototypes. Archive instead.',
        });
      }

      await ctx.db.concepts.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Archive concept
   */
  archive: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const archivedConcept = await ctx.db.concepts.update({
        where: { id: input.id },
        data: {
          status: 'archived',
          updated_at: new Date(),
        },
        select: {
          id: true,
          name: true,
          status: true,
          updated_at: true,
        },
      });

      return archivedConcept;
    }),

  /**
   * Update concept status
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: conceptStatusEnum,
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updatedConcept = await ctx.db.concepts.update({
        where: { id: input.id },
        data: {
          status: input.status,
          ...(input.notes && { notes: input.notes }),
          updated_at: new Date(),
        },
        select: {
          id: true,
          name: true,
          concept_number: true,
          status: true,
          updated_at: true,
        },
      });

      return updatedConcept;
    }),

  /**
   * Get concept statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [total, byStatus, byPriority, avgCosts] = await Promise.all([
      ctx.db.concepts.count(),
      ctx.db.concepts.groupBy({
        by: ['status'],
        _count: true,
      }),
      ctx.db.concepts.groupBy({
        by: ['priority'],
        _count: true,
      }),
      ctx.db.concepts.aggregate({
        _avg: {
          target_price: true,
          estimated_cost: true,
        },
      }),
    ]);

    return {
      total,
      byStatus: byStatus.map(s => ({
        status: s.status,
        count: s._count,
      })),
      byPriority: byPriority.map(p => ({
        priority: p.priority,
        count: p._count,
      })),
      avgTargetPrice: avgCosts._avg.target_price || 0,
      avgEstimatedCost: avgCosts._avg.estimated_cost || 0,
    };
  }),

  /**
   * Search concepts
   */
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(50).default(10),
        status: conceptStatusEnum.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const concepts = await ctx.db.concepts.findMany({
        where: {
          OR: [
            { name: { contains: input.query, mode: 'insensitive' } },
            { description: { contains: input.query, mode: 'insensitive' } },
            { concept_number: { contains: input.query, mode: 'insensitive' } },
          ],
          ...(input.status && { status: input.status }),
        },
        take: input.limit,
        select: {
          id: true,
          name: true,
          description: true,
          concept_number: true,
          status: true,
          priority: true,
          designers: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return concepts;
    }),

  /**
   * Search concepts by tags
   */
  searchByTags: publicProcedure
    .input(
      z.object({
        tags: z.array(z.string()).min(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const concepts = await ctx.db.concepts.findMany({
        where: {
          tags: {
            hasSome: input.tags,
          },
        },
        take: input.limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          concept_number: true,
          status: true,
          priority: true,
          tags: true,
          created_at: true,
        },
      });

      return concepts;
    }),
});

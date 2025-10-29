import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

/**
 * Material Collections Router
 *
 * Manages material_collections junction table using ctx.db pattern.
 * Handles many-to-many relationships between materials and collections.
 */

export const materialCollectionsRouter = createTRPCRouter({
  /**
   * Add material to collection
   */
  add: protectedProcedure
    .input(
      z.object({
        material_id: z.string().uuid(),
        collection_id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if relationship already exists
      const existing = await ctx.db.material_collections.findFirst({
        where: {
          material_id: input.material_id,
          collection_id: input.collection_id,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Material already exists in this collection',
        });
      }

      // Verify material exists
      const material = await ctx.db.materials.findUnique({
        where: { id: input.material_id },
        select: { id: true, name: true },
      });

      if (!material) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Material not found',
        });
      }

      // Verify collection exists
      const collection = await ctx.db.collections.findUnique({
        where: { id: input.collection_id },
        select: { id: true, name: true },
      });

      if (!collection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Collection not found',
        });
      }

      const newRelation = await ctx.db.material_collections.create({
        data: {
          material_id: input.material_id,
          collection_id: input.collection_id,
          created_by: ctx.user?.id,
        },
        select: {
          id: true,
          material_id: true,
          collection_id: true,
          created_at: true,
        },
      });

      return newRelation;
    }),

  /**
   * Add multiple materials to a collection (bulk operation)
   */
  addBulk: protectedProcedure
    .input(
      z.object({
        material_ids: z.array(z.string().uuid()).min(1),
        collection_id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify collection exists
      const collection = await ctx.db.collections.findUnique({
        where: { id: input.collection_id },
        select: { id: true },
      });

      if (!collection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Collection not found',
        });
      }

      // Get existing relationships to avoid duplicates
      const existingRelations = await ctx.db.material_collections.findMany({
        where: {
          collection_id: input.collection_id,
          material_id: {
            in: input.material_ids,
          },
        },
        select: {
          material_id: true,
        },
      });

      const existingMaterialIds = new Set(existingRelations.map(r => r.material_id));
      const newMaterialIds = input.material_ids.filter(id => !existingMaterialIds.has(id));

      if (newMaterialIds.length === 0) {
        return {
          added: 0,
          skipped: input.material_ids.length,
          message: 'All materials already exist in collection',
        };
      }

      // Create new relationships
      const createData = newMaterialIds.map(material_id => ({
        material_id,
        collection_id: input.collection_id,
        created_by: ctx.user?.id,
      }));

      await ctx.db.material_collections.createMany({
        data: createData,
      });

      return {
        added: newMaterialIds.length,
        skipped: existingMaterialIds.size,
        message: `Added ${newMaterialIds.length} materials to collection`,
      };
    }),

  /**
   * Remove material from collection
   */
  remove: protectedProcedure
    .input(
      z.object({
        material_id: z.string().uuid(),
        collection_id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Find the relationship
      const relation = await ctx.db.material_collections.findFirst({
        where: {
          material_id: input.material_id,
          collection_id: input.collection_id,
        },
      });

      if (!relation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Material not found in this collection',
        });
      }

      await ctx.db.material_collections.delete({
        where: {
          id: relation.id,
        },
      });

      return { success: true };
    }),

  /**
   * Remove multiple materials from a collection (bulk operation)
   */
  removeBulk: protectedProcedure
    .input(
      z.object({
        material_ids: z.array(z.string().uuid()).min(1),
        collection_id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.material_collections.deleteMany({
        where: {
          collection_id: input.collection_id,
          material_id: {
            in: input.material_ids,
          },
        },
      });

      return {
        removed: result.count,
        message: `Removed ${result.count} materials from collection`,
      };
    }),

  /**
   * Get all collections for a material
   */
  getByMaterial: publicProcedure
    .input(
      z.object({
        material_id: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const relations = await ctx.db.material_collections.findMany({
        where: {
          material_id: input.material_id,
        },
        take: input.limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          collection_id: true,
          created_at: true,
          created_by: true,
          collections: {
            select: {
              id: true,
              name: true,
              code: true,
              description: true,
              status: true,
            },
          },
        },
      });

      return relations;
    }),

  /**
   * Get all materials in a collection
   */
  getByCollection: publicProcedure
    .input(
      z.object({
        collection_id: z.string().uuid(),
        limit: z.number().min(1).max(500).default(100),
        cursor: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, collection_id } = input;

      const relations = await ctx.db.material_collections.findMany({
        where: {
          collection_id,
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          material_id: true,
          created_at: true,
          created_by: true,
          materials: {
            select: {
              id: true,
              name: true,
              sku: true,
              description: true,
              category_id: true,
              supplier: true,
              unit_price: true,
              stock_quantity: true,
              material_categories: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      let nextCursor: string | undefined;
      if (relations.length > limit) {
        const nextItem = relations.pop();
        nextCursor = nextItem?.id;
      }

      return {
        materials: relations,
        nextCursor,
      };
    }),

  /**
   * Check if material exists in collection
   */
  exists: publicProcedure
    .input(
      z.object({
        material_id: z.string().uuid(),
        collection_id: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const relation = await ctx.db.material_collections.findFirst({
        where: {
          material_id: input.material_id,
          collection_id: input.collection_id,
        },
        select: {
          id: true,
          created_at: true,
        },
      });

      return {
        exists: !!relation,
        relation: relation || null,
      };
    }),

  /**
   * Get statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [totalRelations, collectionsWithMaterials, materialsInCollections] = await Promise.all([
      ctx.db.material_collections.count(),
      ctx.db.material_collections.groupBy({
        by: ['collection_id'],
        _count: true,
      }),
      ctx.db.material_collections.groupBy({
        by: ['material_id'],
        _count: true,
      }),
    ]);

    // Calculate averages
    const avgMaterialsPerCollection = collectionsWithMaterials.length > 0
      ? totalRelations / collectionsWithMaterials.length
      : 0;

    const avgCollectionsPerMaterial = materialsInCollections.length > 0
      ? totalRelations / materialsInCollections.length
      : 0;

    // Find top collections (most materials)
    const topCollections = collectionsWithMaterials
      .sort((a, b) => b._count - a._count)
      .slice(0, 10);

    const topCollectionIds = topCollections.map(c => c.collection_id);
    const topCollectionData = await ctx.db.collections.findMany({
      where: {
        id: {
          in: topCollectionIds,
        },
      },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });

    const topCollectionsMap = new Map(topCollectionData.map(c => [c.id, c]));

    return {
      totalRelations,
      uniqueCollections: collectionsWithMaterials.length,
      uniqueMaterials: materialsInCollections.length,
      avgMaterialsPerCollection: Math.round(avgMaterialsPerCollection * 10) / 10,
      avgCollectionsPerMaterial: Math.round(avgCollectionsPerMaterial * 10) / 10,
      topCollections: topCollections.map(tc => ({
        collection_id: tc.collection_id,
        material_count: tc._count,
        collection: topCollectionsMap.get(tc.collection_id) || null,
      })),
    };
  }),

  /**
   * Move material between collections
   */
  move: protectedProcedure
    .input(
      z.object({
        material_id: z.string().uuid(),
        from_collection_id: z.string().uuid(),
        to_collection_id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Remove from old collection
      const oldRelation = await ctx.db.material_collections.findFirst({
        where: {
          material_id: input.material_id,
          collection_id: input.from_collection_id,
        },
      });

      if (!oldRelation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Material not found in source collection',
        });
      }

      // Check if already in target collection
      const existsInTarget = await ctx.db.material_collections.findFirst({
        where: {
          material_id: input.material_id,
          collection_id: input.to_collection_id,
        },
      });

      if (existsInTarget) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Material already exists in target collection',
        });
      }

      // Remove from old, add to new
      await ctx.db.material_collections.delete({
        where: { id: oldRelation.id },
      });

      const newRelation = await ctx.db.material_collections.create({
        data: {
          material_id: input.material_id,
          collection_id: input.to_collection_id,
          created_by: ctx.user?.id,
        },
        select: {
          id: true,
          material_id: true,
          collection_id: true,
          created_at: true,
        },
      });

      return newRelation;
    }),

  /**
   * Copy material to another collection (duplicate)
   */
  copy: protectedProcedure
    .input(
      z.object({
        material_id: z.string().uuid(),
        from_collection_id: z.string().uuid(),
        to_collection_id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify exists in source
      const sourceRelation = await ctx.db.material_collections.findFirst({
        where: {
          material_id: input.material_id,
          collection_id: input.from_collection_id,
        },
      });

      if (!sourceRelation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Material not found in source collection',
        });
      }

      // Check if already in target
      const existsInTarget = await ctx.db.material_collections.findFirst({
        where: {
          material_id: input.material_id,
          collection_id: input.to_collection_id,
        },
      });

      if (existsInTarget) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Material already exists in target collection',
        });
      }

      // Create in target collection
      const newRelation = await ctx.db.material_collections.create({
        data: {
          material_id: input.material_id,
          collection_id: input.to_collection_id,
          created_by: ctx.user?.id,
        },
        select: {
          id: true,
          material_id: true,
          collection_id: true,
          created_at: true,
        },
      });

      return newRelation;
    }),
});

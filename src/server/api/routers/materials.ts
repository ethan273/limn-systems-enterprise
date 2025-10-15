import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc/init";
import { TRPCError } from "@trpc/server";

// ========================================
// HIERARCHICAL MATERIALS ROUTER
// For cascading material management: Fabrics, Wood, Metal, Stone, Weaving, Carving
// ========================================

// Helper to handle Prisma errors with user-friendly messages
const handlePrismaError = (error: any, itemType: string) => {
  if (error.code === 'P2002') {
    // Unique constraint violation
    throw new TRPCError({
      code: 'CONFLICT',
      message: `A ${itemType} with this name already exists. Please use a different name.`,
    });
  }
  if (error.code === 'P2025') {
    // Record not found
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `${itemType} not found.`,
    });
  }
  // Generic error
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: `Failed to process ${itemType}: ${error.message}`,
  });
};

export const materialTypesRouter = createTRPCRouter({
  // Fabric Brands
  getFabricBrands: publicProcedure.query(async ({ ctx }) => {
    return await (ctx.db as any).fabric_brands.findMany({
      orderBy: { name: "asc" },
      include: {
        fabric_collections: {
          include: {
            fabric_colors: true,
          },
        },
      },
    });
  }),

  createFabricBrand: publicProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        price_modifier: z.number().default(0),
        sort_order: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await (ctx.db as any).fabric_brands.create({
          data: {
            name: input.name,
            description: input.description,
            price_modifier: input.price_modifier,
            sort_order: input.sort_order,
            active: true,
          },
        });
      } catch (error) {
        handlePrismaError(error, 'fabric brand');
      }
    }),

  updateFabricBrand: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().optional(),
        price_modifier: z.number(),
        sort_order: z.number().optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...data } = input;
        return await (ctx.db as any).fabric_brands.update({
          where: { id },
          data,
        });
      } catch (error) {
        handlePrismaError(error, 'fabric brand');
      }
    }),

  deleteFabricBrand: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await (ctx.db as any).fabric_brands.delete({
          where: { id: input.id },
        });
      } catch (error) {
        handlePrismaError(error, 'fabric brand');
      }
    }),

  // Fabric Collections
  getFabricCollections: publicProcedure.query(async ({ ctx }) => {
    return await (ctx.db as any).fabric_collections.findMany({
      orderBy: { name: "asc" },
      include: {
        fabric_brands: {
          select: { id: true, name: true },
        },
        fabric_colors: true,
      },
    });
  }),

  createFabricCollection: publicProcedure
    .input(
      z.object({
        name: z.string(),
        brand_id: z.string(),
        description: z.string().optional(),
        price_modifier: z.number().default(0),
        sort_order: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await (ctx.db as any).fabric_collections.create({
          data: {
            name: input.name,
            brand_id: input.brand_id,
            description: input.description,
            price_modifier: input.price_modifier,
            sort_order: input.sort_order,
            active: true,
          },
        });
      } catch (error) {
        handlePrismaError(error, 'fabric collection');
      }
    }),

  updateFabricCollection: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        brand_id: z.string(),
        description: z.string().optional(),
        price_modifier: z.number(),
        sort_order: z.number().optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...data } = input;
        return await (ctx.db as any).fabric_collections.update({
          where: { id },
          data,
        });
      } catch (error) {
        handlePrismaError(error, 'fabric collection');
      }
    }),

  deleteFabricCollection: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await (ctx.db as any).fabric_collections.delete({
          where: { id: input.id },
        });
      } catch (error) {
        handlePrismaError(error, 'fabric collection');
      }
    }),

  // Fabric Colors
  getFabricColors: publicProcedure.query(async ({ ctx }) => {
    return await (ctx.db as any).fabric_colors.findMany({
      orderBy: { name: "asc" },
      include: {
        fabric_collections: {
          select: {
            id: true,
            name: true,
            fabric_brands: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
  }),

  createFabricColor: publicProcedure
    .input(
      z.object({
        name: z.string(),
        collection_id: z.string(),
        hex_code: z.string().optional(),
        swatch_url: z.string().optional().nullable(),
        description: z.string().optional(),
        price_modifier: z.number().default(0),
        sort_order: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await (ctx.db as any).fabric_colors.create({
          data: {
            name: input.name,
            collection_id: input.collection_id,
            hex_code: input.hex_code,
            swatch_url: input.swatch_url,
            description: input.description,
            price_modifier: input.price_modifier,
            sort_order: input.sort_order,
            active: true,
          },
        });
      } catch (error) {
        handlePrismaError(error, 'fabric color');
      }
    }),

  updateFabricColor: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        collection_id: z.string(),
        hex_code: z.string().optional(),
        swatch_url: z.string().optional().nullable(),
        description: z.string().optional(),
        price_modifier: z.number(),
        sort_order: z.number().optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, collection_id: _collection_id, ...data } = input;
        return await (ctx.db as any).fabric_colors.update({
          where: { id },
          data,
        });
      } catch (error) {
        handlePrismaError(error, 'fabric color');
      }
    }),

  deleteFabricColor: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await (ctx.db as any).fabric_colors.delete({
          where: { id: input.id },
        });
      } catch (error) {
        handlePrismaError(error, 'fabric color');
      }
    }),

  // ========================================
  // WOOD PROCEDURES
  // ========================================

  // Wood Types
  getWoodTypes: publicProcedure.query(async ({ ctx }) => {
    return await (ctx.db as any).wood_types.findMany({
      orderBy: { name: "asc" },
      include: {
        wood_finishes: true,
      },
    });
  }),

  createWoodType: publicProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        price_modifier: z.number().default(0),
        sort_order: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await (ctx.db as any).wood_types.create({
          data: {
            name: input.name,
            description: input.description,
            price_modifier: input.price_modifier,
            sort_order: input.sort_order,
            active: true,
          },
        });
      } catch (error) {
        handlePrismaError(error, 'wood type');
      }
    }),

  updateWoodType: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().optional(),
        price_modifier: z.number(),
        sort_order: z.number().optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...data } = input;
        return await (ctx.db as any).wood_types.update({
          where: { id },
          data,
        });
      } catch (error) {
        handlePrismaError(error, 'wood type');
      }
    }),

  deleteWoodType: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await (ctx.db as any).wood_types.delete({
          where: { id: input.id },
        });
      } catch (error) {
        handlePrismaError(error, 'wood type');
      }
    }),

  // Wood Finishes
  getWoodFinishes: publicProcedure.query(async ({ ctx }) => {
    return await (ctx.db as any).wood_finishes.findMany({
      orderBy: { name: "asc" },
      include: {
        wood_types: {
          select: { id: true, name: true },
        },
      },
    });
  }),

  createWoodFinish: publicProcedure
    .input(
      z.object({
        name: z.string(),
        wood_type_id: z.string(),
        description: z.string().optional(),
        price_modifier: z.number().default(0),
        sort_order: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await (ctx.db as any).wood_finishes.create({
          data: {
            name: input.name,
            wood_type_id: input.wood_type_id,
            description: input.description,
            price_modifier: input.price_modifier,
            sort_order: input.sort_order,
            active: true,
          },
        });
      } catch (error) {
        handlePrismaError(error, 'wood finish');
      }
    }),

  updateWoodFinish: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        wood_type_id: z.string(),
        description: z.string().optional(),
        price_modifier: z.number(),
        sort_order: z.number().optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...data } = input;
        return await (ctx.db as any).wood_finishes.update({
          where: { id },
          data,
        });
      } catch (error) {
        handlePrismaError(error, 'wood finish');
      }
    }),

  deleteWoodFinish: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await (ctx.db as any).wood_finishes.delete({
          where: { id: input.id },
        });
      } catch (error) {
        handlePrismaError(error, 'wood finish');
      }
    }),

  // ========================================
  // METAL PROCEDURES
  // ========================================

  // Metal Types
  getMetalTypes: publicProcedure.query(async ({ ctx }) => {
    return await (ctx.db as any).metal_types.findMany({
      orderBy: { name: "asc" },
      include: {
        metal_finishes: {
          include: {
            metal_colors: true,
          },
        },
      },
    });
  }),

  createMetalType: publicProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        price_modifier: z.number().default(0),
        sort_order: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await (ctx.db as any).metal_types.create({
          data: {
            name: input.name,
            description: input.description,
            price_modifier: input.price_modifier,
            sort_order: input.sort_order,
            active: true,
          },
        });
      } catch (error) {
        handlePrismaError(error, 'metal type');
      }
    }),

  updateMetalType: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().optional(),
        price_modifier: z.number(),
        sort_order: z.number().optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...data } = input;
        return await (ctx.db as any).metal_types.update({
          where: { id },
          data,
        });
      } catch (error) {
        handlePrismaError(error, 'metal type');
      }
    }),

  deleteMetalType: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await (ctx.db as any).metal_types.delete({
          where: { id: input.id },
        });
      } catch (error) {
        handlePrismaError(error, 'metal type');
      }
    }),

  // Metal Finishes
  getMetalFinishes: publicProcedure.query(async ({ ctx }) => {
    return await (ctx.db as any).metal_finishes.findMany({
      orderBy: { name: "asc" },
      include: {
        metal_types: {
          select: { id: true, name: true },
        },
        metal_colors: true,
      },
    });
  }),

  createMetalFinish: publicProcedure
    .input(
      z.object({
        name: z.string(),
        metal_type_id: z.string(),
        description: z.string().optional(),
        price_modifier: z.number().default(0),
        sort_order: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await (ctx.db as any).metal_finishes.create({
          data: {
            name: input.name,
            metal_type_id: input.metal_type_id,
            description: input.description,
            price_modifier: input.price_modifier,
            sort_order: input.sort_order,
            active: true,
          },
        });
      } catch (error) {
        handlePrismaError(error, 'metal finish');
      }
    }),

  updateMetalFinish: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        metal_type_id: z.string(),
        description: z.string().optional(),
        price_modifier: z.number(),
        sort_order: z.number().optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...data } = input;
        return await (ctx.db as any).metal_finishes.update({
          where: { id },
          data,
        });
      } catch (error) {
        handlePrismaError(error, 'metal finish');
      }
    }),

  deleteMetalFinish: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await (ctx.db as any).metal_finishes.delete({
          where: { id: input.id },
        });
      } catch (error) {
        handlePrismaError(error, 'metal finish');
      }
    }),

  // Metal Colors
  getMetalColors: publicProcedure.query(async ({ ctx }) => {
    return await (ctx.db as any).metal_colors.findMany({
      orderBy: { name: "asc" },
      include: {
        metal_finishes: {
          select: {
            id: true,
            name: true,
            metal_types: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
  }),

  createMetalColor: publicProcedure
    .input(
      z.object({
        name: z.string(),
        metal_finish_id: z.string(),
        hex_code: z.string().optional(),
        description: z.string().optional(),
        price_modifier: z.number().default(0),
        sort_order: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await (ctx.db as any).metal_colors.create({
          data: {
            name: input.name,
            metal_finish_id: input.metal_finish_id,
            hex_code: input.hex_code,
            description: input.description,
            price_modifier: input.price_modifier,
            sort_order: input.sort_order,
            active: true,
          },
        });
      } catch (error) {
        handlePrismaError(error, 'metal color');
      }
    }),

  updateMetalColor: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        metal_finish_id: z.string(),
        hex_code: z.string().optional(),
        description: z.string().optional(),
        price_modifier: z.number(),
        sort_order: z.number().optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...data } = input;
        return await (ctx.db as any).metal_colors.update({
          where: { id },
          data,
        });
      } catch (error) {
        handlePrismaError(error, 'metal color');
      }
    }),

  deleteMetalColor: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await (ctx.db as any).metal_colors.delete({
          where: { id: input.id },
        });
      } catch (error) {
        handlePrismaError(error, 'metal color');
      }
    }),

  // ========================================
  // STONE PROCEDURES
  // ========================================

  // Stone Types
  getStoneTypes: publicProcedure.query(async ({ ctx }) => {
    return await (ctx.db as any).stone_types.findMany({
      orderBy: { name: "asc" },
      include: {
        stone_finishes: true,
      },
    });
  }),

  createStoneType: publicProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        price_modifier: z.number().default(0),
        sort_order: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await (ctx.db as any).stone_types.create({
          data: {
            name: input.name,
            description: input.description,
            price_modifier: input.price_modifier,
            sort_order: input.sort_order,
            active: true,
          },
        });
      } catch (error) {
        handlePrismaError(error, 'stone type');
      }
    }),

  updateStoneType: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().optional(),
        price_modifier: z.number(),
        sort_order: z.number().optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...data } = input;
        return await (ctx.db as any).stone_types.update({
          where: { id },
          data,
        });
      } catch (error) {
        handlePrismaError(error, 'stone type');
      }
    }),

  deleteStoneType: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await (ctx.db as any).stone_types.delete({
          where: { id: input.id },
        });
      } catch (error) {
        handlePrismaError(error, 'stone type');
      }
    }),

  // Stone Finishes
  getStoneFinishes: publicProcedure.query(async ({ ctx }) => {
    return await (ctx.db as any).stone_finishes.findMany({
      orderBy: { name: "asc" },
      include: {
        stone_types: {
          select: { id: true, name: true },
        },
      },
    });
  }),

  createStoneFinish: publicProcedure
    .input(
      z.object({
        name: z.string(),
        stone_type_id: z.string(),
        description: z.string().optional(),
        price_modifier: z.number().default(0),
        sort_order: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await (ctx.db as any).stone_finishes.create({
          data: {
            name: input.name,
            stone_type_id: input.stone_type_id,
            description: input.description,
            price_modifier: input.price_modifier,
            sort_order: input.sort_order,
            active: true,
          },
        });
      } catch (error) {
        handlePrismaError(error, 'stone finish');
      }
    }),

  updateStoneFinish: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        stone_type_id: z.string(),
        description: z.string().optional(),
        price_modifier: z.number(),
        sort_order: z.number().optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...data } = input;
        return await (ctx.db as any).stone_finishes.update({
          where: { id },
          data,
        });
      } catch (error) {
        handlePrismaError(error, 'stone finish');
      }
    }),

  deleteStoneFinish: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await (ctx.db as any).stone_finishes.delete({
          where: { id: input.id },
        });
      } catch (error) {
        handlePrismaError(error, 'stone finish');
      }
    }),

  // ========================================
  // WEAVING PROCEDURES
  // ========================================

  getWeavingStyles: publicProcedure.query(async ({ ctx }) => {
    return await (ctx.db as any).weaving_patterns.findMany({
      orderBy: { name: "asc" },
    });
  }),

  createWeavingStyle: publicProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        price_modifier: z.number().default(0),
        sort_order: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await (ctx.db as any).weaving_patterns.create({
          data: {
            name: input.name,
            description: input.description,
            price_modifier: input.price_modifier,
            sort_order: input.sort_order,
            active: true,
          },
        });
      } catch (error) {
        handlePrismaError(error, 'weaving style');
      }
    }),

  updateWeavingStyle: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().optional(),
        price_modifier: z.number(),
        sort_order: z.number().optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...data } = input;
        return await (ctx.db as any).weaving_patterns.update({
          where: { id },
          data,
        });
      } catch (error) {
        handlePrismaError(error, 'weaving style');
      }
    }),

  deleteWeavingStyle: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await (ctx.db as any).weaving_patterns.delete({
          where: { id: input.id },
        });
      } catch (error) {
        handlePrismaError(error, 'weaving style');
      }
    }),

  // ========================================
  // CARVING PROCEDURES
  // ========================================

  getCarvingStyles: publicProcedure.query(async ({ ctx }) => {
    return await (ctx.db as any).carving_styles.findMany({
      orderBy: { name: "asc" },
    });
  }),

  createCarvingStyle: publicProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        price_modifier: z.number().default(0),
        sort_order: z.number().optional(),
        complexity_level: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await (ctx.db as any).carving_styles.create({
          data: {
            name: input.name,
            description: input.description,
            price_modifier: input.price_modifier,
            sort_order: input.sort_order,
            complexity_level: input.complexity_level,
            active: true,
          },
        });
      } catch (error) {
        handlePrismaError(error, 'carving style');
      }
    }),

  updateCarvingStyle: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().optional(),
        price_modifier: z.number(),
        sort_order: z.number().optional(),
        complexity_level: z.number().optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...data } = input;
        return await (ctx.db as any).carving_styles.update({
          where: { id },
          data,
        });
      } catch (error) {
        handlePrismaError(error, 'carving style');
      }
    }),

  deleteCarvingStyle: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await (ctx.db as any).carving_styles.delete({
          where: { id: input.id },
        });
      } catch (error) {
        handlePrismaError(error, 'carving style');
      }
    }),
});

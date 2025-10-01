import { z } from 'zod';
import { createCrudRouter } from '../utils/crud-generator';
import { createTRPCRouter, publicProcedure } from '../trpc/init';
// TODO: These imports will be used for full dimension form integration
// import { createDualDimension, dualDimensionToDb } from '@/lib/utils/unit-conversion';
import { validateFurnitureDimensions, type FurnitureType } from '@/lib/utils/dimension-validation';
import { generateBaseSku, regenerateBaseSku } from '@/lib/utils/base-sku-generator';

// Collections Schema
const createCollectionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  prefix: z.string().min(1).max(10),
  active: z.boolean().default(true),
  display_order: z.number().default(0),
  metadata: z.record(z.any()).optional(),
});

export const collectionsRouter = createCrudRouter({
  name: 'Collection',
  model: 'collections' as any,
  createSchema: createCollectionSchema,
  updateSchema: createCollectionSchema.partial(),
  searchFields: ['name', 'description', 'category'],
  defaultOrderBy: { display_order: 'asc' },
  defaultInclude: {
    items: {
      where: { active: true },
      select: {
        id: true,
        name: true,
        sku: true,
        list_price: true,
      },
    },
  },
});

// Materials Schema
const createMaterialSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  category_id: z.string().uuid().optional(),
  type: z.string(),
  color: z.string().optional(),
  finish: z.string().optional(),
  list_price: z.number().min(0),
  unit: z.string().default('unit'),
  specifications: z.record(z.any()).optional(),
  active: z.boolean().default(true),
  supplier: z.string().optional(),
  lead_time_days: z.number().optional(),
  minimum_order_quantity: z.number().optional(),
});

const baseMaterialsRouter = createCrudRouter({
  name: 'Material',
  model: 'materials' as any,
  createSchema: createMaterialSchema,
  updateSchema: createMaterialSchema.partial(),
  searchFields: ['name', 'code', 'type', 'color', 'finish'],
  defaultOrderBy: { name: 'asc' },
});

// Items Schema
const createItemSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  collection_id: z.string().uuid(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  description: z.string().optional(),
  list_price: z.number().min(0),
  currency: z.string().default('USD'),
  dimensions: z.record(z.any()).optional(),
  materials: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  lead_time_days: z.number().optional(),
  min_order_quantity: z.number().default(1),
  active: z.boolean().default(true),
  is_customizable: z.boolean().default(false),
  type: z.enum(['Concept', 'Prototype', 'Production Ready']).default('Production Ready'),
  prototype_status: z.string().optional(),
  furniture_type: z.enum(['chair', 'bench', 'table', 'sofa/loveseat', 'sectional', 'lounge', 'chaise_lounge', 'ottoman']).optional(),
  base_sku: z.string().optional(), // Auto-generated but can be manually set
  variation_type: z.string().optional(), // e.g., "Deep", "Short", "Wide"
});

// Furniture Dimensions Schema
const furnitureDimensionsSchema = z.object({
  item_id: z.string().uuid(),
  furniture_type: z.enum(['chair', 'bench', 'table', 'sofa/loveseat', 'sectional', 'lounge', 'chaise_lounge', 'ottoman']),

  // Universal dimensions
  height_inches: z.number().positive().optional(),
  height_cm: z.number().positive().optional(),
  width_inches: z.number().positive().optional(),
  width_cm: z.number().positive().optional(),
  depth_inches: z.number().positive().optional(),
  depth_cm: z.number().positive().optional(),
  weight_capacity: z.number().positive().optional(),

  // Table-specific
  length_inches: z.number().positive().optional(),
  length_cm: z.number().positive().optional(),
  apron_height_inches: z.number().positive().optional(),
  apron_height_cm: z.number().positive().optional(),
  leg_clearance_inches: z.number().positive().optional(),
  leg_clearance_cm: z.number().positive().optional(),
  overhang_inches: z.number().positive().optional(),
  overhang_cm: z.number().positive().optional(),
  leaf_width_inches: z.number().positive().optional(),
  leaf_width_cm: z.number().positive().optional(),
  leaf_length_inches: z.number().positive().optional(),
  leaf_length_cm: z.number().positive().optional(),

  // Chair/Seating-specific
  seat_height_inches: z.number().positive().optional(),
  seat_height_cm: z.number().positive().optional(),
  seat_width_inches: z.number().positive().optional(),
  seat_width_cm: z.number().positive().optional(),
  seat_depth_inches: z.number().positive().optional(),
  seat_depth_cm: z.number().positive().optional(),
  arm_height_inches: z.number().positive().optional(),
  arm_height_cm: z.number().positive().optional(),
  backrest_height_inches: z.number().positive().optional(),
  backrest_height_cm: z.number().positive().optional(),
  width_across_arms_inches: z.number().positive().optional(),
  width_across_arms_cm: z.number().positive().optional(),

  // Additional specialized dimensions can be added here
  clearance_required_inches: z.number().positive().optional(),
  clearance_required_cm: z.number().positive().optional(),
  doorway_clearance_inches: z.number().positive().optional(),
  doorway_clearance_cm: z.number().positive().optional(),

  // Lounge-specific
  reclined_depth_inches: z.number().positive().optional(),
  reclined_depth_cm: z.number().positive().optional(),
  footrest_length_inches: z.number().positive().optional(),
  footrest_length_cm: z.number().positive().optional(),
  zero_wall_clearance_inches: z.number().positive().optional(),
  zero_wall_clearance_cm: z.number().positive().optional(),
  swivel_range: z.number().positive().optional(),

  // Ottoman dimensions
  ottoman_height_inches: z.number().positive().optional(),
  ottoman_height_cm: z.number().positive().optional(),
  ottoman_length_inches: z.number().positive().optional(),
  ottoman_length_cm: z.number().positive().optional(),
  ottoman_width_inches: z.number().positive().optional(),
  ottoman_width_cm: z.number().positive().optional(),

  // Interior/Storage dimensions
  interior_width_inches: z.number().positive().optional(),
  interior_width_cm: z.number().positive().optional(),
  interior_depth_inches: z.number().positive().optional(),
  interior_depth_cm: z.number().positive().optional(),
  interior_height_inches: z.number().positive().optional(),
  interior_height_cm: z.number().positive().optional(),

  // Specialized measurements
  backrest_angle: z.number().positive().optional(),
  chaise_orientation: z.enum(['left', 'right']).optional(),
  adjustable_positions: z.number().positive().optional(),
  cushion_thickness_compressed_inches: z.number().positive().optional(),
  cushion_thickness_compressed_cm: z.number().positive().optional(),
  cushion_thickness_uncompressed_inches: z.number().positive().optional(),
  cushion_thickness_uncompressed_cm: z.number().positive().optional(),
  stacking_height_inches: z.number().positive().optional(),
  stacking_height_cm: z.number().positive().optional(),
  folded_width_inches: z.number().positive().optional(),
  folded_width_cm: z.number().positive().optional(),
  folded_depth_inches: z.number().positive().optional(),
  folded_depth_cm: z.number().positive().optional(),
  folded_height_inches: z.number().positive().optional(),
  folded_height_cm: z.number().positive().optional(),
  diagonal_depth_inches: z.number().positive().optional(),
  diagonal_depth_cm: z.number().positive().optional(),
});

// Item Images Schema
const itemImageSchema = z.object({
  item_id: z.string().uuid(),
  image_type: z.enum(['line_drawing', 'isometric', '3d_model', 'rendering', 'photograph']),
  file_url: z.string().url(),
  file_name: z.string().optional(),
  file_size: z.number().positive().optional(),
  mime_type: z.string().optional(),
  alt_text: z.string().optional(),
  description: z.string().optional(),
  sort_order: z.number().default(0),
  is_primary: z.boolean().default(false),
});

const baseItemsRouter = createCrudRouter({
  name: 'Item',
  model: 'items' as any,
  createSchema: createItemSchema,
  updateSchema: createItemSchema.partial(),
  searchFields: ['sku', 'name', 'category', 'subcategory'],
  defaultOrderBy: { created_at: 'desc' },
  defaultInclude: {
    collections: {
      select: {
        id: true,
        name: true,
        prefix: true,
      },
    },
  },
});

// Extend items router with catalog-specific operations
export const itemsRouter = createTRPCRouter({
  // Custom getAll to ensure base_sku is included
  getAll: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
      orderBy: z.record(z.enum(['asc', 'desc'])).optional(),
    }).partial().default({ limit: 50, offset: 0 }))
    .query(async ({ ctx, input }) => {
      const { limit = 50, offset = 0, orderBy } = input;

      const [items, total] = await ctx.db.$transaction([
        (ctx.db as any).items.findMany({
          take: limit,
          skip: offset,
          orderBy: orderBy || { created_at: 'desc' },
          include: {
            furniture_collections: {
              select: {
                id: true,
                name: true,
                prefix: true,
              },
            },
          },
        }),
        (ctx.db as any).items.count(),
      ]) as [any[], number];

      return {
        items,
        total,
        hasMore: offset + limit < total,
        nextOffset: offset + limit < total ? offset + limit : null,
      };
    }),

  // Include other read-only CRUD operations from base router
  getById: baseItemsRouter._def.procedures.getById,
  search: baseItemsRouter._def.procedures.search,
  delete: baseItemsRouter._def.procedures.delete,
  createMany: baseItemsRouter._def.procedures.createMany,
  deleteMany: baseItemsRouter._def.procedures.deleteMany,

  // Custom create with Base SKU auto-generation
  create: publicProcedure
    .input(createItemSchema)
    .mutation(async ({ ctx, input }) => {
      // Get collection prefix
      const collection = await (ctx.db as any).furniture_collections.findUnique({
        where: { id: input.collection_id },
        select: { prefix: true },
      });

      if (!collection?.prefix) {
        throw new Error('Collection not found or missing prefix');
      }

      // Auto-generate Base SKU if not provided or if not Production Ready
      let baseSku = input.base_sku;
      if (!baseSku || input.type !== 'Production Ready') {
        baseSku = await generateBaseSku(
          collection.prefix,
          input.name,
          input.variation_type
        );
      }

      // Create item with generated Base SKU
      return (ctx.db as any).items.create({
        data: {
          ...input,
          base_sku: baseSku,
        },
        include: {
          furniture_collections: true,
        },
      });
    }),

  // Custom update with Base SKU auto-regeneration
  update: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: createItemSchema.partial(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get existing item
      const existingItem = await (ctx.db as any).items.findUnique({
        where: { id: input.id },
      });

      if (!existingItem) {
        throw new Error('Item not found');
      }

      // Determine if Base SKU needs regeneration
      let baseSku = input.data.base_sku;
      const isProductionReady = (input.data.type ?? existingItem.type) === 'Production Ready';

      // Regenerate Base SKU if:
      // 1. Not Production Ready AND
      // 2. Name, collection, or variation changed
      if (!isProductionReady) {
        const nameChanged = input.data.name && input.data.name !== existingItem.name;
        const collectionChanged = input.data.collection_id && input.data.collection_id !== existingItem.collection_id;
        const variationChanged = input.data.variation_type !== undefined && input.data.variation_type !== existingItem.variation_type;

        if (nameChanged || collectionChanged || variationChanged) {
          const collectionId = input.data.collection_id ?? existingItem.collection_id;
          const itemName = input.data.name ?? existingItem.name;
          const variationType = input.data.variation_type !== undefined ? input.data.variation_type : existingItem.variation_type;

          baseSku = await regenerateBaseSku(
            input.id,
            collectionId,
            itemName,
            variationType
          );
        }
      }

      // Update item with potentially regenerated Base SKU
      return (ctx.db as any).items.update({
        where: { id: input.id },
        data: {
          ...input.data,
          ...(baseSku && { base_sku: baseSku }),
        },
        include: {
          furniture_collections: true,
        },
      });
    }),

  // Get items by collection
  getByCollection: publicProcedure
    .input(z.object({
      collectionId: z.string().uuid(),
      includeInactive: z.boolean().default(false),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {
        collection_id: input.collectionId,
      };
      
      if (!input.includeInactive) {
        where.active = true;
      }
      
      return ctx.db.items.findMany({
        where,
        orderBy: { name: 'asc' },
      });
    }),
  
  // Generate SKU with material selection
  generateSKU: publicProcedure
    .input(z.object({
      itemId: z.string().uuid(),
      materialId: z.string().uuid(),
      projectId: z.string().uuid().optional(),
      orderId: z.string().uuid().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get item and material details
      const [item, material] = await Promise.all([
        ctx.db.items.findUnique({
          where: { id: input.itemId },
          include: { collections: true },
        }),
        ctx.db.materials.findUnique({
          where: { id: input.materialId },
        }),
      ]);
      
      if (!item || !material) {
        throw new Error('Item or material not found');
      }
      
      // Generate SKU: CollectionPrefix-ItemSKU-MaterialCode-ProjectID
      const skuParts = [
        item.collections?.prefix || 'GEN',
        item.sku,
        material.code,
      ];
      
      if (input.projectId) {
        skuParts.push(input.projectId.slice(0, 8));
      }
      
      return {
        sku: skuParts.join('-'),
        item,
        material,
        totalPrice: Number(item.list_price ?? 0) + Number(material.list_price ?? 0),
      };
    }),

  // Furniture Dimensions Operations
  getFurnitureDimensions: publicProcedure
    .input(z.object({ itemId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      try {
        console.log('getFurnitureDimensions called with itemId:', input.itemId);
        const result = await ctx.db.furniture_dimensions.findUnique({
          where: { item_id: input.itemId },
        });
        console.log('getFurnitureDimensions result:', result ? 'Found' : 'Not found');
        return result;
      } catch (error) {
        console.error('getFurnitureDimensions error:', error);
        throw error;
      }
    }),

  updateFurnitureDimensions: publicProcedure
    .input(furnitureDimensionsSchema)
    .mutation(async ({ ctx, input }) => {
      // Validate dimensions for the furniture type
      // Filter out non-dimension fields for validation
      const dimensionsOnly: Record<string, number | undefined> = {};
      Object.entries(input).forEach(([key, value]) => {
        if (key !== 'item_id' && key !== 'furniture_type' && typeof value === 'number') {
          dimensionsOnly[key as keyof typeof dimensionsOnly] = value;
        }
      });
      const validation = validateFurnitureDimensions(input.furniture_type as FurnitureType, dimensionsOnly);

      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Upsert furniture dimensions
      return ctx.db.furniture_dimensions.upsert({
        where: { item_id: input.item_id },
        create: input,
        update: input,
      });
    }),

  deleteFurnitureDimensions: publicProcedure
    .input(z.object({ itemId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.furniture_dimensions.delete({
        where: { item_id: input.itemId },
      });
    }),

  // Item Images Operations
  getItemImages: publicProcedure
    .input(z.object({ itemId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.item_images.findMany({
        where: { item_id: input.itemId },
        orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
      });
    }),

  addItemImage: publicProcedure
    .input(itemImageSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if this image type has a limit (line_drawing, isometric, 3d_model = 1 each)
      const singleImageTypes = ['line_drawing', 'isometric', '3d_model'];

      if (singleImageTypes.includes(input.image_type)) {
        // Delete existing image of this type first
        await ctx.db.item_images.deleteMany({
          where: {
            item_id: input.item_id,
            image_type: input.image_type,
          },
        });
      }

      return ctx.db.item_images.create({
        data: input,
      });
    }),

  updateItemImage: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
      data: itemImageSchema.partial().omit({ item_id: true }),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.item_images.update({
        where: { id: input.id },
        data: input.data,
      });
    }),

  deleteItemImage: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.item_images.delete({
        where: { id: input.id },
      });
    }),

  reorderItemImages: publicProcedure
    .input(z.object({
      itemId: z.string().uuid(),
      imageType: z.enum(['line_drawing', 'isometric', '3d_model', 'rendering', 'photograph']),
      imageIds: z.array(z.string().uuid()),
    }))
    .mutation(async ({ ctx, input }) => {
      // Update sort order for each image
      const updates = input.imageIds.map((imageId, index) =>
        ctx.db.item_images.update({
          where: {
            id: imageId,
            item_id: input.itemId,
            image_type: input.imageType,
          },
          data: { sort_order: index },
        })
      );

      return Promise.all(updates);
    }),

  // Combined operations for efficiency
  getItemWithDimensionsAndImages: publicProcedure
    .input(z.object({ itemId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [item, dimensions, images] = await Promise.all([
        ctx.db.items.findUnique({
          where: { id: input.itemId },
          include: {
            collections: {
              select: {
                id: true,
                name: true,
                prefix: true,
              },
            },
          },
        }),
        ctx.db.furniture_dimensions.findUnique({
          where: { item_id: input.itemId },
        }),
        ctx.db.item_images.findMany({
          where: { item_id: input.itemId },
          orderBy: [{ image_type: 'asc' }, { sort_order: 'asc' }],
        }),
      ]);

      return {
        item,
        dimensions,
        images: images.reduce((acc: Record<string, any[]>, image: any) => {
          if (!acc[image.image_type]) acc[image.image_type] = [];
          acc[image.image_type].push(image);
          return acc;
        }, {} as Record<string, any[]>),
      };
    }),
});

export const materialsRouter = baseMaterialsRouter;

import { z } from 'zod';
import { createCrudRouter } from '../utils/crud-generator';
import { createTRPCRouter, publicProcedure } from '../trpc/init';

// Collections Schema
const createCollectionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  prefix: z.string().min(1).max(10),
  is_active: z.boolean().default(true),
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
      where: { is_active: true },
      select: {
        id: true,
        name: true,
        sku: true,
        base_price: true,
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
  base_price: z.number().min(0),
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
  base_price: z.number().min(0),
  currency: z.string().default('USD'),
  dimensions: z.record(z.any()).optional(),
  materials: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  lead_time_days: z.number().optional(),
  min_order_quantity: z.number().default(1),
  is_active: z.boolean().default(true),
  is_customizable: z.boolean().default(false),
  type: z.enum(['Standard', 'Custom', 'Concept', 'Prototype']).default('Standard'),
  prototype_status: z.string().optional(),
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
  ...baseItemsRouter._def.procedures,
  
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
        where.is_active = true;
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
        totalPrice: Number(item.base_price ?? 0) + Number(material.base_price ?? 0),
      };
    }),
});

export const materialsRouter = baseMaterialsRouter;

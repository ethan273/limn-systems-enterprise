import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc/init";

// Auto-generate unique collection prefix
const generateUniquePrefix = async (db: any, collectionName: string): Promise<string> => {
  // Get all existing prefixes
  const existingCollections = await db.collections.findMany({
    select: { prefix: true },
  });
  const existingPrefixes = existingCollections
    .map((c: { prefix?: string | null }) => c.prefix)
    .filter((p: string | null | undefined): p is string => Boolean(p))
    .map((p: string) => p.toUpperCase());

  const words = collectionName.trim().split(/\s+/);
  const name = words[0] || '';

  // Strategy 1: First 2 letters
  let prefix = name.substring(0, 2).toUpperCase();
  if (!existingPrefixes.includes(prefix)) return prefix;

  // Strategy 2: First + Last word
  if (words.length > 1) {
    prefix = (name.charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    if (!existingPrefixes.includes(prefix)) return prefix;
  }

  // Strategy 3: First + Second word
  if (words.length > 1) {
    prefix = (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    if (!existingPrefixes.includes(prefix)) return prefix;
  }

  // Strategy 4: Consonants only
  const consonants = name.replace(/[AEIOU]/gi, '');
  if (consonants.length >= 2) {
    prefix = consonants.substring(0, 2).toUpperCase();
    if (!existingPrefixes.includes(prefix)) return prefix;
  }

  // Strategy 5: Add numbers
  const base = name.charAt(0).toUpperCase();
  for (let i = 1; i <= 9; i++) {
    prefix = base + i;
    if (!existingPrefixes.includes(prefix)) return prefix;
  }

  // Strategy 6: Random generation (last resort)
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < 100; i++) {
    prefix = letters.charAt(Math.floor(Math.random() * letters.length)) +
             letters.charAt(Math.floor(Math.random() * letters.length));
    if (!existingPrefixes.includes(prefix)) return prefix;
  }

  throw new Error('Unable to generate unique prefix');
};

export const productsRouter = createTRPCRouter({
  // Catalog Products Management
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(1000).default(100),
        cursor: z.string().uuid().optional(),
        category: z.string().optional(),
        search: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 100;
      const cursor = input?.cursor;
      const category = input?.category;
      const search = input?.search;

      const where: any = {};

      if (category) {
        where.category = category;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (cursor) {
        where.id = { lt: cursor };
      }

      const products = await (ctx.db as any).products.findMany({
        where,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          sku: true,
          name: true,
          category: true,
          base_price: true,
          description: true,
          unit: true,
          weight_lbs: true,
          dimensions: true,
          created_at: true,
          updated_at: true,
        },
      });

      return {
        items: products,
        nextCursor: products.length === limit ? products[products.length - 1]?.id : undefined,
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return await (ctx.db as any).products.findUnique({
        where: { id: input.id },
      });
    }),

  // Collection Management
  getAllCollections: publicProcedure.query(async ({ ctx }) => {
    const collections = await (ctx.db as any).collections.findMany({
      orderBy: { name: "asc" },
      include: {
        material_collections: {
          include: {
            materials: {
              select: {
                type: true,
              },
            },
          },
        },
      },
    });

    // Calculate real material counts by type
    const collectionsWithCounts = collections.map((collection: any) => {
      const materialCounts = {
        fabrics: 0,
        woods: 0,
        metals: 0,
        stones: 0,
        weaving: 0,
        carving: 0,
      };

      collection.material_collections?.forEach((mc: any) => {
        const type = mc.materials?.type?.toLowerCase();
        if (type === "fabric") materialCounts.fabrics++;
        else if (type === "wood") materialCounts.woods++;
        else if (type === "metal") materialCounts.metals++;
        else if (type === "stone") materialCounts.stones++;
        else if (type === "weaving") materialCounts.weaving++;
        else if (type === "carving") materialCounts.carving++;
      });

      return {
        ...collection,
        material_counts: materialCounts,
      };
    });

    return collectionsWithCounts;
  }),

  // Add Collection
  createCollection: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        prefix: z.string().optional(),
        designer: z.string().optional(),
        is_active: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Auto-generate unique prefix if not provided
      const finalPrefix = input.prefix || await generateUniquePrefix(ctx.db, input.name);

      return await (ctx.db as any).collections.create({
        data: {
          name: input.name,
          description: input.description,
          prefix: finalPrefix,
          designer: input.designer,
          is_active: input.is_active ?? true,
        },
      });
    }),

  // Update Collection
  updateCollection: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        description: z.string().optional(),
        prefix: z.string().optional(),
        designer: z.string().optional(),
        is_active: z.boolean().optional(),
        variation_types: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await (ctx.db as any).collections.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
          prefix: input.prefix,
          designer: input.designer,
          is_active: input.is_active,
          variation_types: input.variation_types,
        },
      });
    }),

  // Delete Collection
  deleteCollection: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await (ctx.db as any).collections.delete({
        where: { id: input.id },
      });
    }),

  // Fabric Brand Management
  getAllFabricBrands: publicProcedure.query(async ({ ctx }) => {
    return await (ctx.db as any).fabric_brands.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
  }),

  getCollectionsForFabricBrand: publicProcedure
    .input(z.object({ fabricBrandId: z.string() }))
    .query(async ({ ctx, input }) => {
      const assignments = await (ctx.db as any).fabric_brand_collections.findMany({
        where: { fabric_brand_id: input.fabricBrandId },
        include: {
          collections: true,
        },
      });
      return assignments.map((assignment: { collections: unknown }) => assignment.collections);
    }),

  assignFabricBrandToCollection: publicProcedure
    .input(z.object({
      fabricBrandId: z.string(),
      collectionId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await (ctx.db as any).fabric_brand_collections.create({
        data: {
          fabric_brand_id: input.fabricBrandId,
          collection_id: input.collectionId,
        },
      });
    }),

  removeFabricBrandFromCollection: publicProcedure
    .input(z.object({
      fabricBrandId: z.string(),
      collectionId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await (ctx.db as any).fabric_brand_collections.deleteMany({
        where: {
          fabric_brand_id: input.fabricBrandId,
          collection_id: input.collectionId,
        },
      });
    }),

  // Material Categories Management
  getMaterialCategories: publicProcedure.query(async ({ ctx }) => {
    return await (ctx.db as any).material_categories.findMany({
      where: { active: true },
      orderBy: { sort_order: "asc" },
    });
  }),

  // Materials Management
  getAllMaterials: publicProcedure.query(async ({ ctx }) => {
    // First check total count
    const totalCount = await (ctx.db as any).materials.count();
    const activeCount = await (ctx.db as any).materials.count({ where: { active: true } });
    console.log(`[getAllMaterials] Total materials in DB: ${totalCount}, Active: ${activeCount}`);

    const materials = await (ctx.db as any).materials.findMany({
      where: { active: true },
      include: {
        material_categories: true,
        materials: {
          select: {
            id: true,
            name: true,
            hierarchy_path: true,
            type: true,
            hierarchy_level: true,
            materials: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        other_materials: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        material_collections: {
          include: {
            collections: {
              select: {
                id: true,
                name: true,
                prefix: true,
              },
            },
          },
        },
      },
      orderBy: [
        { hierarchy_path: 'asc' },
        { name: 'asc' },
      ],
      // Add explicit limit to fetch all materials (database wrapper defaults to 20)
      take: 1000,
    });

    console.log(`[getAllMaterials] Found ${materials.length} materials`);
    if (materials.length > 0) {
      console.log('[getAllMaterials] Sample material:', {
        id: materials[0].id,
        name: materials[0].name,
        type: materials[0].type,
        hierarchy_level: materials[0].hierarchy_level,
        parent_material_id: materials[0].parent_material_id,
        category: materials[0].material_categories?.name,
      });

      // Log materials with parents
      const materialsWithParents = materials.filter((m: any) => m.parent_material_id);
      console.log(`[getAllMaterials] Materials with parents: ${materialsWithParents.length}`);
      if (materialsWithParents.length > 0) {
        console.log('[getAllMaterials] Sample child material:', {
          id: materialsWithParents[0].id,
          name: materialsWithParents[0].name,
          parent_material_id: materialsWithParents[0].parent_material_id,
          category: materialsWithParents[0].material_categories?.name,
        });
      }
    }

    return materials.map((material: { material_collections?: { collections: unknown }[] }) => ({
      ...material,
      collections: material.material_collections?.map(
        (mc: { collections: unknown }) => mc.collections
      ) || [],
    }));
  }),

  createMaterial: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        code: z.string().min(1),
        type: z.string().optional(),
        description: z.string().optional(),
        category_id: z.string(),
        active: z.boolean().default(true),
        cost_per_unit: z.number().optional(),
        unit_of_measure: z.string().optional(),
        parent_material_id: z.string().optional(),
        hierarchy_level: z.number().int().min(1).max(3),
        collection_ids: z.array(z.string()).optional(),
        supplier: z.string().optional(),
        color_sku: z.string().optional(),
        swatch_url: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { collection_ids, parent_material_id, ...materialData } = input;

      // Validate parent and collection inheritance
      if (parent_material_id) {
        const parent = await (ctx.db as any).materials.findUnique({
          where: { id: parent_material_id },
          include: {
            material_collections: true,
            material_categories: true,
          },
        });

        if (!parent) {
          throw new Error('Parent material not found');
        }

        // Determine material types for inheritance rules
        const parentCategoryName = parent.material_categories?.name?.toLowerCase() || '';
        const currentCategoryName = materialData.type?.toLowerCase() || '';

        const parentIsFabric = parentCategoryName.includes('fabric');
        const currentIsFabric = currentCategoryName.includes('fabric') || parentIsFabric;

        const isFabricBrand = parentIsFabric && parent.hierarchy_level === 1;
        const isFabricCollection = currentIsFabric && input.hierarchy_level === 2 && parentIsFabric;
        const isFabricColor = currentIsFabric && input.hierarchy_level === 3 && parentIsFabric;

        // Validate collection inheritance based on material type
        if (collection_ids && collection_ids.length > 0) {
          const parentCollectionIds = parent.material_collections.map((mc: { collection_id: string }) => mc.collection_id);

          // Fabric Collections (children of Fabric Brands) can have different collections
          if (isFabricBrand && isFabricCollection) {
            // No enforcement - fabric collections can be independent from brands
            // This allows brands to be available everywhere but specific collections to be limited
            console.log(`[createMaterial] Fabric Collection inheriting from Fabric Brand - allowing independent collection selection`);
          }
          // Fabric Colors must inherit from Fabric Collection
          else if (isFabricCollection && isFabricColor) {
            if (parentCollectionIds.length > 0) {
              const invalidIds = collection_ids.filter((id: string) => !parentCollectionIds.includes(id));
              if (invalidIds.length > 0) {
                throw new Error('Fabric colors must inherit collection availability from their fabric collection parent');
              }
            }
          }
          // All other materials: children must inherit parent restrictions
          else if (parentCollectionIds.length > 0) {
            const invalidIds = collection_ids.filter((id: string) => !parentCollectionIds.includes(id));
            if (invalidIds.length > 0) {
              throw new Error('Child material cannot be available in collections that parent is not available in');
            }
          }
        }
      }

      // Generate hierarchy path
      let hierarchy_path = materialData.name;
      if (parent_material_id) {
        const parent = await (ctx.db as any).materials.findUnique({
          where: { id: parent_material_id },
          include: { material_collections: false },
        });
        if (parent?.hierarchy_path) {
          hierarchy_path = `${parent.hierarchy_path}/${materialData.name}`;
        }
      }

      // Create material
      const material = await (ctx.db as any).materials.create({
        data: {
          ...materialData,
          parent_material_id,
          hierarchy_path,
          material_collections: collection_ids && collection_ids.length > 0
            ? {
                create: collection_ids.map((c_id: string) => ({
                  collection_id: c_id,
                })),
              }
            : undefined,
        },
        include: {
          material_collections: {
            include: {
              collections: true,
            },
          },
        },
      });

      return material;
    }),

  updateMaterial: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        code: z.string().min(1),
        type: z.string().optional(),
        description: z.string().optional(),
        category_id: z.string(),
        active: z.boolean(),
        cost_per_unit: z.number().optional(),
        unit_of_measure: z.string().optional(),
        collection_ids: z.array(z.string()).optional(),
        swatch_url: z.string().optional(),
        // Note: parent_material_id is immutable, not included
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, collection_ids, name, ...updateData } = input;

      const existingMaterial = await (ctx.db as any).materials.findUnique({
        where: { id },
        include: {
          material_categories: true,
          materials: {
            include: {
              material_collections: true,
              material_categories: true,
            },
          },
        },
      });

      if (!existingMaterial) {
        throw new Error('Material not found');
      }

      // Validate collection inheritance with fabric-specific rules
      if (collection_ids && existingMaterial.materials) {
        const parent = existingMaterial.materials;
        const parentCollectionIds = parent.material_collections.map(
          (mc: { collection_id: string }) => mc.collection_id
        );

        // Determine material types for inheritance rules
        const parentCategoryName = parent.material_categories?.name?.toLowerCase() || '';
        const currentCategoryName = existingMaterial.material_categories?.name?.toLowerCase() || '';

        const parentIsFabric = parentCategoryName.includes('fabric');
        const currentIsFabric = currentCategoryName.includes('fabric') || parentIsFabric;

        const isFabricBrand = parentIsFabric && parent.hierarchy_level === 1;
        const isFabricCollection = currentIsFabric && existingMaterial.hierarchy_level === 2 && parentIsFabric;
        const isFabricColor = currentIsFabric && existingMaterial.hierarchy_level === 3 && parentIsFabric;

        // Validate collection inheritance based on material type
        if (parentCollectionIds.length > 0 && collection_ids.length > 0) {
          // Fabric Collections (children of Fabric Brands) can have different collections
          if (isFabricBrand && isFabricCollection) {
            // No enforcement - fabric collections can be independent from brands
            console.log(`[updateMaterial] Fabric Collection updating - allowing independent collection selection`);
          }
          // Fabric Colors must inherit from Fabric Collection
          else if (isFabricCollection && isFabricColor) {
            const invalidIds = collection_ids.filter((id: string) => !parentCollectionIds.includes(id));
            if (invalidIds.length > 0) {
              throw new Error('Fabric colors must inherit collection availability from their fabric collection parent');
            }
          }
          // All other materials: children must inherit parent restrictions
          else {
            const invalidIds = collection_ids.filter((id: string) => !parentCollectionIds.includes(id));
            if (invalidIds.length > 0) {
              throw new Error('Child material cannot be available in collections that parent is not available in');
            }
          }
        }
      }

      // Calculate new hierarchy_path if name changed
      let hierarchy_path = existingMaterial.hierarchy_path;
      if (name !== existingMaterial.name) {
        if (existingMaterial.materials?.hierarchy_path) {
          hierarchy_path = `${existingMaterial.materials.hierarchy_path}/${name}`;
        } else {
          hierarchy_path = name;
        }
      }

      return await (ctx.db as any).materials.update({
        where: { id },
        data: {
          ...updateData,
          name,
          hierarchy_path,
          material_collections: collection_ids !== undefined
            ? {
                deleteMany: {},
                create: collection_ids.map((c_id: string) => ({
                  collection_id: c_id,
                })),
              }
            : undefined,
        },
      });
    }),

  deleteMaterial: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check for child materials
      const childCount = await (ctx.db as any).materials.count({
        where: { parent_material_id: input.id },
      });

      if (childCount > 0) {
        const children = await (ctx.db as any).materials.findMany({
          where: { parent_material_id: input.id },
          select: { name: true, type: true },
        });

        throw new Error(
          `Cannot delete material with ${childCount} child materials: ${children.map((c: { name: string }) => c.name).join(', ')}`
        );
      }

      return await (ctx.db as any).materials.delete({
        where: { id: input.id },
      });
    }),

  getChildMaterials: publicProcedure
    .input(z.object({
      parentId: z.string(),
      includeInactive: z.boolean().optional().default(false),
    }))
    .query(async ({ ctx, input }) => {
      return await (ctx.db as any).materials.findMany({
        where: {
          parent_material_id: input.parentId,
          ...(input.includeInactive ? {} : { active: true }),
        },
        include: {
          material_categories: true,
          material_collections: {
            include: {
              collections: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });
    }),

  getMaterialsByCollection: publicProcedure
    .input(z.object({
      collectionId: z.string(),
      materialType: z.string().optional(),
      hierarchyLevel: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const materials = await (ctx.db as any).materials.findMany({
        where: {
          active: true,
          ...(input.materialType && { type: input.materialType }),
          ...(input.hierarchyLevel && { hierarchy_level: input.hierarchyLevel }),
          OR: [
            {
              material_collections: {
                some: { collection_id: input.collectionId },
              },
            },
            {
              material_collections: { none: {} },
            },
          ],
        },
        include: {
          materials: {
            select: {
              id: true,
              name: true,
              type: true,
              hierarchy_path: true,
            },
          },
          material_categories: true,
          material_collections: {
            include: {
              collections: true,
            },
          },
        },
        orderBy: [
          { hierarchy_path: 'asc' },
          { name: 'asc' },
        ],
      });

      return materials.map((material: { material_collections?: { collections: unknown }[] }) => ({
        ...material,
        collections: material.material_collections?.map(
          (mc: { collections: unknown }) => mc.collections
        ) || [],
      }));
    }),

  // Material-Collection Relationships
  assignMaterialToCollection: publicProcedure
    .input(z.object({
      materialId: z.string(),
      collectionId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await (ctx.db as any).material_collections.create({
        data: {
          material_id: input.materialId,
          collection_id: input.collectionId,
        },
      });
    }),

  removeMaterialFromCollection: publicProcedure
    .input(z.object({
      materialId: z.string(),
      collectionId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await (ctx.db as any).material_collections.deleteMany({
        where: {
          material_id: input.materialId,
          collection_id: input.collectionId,
        },
      });
    }),

  // Filtered Material Queries (for Order Creation)
  getFilteredFabricBrands: publicProcedure
    .input(z.object({ collection_id: z.string() }))
    .query(async ({ ctx, input }) => {
      const brands = await (ctx.db as any).fabric_brand_collections.findMany({
        where: { collection_id: input.collection_id },
        include: {
          fabric_brands: true,
        },
      });
      return brands.map((item: any) => item.fabric_brands).filter(Boolean);
    }),

  getFilteredWoodTypes: publicProcedure
    .input(z.object({ collection_id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get materials that are assigned to this collection and are wood type
      const materials = await (ctx.db as any).material_collections.findMany({
        where: {
          collection_id: input.collection_id,
        },
        include: {
          materials: {
            include: {
              material_categories: true,
            },
          },
        },
      });

      // Filter for wood materials only
      const woodMaterials = materials
        .map((item: any) => item.materials)
        .filter((material: any) => material.material_categories?.name?.toLowerCase().includes('wood'));

      return woodMaterials;
    }),

  getFilteredMetalTypes: publicProcedure
    .input(z.object({ collection_id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Get materials that are assigned to this collection and are metal type
      const materials = await (ctx.db as any).material_collections.findMany({
        where: {
          collection_id: input.collection_id,
        },
        include: {
          materials: {
            include: {
              material_categories: true,
            },
          },
        },
      });

      // Filter for metal materials only
      const metalMaterials = materials
        .map((item: any) => item.materials)
        .filter((material: any) => material.material_categories?.name?.toLowerCase().includes('metal'));

      return metalMaterials;
    }),

  // Concepts Management
  getAllConcepts: publicProcedure.query(async ({ ctx }) => {
    const concepts = await (ctx.db as any).concepts.findMany({
      orderBy: { created_at: "desc" },
      include: {
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
            prefix: true,
          },
        },
      },
    });
    return concepts;
  }),

  getConceptById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const concept = await (ctx.db as any).concepts.findUnique({
        where: { id: input.id },
        include: {
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
              prefix: true,
            },
          },
          prototypes: {
            select: {
              id: true,
              name: true,
              prototype_number: true,
              status: true,
            },
          },
          documents: {
            orderBy: { created_at: 'desc' },
            select: {
              id: true,
              name: true,
              type: true,
              size: true,
              url: true,
              media_type: true,
              is_primary_image: true,
              created_at: true,
            },
          },
        },
      });
      return concept;
    }),

  createConcept: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        concept_number: z.string().optional(),
        description: z.string().optional(),
        designer_id: z.string().uuid().optional(),
        collection_id: z.string().uuid().optional(),
        status: z.string().optional(),
        priority: z.string().optional(),
        target_price: z.number().optional(),
        estimated_cost: z.number().optional(),
        tags: z.array(z.string()).optional(),
        notes: z.string().optional(),
        specifications: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new Error('User must be logged in');
      }

      return await (ctx.db as any).concepts.create({
        data: {
          ...input,
          created_by: ctx.session.user.id,
        },
      });
    }),

  updateConcept: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        concept_number: z.string().optional(),
        description: z.string().optional(),
        designer_id: z.string().uuid().optional(),
        collection_id: z.string().uuid().optional(),
        status: z.string().optional(),
        priority: z.string().optional(),
        target_price: z.number().optional(),
        estimated_cost: z.number().optional(),
        tags: z.array(z.string()).optional(),
        notes: z.string().optional(),
        specifications: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      return await (ctx.db as any).concepts.update({
        where: { id },
        data: updateData,
      });
    }),

  deleteConcept: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return await (ctx.db as any).concepts.delete({
        where: { id: input.id },
      });
    }),

  // Prototypes Management
  getAllPrototypes: publicProcedure.query(async ({ ctx }) => {
    const prototypes = await (ctx.db as any).prototypes.findMany({
      orderBy: { created_at: "desc" },
      include: {
        designers: {
          select: {
            id: true,
            name: true,
          },
        },
        manufacturers: {
          select: {
            id: true,
            name: true,
          },
        },
        collections: {
          select: {
            id: true,
            name: true,
            prefix: true,
          },
        },
        concepts: {
          select: {
            id: true,
            name: true,
            concept_number: true,
          },
        },
      },
    });
    return prototypes;
  }),

  getPrototypeById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const prototype = await (ctx.db as any).prototypes.findUnique({
        where: { id: input.id },
        include: {
          designers: {
            select: {
              id: true,
              name: true,
            },
          },
          manufacturers: {
            select: {
              id: true,
              name: true,
            },
          },
          collections: {
            select: {
              id: true,
              name: true,
              prefix: true,
            },
          },
          concepts: {
            select: {
              id: true,
              name: true,
              concept_number: true,
            },
          },
          prototype_feedback: {
            orderBy: { submitted_at: 'desc' },
            select: {
              id: true,
              feedback_text: true,
              feedback_type: true,
              submitted_at: true,
            },
          },
          prototype_milestones: {
            orderBy: { planned_end: 'asc' },
            select: {
              id: true,
              milestone_name: true,
              status: true,
              planned_start: true,
              planned_end: true,
              actual_start: true,
              actual_end: true,
            },
          },
          prototype_documents: {
            select: {
              id: true,
              title: true,
              document_type: true,
              file_size: true,
              file_url: true,
              file_name: true,
              mime_type: true,
              status: true,
              uploaded_at: true,
              version: true,
              description: true,
            },
          },
        },
      });
      return prototype;
    }),

  createPrototype: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        prototype_number: z.string(),
        description: z.string().optional(),
        prototype_type: z.string().optional(),
        designer_id: z.string().uuid().optional(),
        manufacturer_id: z.string().uuid().optional(),
        collection_id: z.string().uuid().optional(),
        concept_id: z.string().uuid().optional(),
        status: z.string().optional(),
        priority: z.string().optional(),
        is_client_specific: z.boolean().optional(),
        is_catalog_candidate: z.boolean().optional(),
        target_price_usd: z.number().optional(),
        target_cost_usd: z.number().optional(),
        tags: z.array(z.string()).optional(),
        notes: z.string().optional(),
        specifications: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.user?.id) {
        throw new Error('User must be logged in');
      }

      return await (ctx.db as any).prototypes.create({
        data: {
          ...input,
          created_by: ctx.session.user.id,
        },
      });
    }),

  updatePrototype: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        prototype_number: z.string().optional(),
        description: z.string().optional(),
        prototype_type: z.string().optional(),
        designer_id: z.string().uuid().optional(),
        manufacturer_id: z.string().uuid().optional(),
        collection_id: z.string().uuid().optional(),
        concept_id: z.string().uuid().optional(),
        status: z.string().optional(),
        priority: z.string().optional(),
        is_client_specific: z.boolean().optional(),
        is_catalog_candidate: z.boolean().optional(),
        target_price_usd: z.number().optional(),
        target_cost_usd: z.number().optional(),
        tags: z.array(z.string()).optional(),
        notes: z.string().optional(),
        specifications: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      return await (ctx.db as any).prototypes.update({
        where: { id },
        data: updateData,
      });
    }),

  deletePrototype: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return await (ctx.db as any).prototypes.delete({
        where: { id: input.id },
      });
    }),
});
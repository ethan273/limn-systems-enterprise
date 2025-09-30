import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc/init";
import { db } from "@/lib/db";

// Auto-generate unique collection prefix
const generateUniquePrefix = async (collectionName: string): Promise<string> => {
  // Get all existing prefixes
  const existingCollections = await db.collections.findMany({
    select: { prefix: true },
  });
  const existingPrefixes = existingCollections
    .map((c: { prefix?: string | null }) => c.prefix)
    .filter((p): p is string => Boolean(p))
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
  // Collection Management
  getAllCollections: publicProcedure.query(async () => {
    const collections = await db.collections.findMany({
      orderBy: { name: "asc" },
    });

    // Return collections with mock material counts for now
    const collectionsWithCounts = collections.map((collection: { material_counts?: { fabrics: number; woods: number; metals: number; stones: number; weaving: number; carving: number } }) => ({
      ...collection,
      material_counts: {
        fabrics: 0,
        woods: 0,
        metals: 0,
        stones: 0,
        weaving: 0,
        carving: 0,
      },
    }));

    return collectionsWithCounts;
  }),

  // Add Collection
  createCollection: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Auto-generate unique prefix
      const autoPrefix = await generateUniquePrefix(input.name);

      return await db.collections.create({
        data: {
          name: input.name,
          description: input.description,
          prefix: autoPrefix,
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
      })
    )
    .mutation(async ({ input }) => {
      return await db.collections.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
        },
      });
    }),

  // Delete Collection
  deleteCollection: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await db.collections.delete({
        where: { id: input.id },
      });
    }),

  // Fabric Brand Management
  getAllFabricBrands: publicProcedure.query(async () => {
    return await db.fabric_brands.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
  }),

  getCollectionsForFabricBrand: publicProcedure
    .input(z.object({ fabricBrandId: z.string() }))
    .query(async ({ input }) => {
      const assignments = await db.fabric_brand_collections.findMany({
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
    .mutation(async ({ input }) => {
      return await db.fabric_brand_collections.create({
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
    .mutation(async ({ input }) => {
      return await db.fabric_brand_collections.deleteMany({
        where: {
          fabric_brand_id: input.fabricBrandId,
          collection_id: input.collectionId,
        },
      });
    }),

  // Material Categories Management
  getMaterialCategories: publicProcedure.query(async () => {
    return await db.material_categories.findMany({
      where: { active: true },
      orderBy: { sort_order: "asc" },
    });
  }),

  // Materials Management
  getAllMaterials: publicProcedure.query(async () => {
    const materials = await db.materials.findMany({
      where: { active: true },
      include: {
        material_categories: true,
        parent_material: {
          select: {
            id: true,
            name: true,
            hierarchy_path: true,
            type: true,
          },
        },
        child_materials: {
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
    });

    return materials.map((material: { material_collections: { collections: unknown }[] }) => ({
      ...material,
      collections: material.material_collections.map(
        (mc: { collections: unknown }) => mc.collections
      ),
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
      })
    )
    .mutation(async ({ input }) => {
      const { collection_ids, parent_material_id, ...materialData } = input;

      // Validate parent and collection inheritance
      if (parent_material_id) {
        const parent = await db.materials.findUnique({
          where: { id: parent_material_id },
          include: {
            material_collections: true,
          },
        });

        if (!parent) {
          throw new Error('Parent material not found');
        }

        // Validate collection inheritance
        if (collection_ids && collection_ids.length > 0) {
          const parentCollectionIds = parent.material_collections.map((mc: { collection_id: string }) => mc.collection_id);

          if (parentCollectionIds.length > 0) {
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
        const parent = await db.materials.findUnique({
          where: { id: parent_material_id },
          include: { material_collections: false },
        });
        if (parent?.hierarchy_path) {
          hierarchy_path = `${parent.hierarchy_path}/${materialData.name}`;
        }
      }

      // Create material
      const material = await db.materials.create({
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
        // Note: parent_material_id is immutable, not included
      })
    )
    .mutation(async ({ input }) => {
      const { id, collection_ids, name, ...updateData } = input;

      const existingMaterial = await db.materials.findUnique({
        where: { id },
        include: {
          parent_material: {
            include: {
              material_collections: true,
            },
          },
        },
      });

      if (!existingMaterial) {
        throw new Error('Material not found');
      }

      // Validate collection inheritance
      if (collection_ids && existingMaterial.parent_material) {
        const parentCollectionIds = existingMaterial.parent_material.material_collections.map(
          (mc: { collection_id: string }) => mc.collection_id
        );

        if (parentCollectionIds.length > 0 && collection_ids.length > 0) {
          const invalidIds = collection_ids.filter((fcId: string) => !parentCollectionIds.includes(fcId));
          if (invalidIds.length > 0) {
            throw new Error('Material cannot be available in collections that parent is not available in');
          }
        }
      }

      // Calculate new hierarchy_path if name changed
      let hierarchy_path = existingMaterial.hierarchy_path;
      if (name !== existingMaterial.name) {
        if (existingMaterial.parent_material?.hierarchy_path) {
          hierarchy_path = `${existingMaterial.parent_material.hierarchy_path}/${name}`;
        } else {
          hierarchy_path = name;
        }
      }

      return await db.materials.update({
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
    .mutation(async ({ input }) => {
      // Check for child materials
      const childCount = await db.materials.count({
        where: { parent_material_id: input.id },
      });

      if (childCount > 0) {
        const children = await db.materials.findMany({
          where: { parent_material_id: input.id },
          select: { name: true, type: true },
        });

        throw new Error(
          `Cannot delete material with ${childCount} child materials: ${children.map((c: { name: string }) => c.name).join(', ')}`
        );
      }

      return await db.materials.delete({
        where: { id: input.id },
      });
    }),

  getChildMaterials: publicProcedure
    .input(z.object({
      parentId: z.string(),
      includeInactive: z.boolean().optional().default(false),
    }))
    .query(async ({ input }) => {
      return await db.materials.findMany({
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
    .query(async ({ input }) => {
      const materials = await db.materials.findMany({
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
          parent_material: {
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

      return materials.map((material: { material_collections: { collections: unknown }[] }) => ({
        ...material,
        collections: material.material_collections.map(
          (mc: { collections: unknown }) => mc.collections
        ),
      }));
    }),

  // Material-Collection Relationships
  assignMaterialToCollection: publicProcedure
    .input(z.object({
      materialId: z.string(),
      collectionId: z.string(),
    }))
    .mutation(async ({ input }) => {
      return await db.material_collections.create({
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
    .mutation(async ({ input }) => {
      return await db.material_collections.deleteMany({
        where: {
          material_id: input.materialId,
          collection_id: input.collectionId,
        },
      });
    }),

  // Filtered Material Queries (for Order Creation)
  getFilteredFabricBrands: publicProcedure
    .input(z.object({ collection_id: z.string() }))
    .query(async ({ input }) => {
      const brands = await db.fabric_brand_collections.findMany({
        where: { collection_id: input.collection_id },
        include: {
          fabric_brands: {
            where: { active: true },
          },
        },
      });
      return brands.map((item: { fabric_brands: unknown }) => item.fabric_brands).filter(Boolean);
    }),

  getFilteredWoodTypes: publicProcedure
    .input(z.object({ collection_id: z.string() }))
    .query(async ({ input }) => {
      // Get materials that are assigned to this collection and are wood type
      const materials = await db.material_collections.findMany({
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
        .map((item: { materials: { material_categories?: { name?: string } } }) => item.materials)
        .filter((material: { material_categories?: { name?: string } }) => material.material_categories?.name?.toLowerCase().includes('wood'));

      return woodMaterials;
    }),

  getFilteredMetalTypes: publicProcedure
    .input(z.object({ collection_id: z.string() }))
    .query(async ({ input }) => {
      // Get materials that are assigned to this collection and are metal type
      const materials = await db.material_collections.findMany({
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
        .map((item: { materials: { material_categories?: { name?: string } } }) => item.materials)
        .filter((material: { material_categories?: { name?: string } }) => material.material_categories?.name?.toLowerCase().includes('metal'));

      return metalMaterials;
    }),
});
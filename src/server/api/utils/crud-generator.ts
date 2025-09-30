import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc/init';
import type { Prisma } from '@prisma/client';

interface CrudOptions<_T> {
  name: string;
  model: keyof Prisma.ModelName;
  createSchema?: z.ZodSchema<any>;
  updateSchema?: z.ZodSchema<any>;
  defaultOrderBy?: Record<string, 'asc' | 'desc'>;
  defaultInclude?: Record<string, boolean | object>;
  searchFields?: string[];
  protect?: boolean; // Use protected procedures instead of public
}

/**
 * Generate a complete CRUD router for any Prisma model
 * Provides: getAll, getById, search, create, update, delete
 */
export function createCrudRouter<_T>(options: CrudOptions<_T>) {
  const {
    name,
    model,
    createSchema,
    updateSchema,
    defaultOrderBy = { created_at: 'desc' },
    defaultInclude = {},
    searchFields = ['name'],
    protect = false,
  } = options;

  const procedure = protect ? protectedProcedure : publicProcedure;
  
  // Pagination schema - all fields optional with defaults
  const paginationSchema = z.object({
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0),
    orderBy: z.record(z.enum(['asc', 'desc'])).optional(),
    include: z.record(z.boolean()).optional(),
  }).partial().default({ limit: 20, offset: 0 });

  return createTRPCRouter({
    // Get all with pagination
    getAll: procedure
      .input(paginationSchema)
      .query(async ({ ctx, input }) => {
        const { limit = 20, offset = 0, orderBy, include } = input;

        // Type-safe model access with explicit any for dynamic access
        const modelAccess = (ctx.db as any)[model as string];
        const [items, total] = await ctx.db.$transaction([
          modelAccess.findMany({
            take: limit,
            skip: offset,
            orderBy: orderBy || defaultOrderBy,
            include: include || defaultInclude,
          }),
          modelAccess.count(),
        ]) as [any[], number];

        return {
          items,
          total,
          hasMore: offset + limit < total,
          nextOffset: offset + limit < total ? offset + limit : null,
        };
      }),

    // Get by ID
    getById: procedure
      .input(z.object({ 
        id: z.string().uuid(),
        include: z.record(z.boolean()).optional(),
      }))
      .query(async ({ ctx, input }) => {
        // Type-safe model access with explicit any for dynamic access
        const modelAccess = (ctx.db as any)[model as string];
        const item = await modelAccess.findUnique({
          where: { id: input.id },
          include: input.include || defaultInclude,
        });
        
        if (!item) {
          throw new Error(`${name} not found`);
        }
        
        return item;
      }),

    // Search
    search: procedure
      .input(z.object({
        query: z.string(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ ctx, input }) => {
        const { query, limit, offset } = input;
        
        // Build OR conditions for search fields
        const searchConditions = searchFields.map(field => ({
          [field]: {
            contains: query,
            mode: 'insensitive' as const,
          },
        }));
        
        // Type-safe model access with explicit any for dynamic access
        const modelAccess = (ctx.db as any)[model as string];
        const [items, total] = await ctx.db.$transaction([
          modelAccess.findMany({
            where: {
              OR: searchConditions,
            },
            take: limit,
            skip: offset,
            orderBy: defaultOrderBy,
            include: defaultInclude,
          }),
          modelAccess.count({
            where: {
              OR: searchConditions,
            },
          }),
        ]) as [any[], number];
        
        return {
          items,
          total,
          hasMore: offset + limit < total,
          query,
        };
      }),

    // Create
    create: procedure
      .input(createSchema || z.object({}))
      .mutation(async ({ ctx, input }) => {
        // Type-safe model access with explicit any for dynamic access
        const modelAccess = (ctx.db as any)[model as string];
        const item = await modelAccess.create({
          data: {
            ...input,
            created_at: new Date(),
            updated_at: new Date(),
          },
          include: defaultInclude,
        });
        
        return item;
      }),

    // Update
    update: procedure
      .input(z.object({
        id: z.string().uuid(),
        data: updateSchema || z.object({}),
      }))
      .mutation(async ({ ctx, input }) => {
        // Type-safe model access with explicit any for dynamic access
        const modelAccess = (ctx.db as any)[model as string];
        const item = await modelAccess.update({
          where: { id: input.id },
          data: {
            ...input.data,
            updated_at: new Date(),
          },
          include: defaultInclude,
        });
        
        return item;
      }),

    // Delete
    delete: procedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        // Type-safe model access with explicit any for dynamic access
        const modelAccess = (ctx.db as any)[model as string];
        await modelAccess.delete({
          where: { id: input.id },
        });
        
        return { success: true, id: input.id };
      }),

    // Bulk operations
    createMany: procedure
      .input(z.object({
        data: z.array(createSchema || z.object({})),
      }))
      .mutation(async ({ ctx, input }) => {
        // Type-safe model access with explicit any for dynamic access
        const modelAccess = (ctx.db as any)[model as string];
        const result = await modelAccess.createMany({
          data: input.data.map((item: any) => ({
            ...item,
            created_at: new Date(),
            updated_at: new Date(),
          })),
        });
        
        return result;
      }),

    deleteMany: procedure
      .input(z.object({
        ids: z.array(z.string().uuid()),
      }))
      .mutation(async ({ ctx, input }) => {
        // Type-safe model access with explicit any for dynamic access
        const modelAccess = (ctx.db as any)[model as string];
        const result = await modelAccess.deleteMany({
          where: {
            id: { in: input.ids },
          },
        });
        
        return { success: true, count: result.count };
      }),
  });
}

import { z } from 'zod';
import { createCrudRouter } from '../utils/crud-generator';
import { createTRPCRouter, publicProcedure } from '../trpc/init';

// Client Schema (using preferred terminology)
const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  type: z.enum(['prospect', 'client', 'vip']).default('prospect'),
  status: z.enum(['active', 'inactive', 'suspended']).default('active'),
  address: z.record(z.any()).optional(),
  billing_address: z.record(z.any()).optional(),
  shipping_address: z.record(z.any()).optional(),
  credit_limit: z.number().optional(),
  payment_terms: z.string().optional(),
  tax_id: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  portal_access_enabled: z.boolean().default(false),
  portal_password_hash: z.string().optional(),
});

const updateClientSchema = createClientSchema.partial();

// Generate base CRUD - Using 'customers' table (clients is a view)
const baseClientsRouter = createCrudRouter({
  name: 'Client',
  model: 'customers' as any, // Uses the actual customers table
  createSchema: createClientSchema,
  updateSchema: updateClientSchema,
  searchFields: ['name', 'email', 'company'],
  defaultInclude: {
    projects: {
      select: {
        id: true,
        name: true,
        status: true,
      },
    },
    orders: {
      take: 5,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        order_number: true,
        status: true,
        created_at: true,
      },
    },
  },
});

// Extend with custom operations
export const clientsRouter = createTRPCRouter({
  ...baseClientsRouter._def.procedures,
  
  // Get clients with order statistics
  getWithStats: publicProcedure
    .input(z.object({
      clientId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const client = await ctx.db.customers.findUnique({
        where: { id: input.clientId },
        include: {
          projects: true,
          orders: true,
          _count: {
            select: {
              orders: true,
              projects: true,
            },
          },
        },
      });
      
      if (!client) {
        throw new Error('Client not found');
      }
      
      // Calculate total order value (handle case where orders might not be included)
      const orders = (client as any).orders || [];
      const totalOrderValue = orders.reduce((sum: number, order: any) => {
        const value = (order.metadata as any)?.total_value || 0;
        return sum + value;
      }, 0);

      return {
        ...client,
        stats: {
          totalOrders: (client as any)._count?.orders || 0,
          totalProjects: (client as any)._count?.projects || 0,
          totalOrderValue,
          averageOrderValue: ((client as any)._count?.orders || 0) > 0
            ? totalOrderValue / ((client as any)._count?.orders || 1)
            : 0,
        },
      };
    }),
  
  // Get clients by type
  getByType: publicProcedure
    .input(z.object({
      type: z.enum(['prospect', 'client', 'vip']),
      includeInactive: z.boolean().default(false),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {
        type: input.type,
      };
      
      if (!input.includeInactive) {
        where.status = 'active';
      }
      
      return ctx.db.customers.findMany({
        where,
        orderBy: { created_at: 'desc' },
        include: {
          _count: {
            select: {
              orders: true,
              projects: true,
            },
          },
        },
      });
    }),
});

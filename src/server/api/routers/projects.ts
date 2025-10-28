import { z } from 'zod';
import { createCrudRouter } from '../utils/crud-generator';
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc/init';

// Project Schema
const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  customer_id: z.string().uuid(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).default('planning'),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  budget: z.number().optional(),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  metadata: z.record(z.any()).optional(),
});

const updateProjectSchema = createProjectSchema.partial().extend({
  shipping_address_id: z.string().uuid().nullish(),
});

// Generate base CRUD for projects
const baseProjectsRouter = createCrudRouter({
  name: 'Project',
  model: 'projects' as any,
  createSchema: createProjectSchema,
  updateSchema: updateProjectSchema,
  searchFields: ['name', 'description'],
  defaultInclude: {
    customers: {
      select: {
        id: true,
        name: true,
        email: true,
        type: true,
      },
    },
  },
});

// Extend with custom operations
export const projectsRouter = createTRPCRouter({
  ...baseProjectsRouter._def.procedures,

  // Override getById to include all related data for detail page
  getById: publicProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.projects.findUnique({
        where: { id: input.id },
        include: {
          customers: {
            select: {
              id: true,
              name: true,
              first_name: true,
              last_name: true,
              email: true,
              phone: true,
              company: true,
              status: true,
            },
          },
        },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Get customer addresses for shipping address selection
      const customerAddresses = project.customer_id ? await ctx.db.addresses.findMany({
        where: { customer_id: project.customer_id },
        orderBy: [
          { is_primary: 'desc' },
          { created_at: 'desc' },
        ],
        take: 50, // Reasonable limit - customers rarely have > 50 addresses
      }) : [];

      // Get orders related to this project
      const orders = await ctx.db.orders.findMany({
        where: { project_id: input.id },
        include: {
          order_items: true,
          customers: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: 500, // Reasonable limit - projects rarely have > 500 orders
      });

      // Get all ordered items from these orders
      const orderIds = orders.map(o => o.id);
      const orderedItems = orderIds.length > 0 ? await ctx.db.order_items.findMany({
        where: { order_id: { in: orderIds } },
        orderBy: { created_at: 'desc' },
        take: 2000, // Reasonable limit for order items
      }) : [];

      // Calculate analytics
      const totalOrderValue = orders.reduce((sum, order) => {
        return sum + (order.total_amount ? Number(order.total_amount) : 0);
      }, 0);

      const analytics = {
        totalOrders: orders.length,
        totalOrderValue,
        totalItems: orderedItems.length,
      };

      return {
        project,
        customer: (project as any).customers,
        customerAddresses,
        orders,
        orderedItems,
        analytics,
      };
    }),

  // Get project with full details including orders
  getWithOrders: publicProcedure
    .input(z.object({
      projectId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.projects.findUnique({
        where: { id: input.projectId },
        include: {
          customers: true,
          orders: {
            include: {
              order_items: true,
              customers: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Calculate project metrics from orders
      const orders = (project as any).orders || [];
      const totalSpent = orders.reduce((sum: number, order: any) => {
        return sum + (order.total_amount ? Number(order.total_amount) : 0);
      }, 0);
      const budgetRemaining = project.budget ?
        Number(project.budget) - totalSpent : null;

      return {
        ...project,
        metrics: {
          totalOrders: orders.length,
          totalSpent,
          budgetRemaining,
          budgetUsedPercentage: project.budget ?
            (totalSpent / Number(project.budget)) * 100 : null,
        },
      };
    }),

  // Get projects by customer
  getByCustomer: publicProcedure
    .input(z.object({
      customerId: z.string().uuid(),
      includeOrders: z.boolean().default(false),
    }))
    .query(async ({ ctx, input }) => {
      const projects = await ctx.db.projects.findMany({
        where: { customer_id: input.customerId },
        include: input.includeOrders ? {
          orders: {
            select: {
              id: true,
              order_number: true,
              status: true,
              total_amount: true,
              created_at: true,
            },
            take: 100, // Limit orders per project when included
          },
        } : undefined,
        orderBy: { created_at: 'desc' },
        take: 200, // Reasonable limit - customers rarely have > 200 projects
      });

      return projects;
    }),

  // Get project health status
  getProjectHealth: publicProcedure
    .input(z.object({
      projectId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.projects.findUnique({
        where: { id: input.projectId },
        include: {
          orders: {
            where: {
              status: {
                notIn: ['cancelled', 'draft'],
              },
            },
          },
        },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Calculate total spent from orders
      const orders = (project as any).orders || [];
      const totalSpent = orders.reduce((sum: number, order: any) => {
        return sum + (order.total_amount ? Number(order.total_amount) : 0);
      }, 0);
      
      const now = new Date();
      const endDate = project.end_date ? new Date(project.end_date) : null;
      const daysRemaining = endDate ? 
        Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

      let healthStatus = 'healthy';
      if (project.budget && totalSpent > Number(project.budget) * 1.1) {
        healthStatus = 'over_budget';
      } else if (project.budget && totalSpent > Number(project.budget) * 0.9) {
        healthStatus = 'near_budget';
      } else if (endDate && endDate < now) {
        healthStatus = 'overdue';
      } else if (daysRemaining && daysRemaining < 7) {
        healthStatus = 'ending_soon';
      }

      return {
        projectId: project.id,
        projectName: project.name,
        healthStatus,
        budget: project.budget,
        totalSpent,
        budgetUsedPercentage: project.budget ?
          (totalSpent / Number(project.budget)) * 100 : null,
        daysRemaining,
        orderCount: orders.length,
      };
    }),

  // Create project with initial order
  createWithOrder: protectedProcedure
    .input(z.object({
      project: createProjectSchema,
      order: z.object({
        order_type: z.string().optional(),
        priority: z.string().optional(),
        notes: z.string().optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Use transaction to ensure both are created or neither
      const result = await ctx.db.$transaction(async (tx) => {
        // Create project
        const project = await tx.projects.create({
          data: {
            ...input.project,
            user_id: ctx.session?.user?.id || input.project.customer_id, // Use session user or customer as fallback
            created_by: ctx.session?.user?.id || input.project.customer_id,
          },
        });

        // Create initial order if requested
        let order: any = null;
        if (input.order) {
          order = await tx.orders.create({
            data: {
              customer_id: input.project.customer_id,
              project_id: project.id,
              ...input.order,
              status: 'draft',
            },
          });
        }

        return { project, order };
      });

      return result;
    }),
});
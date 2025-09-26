import { z } from 'zod';
import { createCrudRouter } from '../utils/crud-generator';
import { createTRPCRouter, publicProcedure } from '../trpc/init';

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

const updateProjectSchema = createProjectSchema.partial();

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
          // TODO: Add orders relationship when project_id field is restored to orders table
          // orders: {
          //   include: {
          //     order_items: {
          //       include: {
          //         items: true,
          //       },
          //     },
          //   },
          // },
        },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Calculate project metrics
      // TODO: Add orders relationship when project_id field is restored to orders table
      const orders: any[] = []; // Empty array since orders relationship is not available
      const totalSpent = 0; // Will be calculated when orders relationship is restored
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
        // TODO: Add orders relationship when project_id field is restored to orders table
        // include: input.includeOrders ? {
        //   orders: {
        //     select: {
        //       id: true,
        //       order_number: true,
        //       status: true,
        //       total_amount: true,
        //       created_at: true,
        //     },
        //   },
        // } : undefined,
        orderBy: { created_at: 'desc' },
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
        // TODO: Add orders relationship when project_id field is restored to orders table
        // include: {
        //   orders: {
        //     where: {
        //       status: {
        //         notIn: ['cancelled', 'draft'],
        //       },
        //     },
        //   },
        // },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // TODO: Calculate from orders when project_id field is restored to orders table
      const totalSpent = 0; // Will be calculated when orders relationship is restored
      
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
        orderCount: 0, // TODO: Calculate from orders when project_id field is restored
      };
    }),

  // Create project with initial order
  createWithOrder: publicProcedure
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
        let order = null;
        if (input.order) {
          order = await tx.orders.create({
            data: {
              customer_id: input.project.customer_id,
              // TODO: Add project_id when project_id field is restored to orders table
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
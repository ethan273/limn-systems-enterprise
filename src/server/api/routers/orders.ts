import { z } from 'zod';
import { createCrudRouter } from '../utils/crud-generator';
import { createTRPCRouter, publicProcedure } from '../trpc/init';
import { getSupabaseAdmin } from '@/lib/supabase';
import { generateProjectSku } from '@/lib/utils/project-sku-generator';
import { generateFullSku } from '@/lib/utils/full-sku-generator';
import { createFullName } from '@/lib/utils/name-utils';

// Order Schema
const createOrderSchema = z.object({
  customer_id: z.string().uuid(),
  project_id: z.string().uuid(), // Now required - every order must belong to a project
  collection_id: z.string().uuid().optional(),
  order_type: z.enum(['standard', 'custom', 'rush']).default('standard'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  status: z.enum(['draft', 'pending', 'confirmed', 'in_production', 'quality_check',
                  'ready_to_ship', 'shipped', 'delivered', 'completed', 'cancelled'])
    .default('pending'),
  payment_status: z.enum(['pending', 'partial', 'paid', 'refunded']).default('pending'),
  currency: z.string().default('USD'),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const updateOrderSchema = createOrderSchema.partial();

// Generate base CRUD
const baseOrdersRouter = createCrudRouter({
  name: 'Order',
  model: 'orders' as any,
  createSchema: createOrderSchema,
  updateSchema: updateOrderSchema,
  searchFields: ['order_number'],
  defaultInclude: {
    customers: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
    projects: {
      select: {
        id: true,
        name: true,
        status: true,
        budget: true,
      },
    },
    order_items: {
      include: {
        items: {
          select: {
            id: true,
            name: true,
            sku_full: true,
          },
        },
      },
    },
  },
});

// Extend with custom operations
export const ordersRouter = createTRPCRouter({
  ...baseOrdersRouter._def.procedures,

  /**
   * Get all orders with filters and CURSOR-BASED pagination
   * ✅ PHASE 5: Optimized cursor pagination for scalability
   * Consistent O(1) performance regardless of page number
   */
  getAllCursor: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        customerId: z.string().uuid().optional(),
        projectId: z.string().uuid().optional(),
        status: z.string().optional(),
        priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
        cursor: z.string().uuid().optional(), // Last order ID from previous page
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit, ...filters } = input;

      const where: any = {};

      // Apply filters
      // Note: Using toLowerCase to avoid Prisma/PostgreSQL compatibility issues with mode: 'insensitive'
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        where.OR = [
          { order_number: { contains: searchLower } },
          { notes: { contains: searchLower } },
        ];
      }

      if (filters.customerId) {
        where.customer_id = filters.customerId;
      }

      if (filters.projectId) {
        where.project_id = filters.projectId;
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.priority) {
        where.priority = filters.priority;
      }

      // Fetch limit + 1 to check if there's a next page
      const items = await ctx.db.orders.findMany({
        where,
        take: limit + 1,

        // Use cursor for pagination (O(1) performance)
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1, // Skip the cursor itself
        }),

        // IMPORTANT: Order by indexed column for performance
        orderBy: {
          created_at: 'desc',
        },

        include: {
          customers: {
            select: {
              id: true,
              name: true,
              company_name: true,
              email: true,
            },
          },
          projects: {
            select: {
              id: true,
              name: true,
              status: true,
              budget: true,
            },
          },
          order_items: {
            select: {
              id: true,
              quantity: true,
              unit_price: true,
              project_sku: true,
              description: true,
            },
          },
        },
      });

      // Check if there are more items
      let nextCursor: string | undefined = undefined;

      if (items.length > limit) {
        const nextItem = items.pop(); // Remove the extra item
        nextCursor = nextItem!.id;
      }

      return {
        items,
        nextCursor, // Frontend uses this to fetch next page
      };
    }),

  // Get orders by project
  getByProject: publicProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      includeItems: z.boolean().default(false),
    }))
    .query(async ({ ctx, input }) => {
      const orders = await ctx.db.orders.findMany({
        where: { project_id: input.projectId },
        include: {
          customers: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          order_items: input.includeItems ? {
            include: {
              items: true,
            },
          } : false,
        },
        orderBy: { created_at: 'desc' },
      });

      // Calculate totals
      const summary = {
        totalOrders: orders.length,
        totalAmount: orders.reduce((sum, order) =>
          sum + (Number(order.total_amount) || 0), 0
        ),
        byStatus: orders.reduce((acc, order) => {
          acc[order.status as string] = (acc[order.status as string] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };

      return { orders, summary };
    }),

  // Create order with automatic project assignment
  createWithAutoProject: publicProcedure
    .input(z.object({
      customer_id: z.string().uuid(),
      project_id: z.string().uuid().optional(),
      order_data: createOrderSchema.omit({ customer_id: true, project_id: true }),
    }))
    .mutation(async ({ ctx, input }) => {
      let projectId = input.project_id;

      // If no project specified, find or create default project
      if (!projectId) {
        // Note: findFirst not supported by wrapper, using findMany
        const existingProject = (await ctx.db.projects.findMany({
          where: {
            customer_id: input.customer_id,
            status: { in: ['planning', 'active'] },
          },
          orderBy: { created_at: 'desc' },
          take: 1,
        }))[0];

        if (existingProject) {
          projectId = existingProject.id;
        } else {
          // Create a default project
          const customer = await ctx.db.customers.findUnique({
            where: { id: input.customer_id },
          });

          if (!customer) {
            throw new Error('Customer not found');
          }

          const customerName = createFullName(customer.first_name || '', customer.last_name || undefined);
          const newProject = await ctx.db.projects.create({
            data: {
              customer_id: input.customer_id,
              name: `${customerName} - New Project`,
              status: 'active',
              description: 'Auto-created project for new order',
              user_id: ctx.session?.user?.id || input.customer_id,
              created_by: ctx.session?.user?.id || input.customer_id,
            },
          });

          projectId = newProject.id;
        }
      }

      // Create the order
      const order = await ctx.db.orders.create({
        data: {
          ...input.order_data,
          customer_id: input.customer_id,
          project_id: projectId,
        },
        include: {
          customers: true,
          projects: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
      });

      return order;
    }),

  // Get order with full details
  getFullDetails: publicProcedure
    .input(z.object({
      orderId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.orders.findUnique({
        where: { id: input.orderId },
        include: {
          customers: true,
          projects: {
            include: {
              customers: true,
            },
          },
          order_items: {
            include: {
              items: {
                include: {
                  collections: true,
                },
              },
              order_item_materials: {
                include: {
                  materials: true,
                },
              },
            },
          },
          shipments: true,
          invoices: true,
        },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      return order;
    }),

  // Create order with order items (for project orders)
  createWithItems: publicProcedure
    .input(z.object({
      project_id: z.string().uuid(),
      customer_id: z.string().uuid(),
      collection_id: z.string().uuid().optional(),
      order_items: z.array(z.object({
        product_name: z.string(),
        product_sku: z.string(),
        project_sku: z.string(),
        base_sku: z.string(),
        quantity: z.number().min(1),
        unit_price: z.number().min(0),
        total_price: z.number().min(0),
        material_selections: z.record(z.string()),
        custom_specifications: z.string().optional(),
      })),
      notes: z.string().optional(),
      priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
    }))
    .mutation(async ({ ctx, input }) => {
      // Generate order number
      const orderCount = await ctx.db.orders.count();
      const orderNumber = `ORD-${(orderCount + 1).toString().padStart(6, '0')}`;

      // Calculate total amount
      const totalAmount = input.order_items.reduce((sum: number, item) => sum + item.total_price, 0);

      // Create the order
      const order = await ctx.db.orders.create({
        data: {
          order_number: orderNumber,
          customer_id: input.customer_id,
          collection_id: input.collection_id,
          status: 'pending',
          priority: input.priority,
          total_amount: totalAmount,
          notes: input.notes,
          created_by: ctx.session?.user?.id || 'system',
        },
      });

      // Create order items using Supabase admin client
      const supabase = getSupabaseAdmin();
      const createdItems: any[] = [];

      for (const item of input.order_items) {
        // Generate Full SKU from base SKU + material selections
        const fullSku = generateFullSku(item.base_sku, item.material_selections);

        const orderItemData = {
          order_id: order.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          project_sku: item.project_sku, // Store project SKU for order tracking
          full_sku: fullSku, // Store Full SKU for manufacturing and analytics
          description: item.product_name,
          specifications: {
            product_sku: item.product_sku,
            project_sku: item.project_sku,
            base_sku: item.base_sku,
            material_selections: item.material_selections,
            custom_specifications: item.custom_specifications,
          },
          status: 'pending',
        };

        const { data: orderItem, error } = await supabase
          .from('order_items')
          .insert(orderItemData as any)
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to create order item: ${error.message}`);
        }

        createdItems.push(orderItem);
      }

      // Return order with items
      return {
        order,
        order_items: createdItems,
        total_items: createdItems.length,
        total_amount: totalAmount,
      };
    }),

  // Update order status with validation
  updateStatus: publicProcedure
    .input(z.object({
      orderId: z.string().uuid(),
      status: z.enum(['draft', 'pending', 'confirmed', 'in_production', 
                      'quality_check', 'ready_to_ship', 'shipped', 
                      'delivered', 'completed', 'cancelled']),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Validate status transition
      const currentOrder = await ctx.db.orders.findUnique({
        where: { id: input.orderId },
      });

      if (!currentOrder) {
        throw new Error('Order not found');
      }

      // Define valid status transitions
      const validTransitions: Record<string, string[]> = {
        draft: ['pending', 'cancelled'],
        pending: ['confirmed', 'cancelled'],
        confirmed: ['in_production', 'cancelled'],
        in_production: ['quality_check', 'cancelled'],
        quality_check: ['ready_to_ship', 'in_production', 'cancelled'],
        ready_to_ship: ['shipped', 'cancelled'],
        shipped: ['delivered', 'cancelled'],
        delivered: ['completed'],
        completed: [], // No transitions from completed
        cancelled: [], // No transitions from cancelled
      };

      const allowedStatuses = validTransitions[currentOrder.status as keyof typeof validTransitions] || [];
      if (!allowedStatuses.includes(input.status)) {
        throw new Error(
          `Invalid status transition from ${currentOrder.status} to ${input.status}`
        );
      }

      // Update the order
      const updatedOrder = await ctx.db.orders.update({
        where: { id: input.orderId },
        data: {
          status: input.status,
          metadata: {
            ...(currentOrder.metadata as any || {}),
            statusHistory: [
              ...((currentOrder.metadata as any)?.statusHistory || []),
              {
                from: currentOrder.status,
                to: input.status,
                changedAt: new Date(),
                changedBy: ctx.session?.user?.id,
                notes: input.notes,
              },
            ],
          },
        },
        include: {
          customers: true,
          projects: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
      });

      return updatedOrder;
    }),

  // Generate Project SKU for order tracking
  generateProjectSku: publicProcedure
    .input(z.object({
      clientName: z.string(),
      projectName: z.string().nullable().optional(),
      orderId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const projectSku = await generateProjectSku(
        input.clientName,
        input.projectName,
        input.orderId
      );
      return { projectSku };
    }),

  // Get orders with production details, invoices, and payments
  getWithProductionDetails: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).optional().default(50),
      offset: z.number().min(0).optional().default(0),
      status: z.string().optional(),
      customer_id: z.string().uuid().optional(),
      project_id: z.string().uuid().optional(),
    }).optional().default({}))
    .query(async ({ ctx, input }) => {
      const orders = await ctx.db.orders.findMany({
        where: {
          ...(input.status && { status: input.status }),
          ...(input.customer_id && { customer_id: input.customer_id }),
        },
        include: {
          customers: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          projects: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
          order_items: {
            select: {
              id: true,
              quantity: true,
              unit_price: true,
              project_sku: true,
              description: true,
              specifications: true,
            },
          },
          production_orders: {
            select: {
              id: true,
              order_number: true,
              item_name: true,
              quantity: true,
              total_cost: true,
              status: true,
              deposit_paid: true,
              final_payment_paid: true,
            },
          },
          production_invoices: {
            include: {
              production_invoice_line_items: true,
              production_payments: {
                orderBy: { payment_date: 'desc' },
              },
            },
          },
        },
        take: input.limit,
        skip: input.offset,
        orderBy: { created_at: 'desc' },
      });

      return {
        items: orders,
        total: orders.length,
        hasMore: orders.length === input.limit,
      };
    }),
});
import { z } from 'zod';
import { createCrudRouter } from '../utils/crud-generator';
import { createTRPCRouter, publicProcedure } from '../trpc/init';
import { getSupabaseAdmin } from '@/lib/supabase';

// Order Schema
const createOrderSchema = z.object({
  customer_id: z.string().uuid(),
  project_id: z.string().uuid(), // Now required - every order must belong to a project
  collection_id: z.string().uuid().optional(),
  order_type: z.enum(['standard', 'custom', 'rush']).default('standard'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  status: z.enum(['draft', 'pending', 'confirmed', 'in_production', 'quality_check', 
                  'ready_to_ship', 'shipped', 'delivered', 'completed', 'cancelled'])
    .default('draft'),
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

  // Get orders by project
  // TODO: Re-implement getByProject when project_id field is added to orders table
  // getByProject: publicProcedure
  //   .input(z.object({
  //     projectId: z.string().uuid(),
  //     includeItems: z.boolean().default(false),
  //   }))
  //   .query(async ({ ctx, input }) => {
  //     const orders = await ctx.db.orders.findMany({
  //       where: { project_id: input.projectId },
  //       include: {
  //         customers: {
  //           select: {
  //             id: true,
  //             name: true,
  //             email: true,
  //           },
  //         },
  //         order_items: input.includeItems ? {
  //           include: {
  //             items: true,
  //           },
  //         } : false,
  //       },
  //       orderBy: { created_at: 'desc' },
  //     });
  //
  //     // Calculate totals
  //     const summary = {
  //       totalOrders: orders.length,
  //       totalAmount: orders.reduce((sum, order) =>
  //         sum + (Number(order.total_amount) || 0), 0
  //       ),
  //       byStatus: orders.reduce((acc, order) => {
  //         acc[order.status] = (acc[order.status] || 0) + 1;
  //         return acc;
  //       }, {} as Record<string, number>),
  //     };
  //
  //     return { orders, summary };
  //   }),

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
        const existingProject = await ctx.db.projects.findFirst({
          where: { 
            customer_id: input.customer_id,
            status: { in: ['planning', 'active'] },
          },
          orderBy: { created_at: 'desc' },
        });

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

          const newProject = await ctx.db.projects.create({
            data: {
              customer_id: input.customer_id,
              name: `${customer.name} - New Project`,
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
          // TODO: Add project_id when projects table relationship is restored
        },
        include: {
          customers: true,
          // TODO: Add projects include when projects table relationship is restored
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
          // TODO: Add projects relationship when projects table is restored
          // projects: {
          //   include: {
          //     customers: true,
          //   },
          // },
          order_items: {
            include: {
              items: {
                include: {
                  collections: true,
                },
              },
              // TODO: Fix order_item_materials relationship when materials schema is corrected
              // order_item_materials: {
              //   include: {
              //     materials: true,
              //   },
              // },
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
      const totalAmount = input.order_items.reduce((sum, item) => sum + item.total_price, 0);

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
        const orderItemData = {
          order_id: order.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          client_sku: item.project_sku, // Use project SKU as client SKU
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
          // TODO: Add projects include when projects table is restored
        },
      });

      return updatedOrder;
    }),
});
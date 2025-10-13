/**
 * Customer Portal tRPC Router
 * Phase 3: Customer Self-Service Portal
 *
 * CRITICAL SECURITY: All procedures enforce customer data isolation
 * Customers can ONLY access their own data
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc/init';
import type { Context } from '../trpc/context';
import { PrismaClient } from '@prisma/client';

// Use Prisma directly for portal (Phase 3) since hybrid db client doesn't have portal tables yet
const prisma = new PrismaClient();

/**
 * Portal Middleware - Enforces Customer Portal Access
 * Validates that user has active portal access and returns customerId
 */
const enforcePortalAccess = async (ctx: Context) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access the portal'
    });
  }

  // Check if user has active portal access
  const portalAccess = await prisma.customer_portal_access.findFirst({
    where: {
      user_id: ctx.session.user.id,
      is_active: true,
    },
    include: {
      customers: true,
    },
  });

  if (!portalAccess) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have access to the customer portal'
    });
  }

  // NOTE: last_login tracking removed from middleware for performance
  // Login tracking should happen at authentication time, not on every API call

  return {
    customerId: portalAccess.customer_id as string,
    customer: portalAccess.customers,
  };
};

/**
 * Unified Portal Access Middleware - Works for ALL portal types
 * Returns portal type, entity info, and permissions
 */
const enforcePortalAccessByType = async (ctx: Context, requiredType?: string) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access the portal'
    });
  }

  // Check if user has active portal access
  const portalAccess = await prisma.customer_portal_access.findFirst({
    where: {
      user_id: ctx.session.user.id,
      is_active: true,
      ...(requiredType && { portal_type: requiredType }),
    },
    include: {
      customers: true,
    },
  });

  if (!portalAccess) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `You do not have access to the ${requiredType || ''} portal`
    });
  }

  // NOTE: last_login tracking removed from middleware for performance
  // Login tracking should happen at authentication time, not on every API call

  // Load entity based on type
  let entity: any = null;
  if (portalAccess.entity_type === 'customer' && portalAccess.entity_id) {
    entity = await prisma.customers.findUnique({
      where: { id: portalAccess.entity_id },
    });
  } else if (portalAccess.entity_type === 'partner' && portalAccess.entity_id) {
    entity = await prisma.partners.findUnique({
      where: { id: portalAccess.entity_id },
    });
  } else if (portalAccess.entity_type === 'qc_tester' && portalAccess.entity_id) {
    entity = await prisma.qc_testers.findUnique({
      where: { id: portalAccess.entity_id },
    });
  } else if (portalAccess.customers) {
    // Fallback for backward compatibility
    entity = portalAccess.customers;
  }

  return {
    portalType: portalAccess.portal_type as string,
    entityType: portalAccess.entity_type as string,
    entityId: portalAccess.entity_id as string,
    entity,
    portalRole: portalAccess.portal_role as string,
    // Backward compatibility
    customerId: portalAccess.customer_id as string,
    customer: portalAccess.customers,
  };
};

/**
 * Portal Procedure - Protected procedure with portal access enforcement
 */
const portalProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const { customerId, customer } = await enforcePortalAccess(ctx);

  return next({
    ctx: {
      ...ctx,
      customerId,
      customer,
    },
  });
});

/**
 * Designer Portal Procedure - Enforces designer portal access
 */
const designerPortalProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const portalData = await enforcePortalAccessByType(ctx, 'designer');

  return next({
    ctx: {
      ...ctx,
      portalType: portalData.portalType,
      entityType: portalData.entityType,
      entityId: portalData.entityId,
      entity: portalData.entity,
      portalRole: portalData.portalRole,
    },
  });
});

/**
 * Factory Portal Procedure - Enforces factory portal access
 */
const factoryPortalProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const portalData = await enforcePortalAccessByType(ctx, 'factory');

  return next({
    ctx: {
      ...ctx,
      portalType: portalData.portalType,
      entityType: portalData.entityType,
      entityId: portalData.entityId,
      entity: portalData.entity,
      portalRole: portalData.portalRole,
    },
  });
});

/**
 * QC Portal Procedure - Enforces QC portal access
 */
const qcPortalProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const portalData = await enforcePortalAccessByType(ctx, 'qc');

  return next({
    ctx: {
      ...ctx,
      portalType: portalData.portalType,
      entityType: portalData.entityType,
      entityId: portalData.entityId,
      entity: portalData.entity,
      portalRole: portalData.portalRole,
    },
  });
});

/**
 * Customer Portal Router
 */
export const portalRouter = createTRPCRouter({
  // ============================================
  // Portal Access & Settings
  // ============================================

  /**
   * Get Portal Access Information
   */
  getPortalAccess: portalProcedure
    .query(async ({ ctx }) => {
      const access = await prisma.customer_portal_access.findFirst({
        where: {
          user_id: ctx.session.user.id,
          is_active: true,
        },
        include: {
          customers: true,
        },
      });

      return access;
    }),

  /**
   * Get Portal Settings
   * NOTE: Uses protectedProcedure (not portalProcedure) since it handles all portal types
   */
  getPortalSettings: protectedProcedure
    .query(async ({ ctx }) => {
      // Determine portal type from portal access (default to 'customer' for backward compatibility)
      const portalAccess = await prisma.customer_portal_access.findFirst({
        where: {
          user_id: ctx.session.user.id,
          is_active: true,
        },
      });

      const portalType = portalAccess?.portal_type || 'customer';
      const entityId = portalAccess?.entity_id || portalAccess?.customer_id;

      // Fetch universal module settings from portal_module_settings table
      const moduleSettings = await prisma.portal_module_settings.findMany({
        where: {
          portal_type: portalType,
          entity_id: entityId || null,
        },
      });

      // Convert to module lookup object
      const modules: Record<string, boolean> = {};
      moduleSettings.forEach((s) => {
        modules[s.module_key] = s.is_enabled;
      });

      // For customer portal, also fetch legacy portal_settings for backward compatibility
      let legacySettings = null;
      if (portalType === 'customer' && ctx.customerId) {
        legacySettings = await prisma.portal_settings.findUnique({
          where: {
            customer_id: ctx.customerId,
          },
        });
      }

      // Return unified settings with backward compatibility
      return {
        // Legacy fields (backward compatibility)
        show_production_tracking: legacySettings?.show_production_tracking ?? modules.orders ?? true,
        show_financial_details: legacySettings?.show_financial_details ?? modules.financials ?? true,
        show_shipping_info: legacySettings?.show_shipping_info ?? modules.shipping ?? true,
        allow_document_upload: legacySettings?.allow_document_upload ?? false,
        allow_design_approval: legacySettings?.allow_design_approval ?? false,
        notification_preferences: legacySettings?.notification_preferences || {
          sms: false,
          email: true,
          in_app: true,
        },
        // New universal module system
        modules, // { orders: true, shipping: false, financials: true, ... }
        portalType, // 'customer', 'designer', 'factory', 'qc'
      };
    }),

  /**
   * Update Portal Settings (Notification Preferences)
   */
  updatePortalSettings: portalProcedure
    .input(z.object({
      notification_preferences: z.object({
        sms: z.boolean(),
        email: z.boolean(),
        in_app: z.boolean(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const settings = await prisma.portal_settings.upsert({
        where: {
          customer_id: ctx.customerId,
        },
        update: {
          notification_preferences: input.notification_preferences || undefined,
          updated_at: new Date(),
        },
        create: {
          customer_id: ctx.customerId,
          notification_preferences: input.notification_preferences || {
            sms: false,
            email: true,
            in_app: true,
          },
        },
      });

      return settings;
    }),

  // ============================================
  // User Data
  // ============================================

  /**
   * Get Current User Info (for display in UI)
   * NOTE: Uses protectedProcedure (not portalProcedure) since it only needs session data
   */
  getCurrentUser: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        id: ctx.session.user.id,
        email: ctx.session.user.email,
      };
    }),

  // ============================================
  // Dashboard Data
  // ============================================

  /**
   * Get Dashboard Stats
   */
  getDashboardStats: portalProcedure
    .query(async ({ ctx }) => {

      const [
        activeOrders,
        pendingPayments,
        recentShipments,
        documentsCount,
      ] = await Promise.all([
        // Active orders count - join through projects table
        prisma.production_orders.count({
          where: {
            projects: {
              customer_id: ctx.customerId,
            },
            status: {
              in: ['pending_deposit', 'in_production', 'ready_to_ship'],
            },
          },
        }),

        // Pending payments (unpaid invoices)
        prisma.production_invoices.count({
          where: {
            customer_id: ctx.customerId,
            status: {
              in: ['pending_payment', 'partially_paid'],
            },
          },
        }),

        // Recent shipments (last 30 days) - join through projects table
        prisma.shipments.count({
          where: {
            projects: {
              customer_id: ctx.customerId,
            },
            created_at: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),

        // Documents count
        prisma.documents.count({
          where: {
            customer_id: ctx.customerId,
          },
        }),
      ]);

      console.log('✅ [Portal] getDashboardStats completed');
      console.log('   Active Orders:', activeOrders);
      console.log('   Pending Payments:', pendingPayments);
      console.log('   Recent Shipments:', recentShipments);
      console.log('   Documents:', documentsCount);

      return {
        activeOrders,
        pendingPayments,
        recentShipments,
        documentsCount,
      };
    }),

  // ============================================
  // Notifications
  // ============================================

  /**
   * Get Notifications
   */
  getNotifications: portalProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      read: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Only customers have customer_notifications (designer/factory don't have customer_id)
      if (!ctx.customerId) {
        // Return empty notifications for non-customer portals
        return {
          notifications: [],
          total: 0,
          unreadCount: 0,
        };
      }

      const where = {
        customer_id: ctx.customerId,
        ...(input.read !== undefined && { read: input.read }),
      };

      const [notifications, total, unreadCount] = await Promise.all([
        prisma.customer_notifications.findMany({
          where,
          orderBy: {
            created_at: 'desc',
          },
          take: input.limit,
          skip: input.offset,
        }),
        prisma.customer_notifications.count({ where }),
        prisma.customer_notifications.count({
          where: {
            customer_id: ctx.customerId,
            read: false,
          },
        }),
      ]);

      return {
        notifications,
        total,
        unreadCount,
      };
    }),

  /**
   * Mark Notification as Read
   */
  markNotificationAsRead: portalProcedure
    .input(z.object({
      notificationId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify notification belongs to customer
      const notification = await prisma.customer_notifications.findFirst({
        where: {
          id: input.notificationId,
          customer_id: ctx.customerId,
        },
      });

      if (!notification) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Notification not found',
        });
      }

      return prisma.customer_notifications.update({
        where: { id: input.notificationId },
        data: {
          read: true,
          read_at: new Date(),
        },
      });
    }),

  /**
   * Mark All Notifications as Read
   */
  markAllNotificationsAsRead: portalProcedure
    .mutation(async ({ ctx }) => {
      const result = await prisma.customer_notifications.updateMany({
        where: {
          customer_id: ctx.customerId,
          read: false,
        },
        data: {
          read: true,
          read_at: new Date(),
        },
      });

      return { count: result.count };
    }),

  /**
   * Create Notification (Internal use)
   */
  createNotification: portalProcedure
    .input(z.object({
      type: z.enum(['order_update', 'payment_received', 'shipment_update', 'document_uploaded']),
      title: z.string().min(1).max(255),
      message: z.string().min(1),
      link: z.string().url().optional(),
      related_entity_type: z.enum(['production_order', 'invoice', 'shipment', 'document']).optional(),
      related_entity_id: z.string().uuid().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return prisma.customer_notifications.create({
        data: {
          user_id: ctx.session.user.id,
          customer_id: ctx.customerId,
          type: input.type,
          title: input.title,
          message: input.message,
          link: input.link,
          related_entity_type: input.related_entity_type,
          related_entity_id: input.related_entity_id,
        },
      });
    }),

  // ============================================
  // Shipping Addresses
  // ============================================

  /**
   * Get Shipping Addresses
   */
  getShippingAddresses: portalProcedure
    .query(async ({ ctx }) => {
      return prisma.customer_shipping_addresses.findMany({
        where: {
          customer_id: ctx.customerId,
          active: true,
        },
        orderBy: [
          { is_default: 'desc' },
          { created_at: 'desc' },
        ],
      });
    }),

  /**
   * Create Shipping Address
   */
  createShippingAddress: portalProcedure
    .input(z.object({
      label: z.string().min(1).max(100),
      recipient_name: z.string().min(1).max(255),
      address_line1: z.string().min(1).max(255),
      address_line2: z.string().max(255).optional(),
      city: z.string().min(1).max(100),
      state: z.string().min(2).max(50),
      postal_code: z.string().min(1).max(20),
      country: z.string().min(1).max(100).default('USA'),
      phone: z.string().max(20).optional(),
      is_default: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      // If setting as default, unset all other defaults
      if (input.is_default) {
        await prisma.customer_shipping_addresses.updateMany({
          where: {
            customer_id: ctx.customerId,
            is_default: true,
          },
          data: {
            is_default: false,
          },
        });
      }

      return prisma.customer_shipping_addresses.create({
        data: {
          customer_id: ctx.customerId,
          ...input,
        },
      });
    }),

  /**
   * Update Shipping Address
   */
  updateShippingAddress: portalProcedure
    .input(z.object({
      addressId: z.string().uuid(),
      label: z.string().min(1).max(100).optional(),
      recipient_name: z.string().min(1).max(255).optional(),
      address_line1: z.string().min(1).max(255).optional(),
      address_line2: z.string().max(255).optional(),
      city: z.string().min(1).max(100).optional(),
      state: z.string().min(2).max(50).optional(),
      postal_code: z.string().min(1).max(20).optional(),
      country: z.string().min(1).max(100).optional(),
      phone: z.string().max(20).optional(),
      is_default: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { addressId, ...updateData } = input;

      // Verify address belongs to customer
      const address = await prisma.customer_shipping_addresses.findFirst({
        where: {
          id: addressId,
          customer_id: ctx.customerId,
        },
      });

      if (!address) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Shipping address not found',
        });
      }

      // If setting as default, unset all other defaults
      if (input.is_default) {
        await prisma.customer_shipping_addresses.updateMany({
          where: {
            customer_id: ctx.customerId,
            is_default: true,
          },
          data: {
            is_default: false,
          },
        });
      }

      return prisma.customer_shipping_addresses.update({
        where: { id: addressId },
        data: updateData,
      });
    }),

  /**
   * Delete Shipping Address
   */
  deleteShippingAddress: portalProcedure
    .input(z.object({
      addressId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify address belongs to customer
      const address = await prisma.customer_shipping_addresses.findFirst({
        where: {
          id: input.addressId,
          customer_id: ctx.customerId,
        },
      });

      if (!address) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Shipping address not found',
        });
      }

      // Soft delete
      return prisma.customer_shipping_addresses.update({
        where: { id: input.addressId },
        data: {
          active: false,
        },
      });
    }),

  // ============================================
  // Customer Orders & Tracking (Week 21 Day 2)
  // ============================================

  /**
   * Get Customer Orders
   * Returns all production orders for the customer
   */
  getCustomerOrders: portalProcedure
    .input(z.object({
      status: z.enum(['pending', 'pending_deposit', 'in_production', 'ready_to_ship', 'shipped', 'delivered', 'all']).optional().default('all'),
      limit: z.number().min(1).max(100).optional().default(20),
      offset: z.number().min(0).optional().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {
        projects: {
          customer_id: ctx.customerId,
        },
      };

      if (input.status && input.status !== 'all') {
        where.status = input.status;
      }

      const [orders, total] = await Promise.all([
        prisma.production_orders.findMany({
          where,
          include: {
            projects: {
              select: {
                id: true,
                name: true,
              },
            },
            production_invoices: {
              select: {
                id: true,
                invoice_type: true,
                status: true,
                total: true,
                amount_due: true,
              },
            },
          },
          orderBy: {
            created_at: 'desc',
          },
          take: input.limit,
          skip: input.offset,
        }),
        prisma.production_orders.count({ where }),
      ]);

      return {
        orders,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  /**
   * Get Single Order Details
   */
  getOrderById: portalProcedure
    .input(z.object({
      orderId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const order = await prisma.production_orders.findFirst({
        where: {
          id: input.orderId,
          projects: {
            customer_id: ctx.customerId,
          },
        },
        include: {
          projects: true,
          production_invoices: {
            include: {
              production_payments: {
                orderBy: {
                  payment_date: 'desc',
                },
              },
            },
            orderBy: {
              created_at: 'asc',
            },
          },
        },
      });

      if (!order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order not found or you do not have permission to view it',
        });
      }

      return order;
    }),

  /**
   * Get Order Timeline
   * Returns milestone events for an order
   */
  getOrderTimeline: portalProcedure
    .input(z.object({
      orderId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      // Verify order belongs to customer
      const order = await prisma.production_orders.findFirst({
        where: {
          id: input.orderId,
          projects: {
            customer_id: ctx.customerId,
          },
        },
        include: {
          production_invoices: {
            include: {
              production_payments: true,
            },
          },
        },
      });

      if (!order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order not found',
        });
      }

      // Build timeline from order data
      const timeline: Array<{ date: Date | null; title: string; description: string; status: string; icon: string }> = [];

      // Order created
      timeline.push({
        date: order.order_date || order.created_at,
        title: 'Order Created',
        description: `Order ${order.order_number} was created`,
        status: 'completed',
        icon: 'check',
      });

      // Deposit invoice
      const depositInvoice = order.production_invoices?.find((inv: any) => inv.invoice_type === 'deposit');
      if (depositInvoice) {
        timeline.push({
          date: depositInvoice.created_at,
          title: 'Deposit Invoice Generated',
          description: `Invoice ${depositInvoice.invoice_number} for $${Number(depositInvoice.total).toFixed(2)}`,
          status: depositInvoice.status === 'paid' ? 'completed' : 'pending',
          icon: depositInvoice.status === 'paid' ? 'check' : 'clock',
        });

        if (depositInvoice.production_payments && depositInvoice.production_payments.length > 0) {
          timeline.push({
            date: depositInvoice.production_payments[0].payment_date,
            title: 'Deposit Paid',
            description: `Payment of $${Number(depositInvoice.production_payments[0].amount).toFixed(2)} received`,
            status: 'completed',
            icon: 'check',
          });
        }
      }

      // Production started
      if (order.production_start_date) {
        timeline.push({
          date: order.production_start_date,
          title: 'Production Started',
          description: 'Manufacturing in progress',
          status: 'completed',
          icon: 'check',
        });
      }

      // Final invoice
      const finalInvoice = order.production_invoices?.find((inv: any) => inv.invoice_type === 'final');
      if (finalInvoice) {
        timeline.push({
          date: finalInvoice.created_at,
          title: 'Final Invoice Generated',
          description: `Invoice ${finalInvoice.invoice_number} for $${Number(finalInvoice.total).toFixed(2)}`,
          status: finalInvoice.status === 'paid' ? 'completed' : 'pending',
          icon: finalInvoice.status === 'paid' ? 'check' : 'clock',
        });

        if (finalInvoice.production_payments && finalInvoice.production_payments.length > 0) {
          timeline.push({
            date: finalInvoice.production_payments[0].payment_date,
            title: 'Final Payment Received',
            description: `Payment of $${Number(finalInvoice.production_payments[0].amount).toFixed(2)} received`,
            status: 'completed',
            icon: 'check',
          });
        }
      }

      // Shipped
      if (order.shipped_date) {
        timeline.push({
          date: order.shipped_date,
          title: 'Shipped',
          description: 'Order has been shipped',
          status: 'completed',
          icon: 'check',
        });
      }

      // Delivered
      if (order.delivered_date) {
        timeline.push({
          date: order.delivered_date,
          title: 'Delivered',
          description: 'Order delivered successfully',
          status: 'completed',
          icon: 'check',
        });
      }

      // Sort by date
      timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return timeline;
    }),

  /**
   * Get Order Items
   * Returns items/products in an order
   */
  getOrderItems: portalProcedure
    .input(z.object({
      orderId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      // Verify order belongs to customer
      const order = await prisma.production_orders.findFirst({
        where: {
          id: input.orderId,
          projects: {
            customer_id: ctx.customerId,
          },
        },
        select: {
          id: true,
          item_name: true,
          quantity: true,
          total_cost: true,
        },
      });

      if (!order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order not found',
        });
      }

      // Return order as single item (production_orders don't have separate line items)
      return [{
        id: order.id,
        name: order.item_name,
        quantity: order.quantity,
        unitPrice: Number(order.total_cost) / (order.quantity || 1),
        total: Number(order.total_cost),
      }];
    }),

  /**
   * Get Production Status
   * Returns current production status and progress
   */
  getProductionStatus: portalProcedure
    .input(z.object({
      orderId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      // Verify order belongs to customer
      const order = await prisma.production_orders.findFirst({
        where: {
          id: input.orderId,
          projects: {
            customer_id: ctx.customerId,
          },
        },
      });

      if (!order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order not found',
        });
      }

      // Calculate progress percentage based on status
      let progress = 0;
      const statusMap: Record<string, number> = {
        'pending': 0,
        'awaiting_deposit': 10,
        'deposit_paid': 25,
        'in_progress': 50,
        'awaiting_final_payment': 75,
        'ready_to_ship': 90,
        'shipped': 95,
        'delivered': 100,
      };

      progress = statusMap[order.status] || 0;

      return {
        status: order.status,
        progress,
        productionStartDate: order.production_start_date,
        estimatedCompletionDate: order.estimated_completion_date,
        estimatedShipDate: order.estimated_ship_date,
        actualShipDate: order.shipped_date,
        actualDeliveryDate: order.delivered_date,
      };
    }),

  /**
   * Get Order Shipments
   */
  getOrderShipments: portalProcedure
    .input(z.object({
      orderId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      // Verify order belongs to customer and get project_id
      const order = await prisma.production_orders.findFirst({
        where: {
          id: input.orderId,
          projects: {
            customer_id: ctx.customerId,
          },
        },
        select: {
          id: true,
          project_id: true,
        },
      });

      if (!order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Order not found',
        });
      }

      // Get shipments via project_id (shipments link to projects, not production_orders)
      if (!order.project_id) {
        return [];
      }

      return prisma.shipments.findMany({
        where: {
          project_id: order.project_id,
        },
        orderBy: {
          created_at: 'desc',
        },
      });
    }),

  /**
   * Get Shipment Tracking
   */
  getShipmentTracking: portalProcedure
    .input(z.object({
      shipmentId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const shipment = await prisma.shipments.findFirst({
        where: {
          id: input.shipmentId,
          projects: {
            customer_id: ctx.customerId,
          },
        },
        include: {
          projects: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!shipment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Shipment not found',
        });
      }

      return {
        shipment,
        trackingEvents: shipment.tracking_events || [],
        estimatedDelivery: shipment.estimated_delivery,
        status: shipment.status,
      };
    }),

  /**
   * Get Customer Shipments
   * Returns all shipments for the customer's projects
   */
  getCustomerShipments: portalProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).optional().default(50),
      offset: z.number().min(0).optional().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const [shipments, total] = await Promise.all([
        prisma.shipments.findMany({
          where: {
            projects: {
              customer_id: ctx.customerId,
            },
          },
          orderBy: {
            created_at: 'desc',
          },
          take: input.limit,
          skip: input.offset,
        }),
        prisma.shipments.count({
          where: {
            projects: {
              customer_id: ctx.customerId,
            },
          },
        }),
      ]);

      return {
        shipments,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  // ============================================
  // Documents Management
  // ============================================

  /**
   * Get Customer Documents
   * Returns all documents for the customer's projects
   */
  getCustomerDocuments: portalProcedure
    .input(z.object({
      documentType: z.string().optional(),
      limit: z.number().min(1).max(100).optional().default(100),
      offset: z.number().min(0).optional().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {
        customer_id: ctx.customerId,
      };

      if (input.documentType) {
        where.type = input.documentType;
      }

      const [documents, total] = await Promise.all([
        prisma.documents.findMany({
          where,
          orderBy: {
            created_at: 'desc',
          },
          take: input.limit,
          skip: input.offset,
        }),
        prisma.documents.count({ where }),
      ]);

      return {
        documents,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  /**
   * Get Document By ID
   */
  getDocumentById: portalProcedure
    .input(z.object({
      documentId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const document = await prisma.documents.findFirst({
        where: {
          id: input.documentId,
          customer_id: ctx.customerId,
        },
      });

      if (!document) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Document not found',
        });
      }

      return document;
    }),

  /**
   * Get Customer Shop Drawings
   */
  getCustomerShopDrawings: portalProcedure
    .input(z.object({
      orderId: z.string().uuid().optional(),
      limit: z.number().min(1).max(100).optional().default(50),
      offset: z.number().min(0).optional().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {
        projects: {
          customer_id: ctx.customerId,
        },
      };

      if (input.orderId) {
        // Find production order's project
        const order = await prisma.production_orders.findFirst({
          where: {
            id: input.orderId,
            projects: { customer_id: ctx.customerId },
          },
          select: { project_id: true },
        });

        if (order?.project_id) {
          where.project_id = order.project_id;
        }
      }

      const [shopDrawings, total] = await Promise.all([
        prisma.shop_drawings.findMany({
          where,
          include: {
            production_orders: {
              select: {
                id: true,
                order_number: true,
                projects: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            created_at: 'desc',
          },
          take: input.limit,
          skip: input.offset,
        }),
        prisma.shop_drawings.count({ where }),
      ]);

      return {
        shopDrawings,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  // ============================================
  // Financials & Invoices
  // ============================================

  /**
   * Get Customer Invoices
   * Returns all production invoices for the customer
   */
  getCustomerInvoices: portalProcedure
    .input(z.object({
      status: z.string().optional(),
      limit: z.number().min(1).max(100).optional().default(100),
      offset: z.number().min(0).optional().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {
        customer_id: ctx.customerId,
      };

      if (input.status) {
        where.status = input.status;
      }

      const [invoices, total] = await Promise.all([
        prisma.production_invoices.findMany({
          where,
          include: {
            projects: {
              select: {
                id: true,
                name: true,
              },
            },
            production_payments: {
              orderBy: {
                payment_date: 'desc',
              },
            },
          },
          orderBy: {
            created_at: 'desc',
          },
          take: input.limit,
          skip: input.offset,
        }),
        prisma.production_invoices.count({ where }),
      ]);

      return {
        invoices,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  /**
   * Get Invoice By ID
   */
  getInvoiceById: portalProcedure
    .input(z.object({
      invoiceId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const invoice = await prisma.production_invoices.findFirst({
        where: {
          id: input.invoiceId,
          customer_id: ctx.customerId,
        },
        include: {
          projects: true,
          production_payments: {
            orderBy: {
              payment_date: 'desc',
            },
          },
        },
      });

      if (!invoice) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invoice not found',
        });
      }

      return invoice;
    }),

  // ============================================
  // Activity Logging
  // ============================================

  /**
   * Log Portal Activity
   */
  logActivity: portalProcedure
    .input(z.object({
      action: z.string().min(1).max(100),
      entity_type: z.string().max(50).optional(),
      entity_id: z.string().uuid().optional(),
      metadata: z.record(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return prisma.portal_activity_log.create({
        data: {
          customer_id: ctx.customerId,
          user_id: ctx.session.user.id,
          activity_type: input.action,
          description: `Customer portal: ${input.action}`,
          metadata: input.metadata || {},
        },
      });
    }),

  // ============================================
  // Profile Management
  // ============================================

  /**
   * Update Customer Profile
   * Allows customers to update their contact information
   */
  updateCustomerProfile: portalProcedure
    .input(z.object({
      name: z.string().min(1).max(255).optional(),
      email: z.string().email().optional(),
      phone: z.string().max(20).optional(),
      company_name: z.string().max(255).optional(),
      website: z.string().url().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify customer exists
      const customer = await prisma.customers.findUnique({
        where: { id: ctx.customerId },
      });

      if (!customer) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Customer profile not found',
        });
      }

      // Update customer record
      return prisma.customers.update({
        where: { id: ctx.customerId },
        data: {
          ...input,
          updated_at: new Date(),
        },
      });
    }),

  /**
   * Get Customer Profile
   * Returns full customer profile information
   */
  getCustomerProfile: portalProcedure
    .query(async ({ ctx }) => {
      const customer = await prisma.customers.findUnique({
        where: { id: ctx.customerId },
        include: {
          projects: {
            select: {
              id: true,
              name: true,
              status: true,
            },
            orderBy: {
              created_at: 'desc',
            },
            take: 5,
          },
        },
      });

      if (!customer) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Customer profile not found',
        });
      }

      return customer;
    }),

  // ============================================
  // QuickBooks Payment Integration
  // ============================================

  /**
   * Initiate QuickBooks Payment
   * Creates payment link for customer to pay invoice via QuickBooks
   */
  initiateQuickBooksPayment: portalProcedure
    .input(z.object({
      invoiceId: z.string().uuid(),
      amount: z.number().positive(),
      paymentMethod: z.enum(['credit_card', 'bank_transfer', 'ach']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify invoice belongs to customer
      const invoice = await prisma.production_invoices.findFirst({
        where: {
          id: input.invoiceId,
          customer_id: ctx.customerId,
        },
        include: {
          production_orders: {
            include: {
              projects: true,
            },
          },
        },
      });

      if (!invoice) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invoice not found or does not belong to your account',
        });
      }

      // Verify amount doesn't exceed amount due
      if (input.amount > Number(invoice.amount_due || 0)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Payment amount exceeds invoice balance',
        });
      }

      // Get QuickBooks connection (admin-configured)
      const qbConnection = await prisma.quickbooks_auth.findFirst({
        where: {
          is_active: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      if (!qbConnection) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'QuickBooks integration is not configured. Please contact support.',
        });
      }

      // Store payment method in metadata since there's no direct payment_method field
      const queueEntry = await prisma.quickbooks_payment_queue.create({
        data: {
          invoice_id: null, // No direct link to production_invoices in invoices table
          customer_id: ctx.customerId,
          amount: input.amount,
          status: 'pending',
          metadata: {
            production_invoice_id: input.invoiceId,
            payment_method: input.paymentMethod || 'credit_card',
          },
          created_at: new Date(),
        },
      });

      // Return payment initiation details
      return {
        queueId: queueEntry.id,
        invoiceNumber: invoice.invoice_number,
        amount: input.amount,
        status: 'pending',
        message: 'Payment initiated. You will receive a confirmation email shortly.',
      };
    }),

  /**
   * Get Payment Status
   * Check status of QuickBooks payment
   */
  getPaymentStatus: portalProcedure
    .input(z.object({
      queueId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const queueEntry = await prisma.quickbooks_payment_queue.findFirst({
        where: {
          id: input.queueId,
          customer_id: ctx.customerId,
        },
      });

      if (!queueEntry) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Payment not found',
        });
      }

      // Extract production_invoice_id from metadata
      const metadata = queueEntry.metadata as any;
      const productionInvoiceId = metadata?.production_invoice_id;

      // Fetch invoice details if available
      let invoiceInfo = null;
      if (productionInvoiceId) {
        const invoice = await prisma.production_invoices.findFirst({
          where: {
            id: productionInvoiceId,
            customer_id: ctx.customerId,
          },
          select: {
            invoice_number: true,
            total: true,
            amount_paid: true,
            amount_due: true,
          },
        });
        invoiceInfo = invoice;
      }

      return {
        status: queueEntry.status || 'pending',
        amount: Number(queueEntry.amount),
        quickbooksPaymentId: queueEntry.quickbooks_payment_id,
        quickbooksTransactionId: queueEntry.quickbooks_transaction_id,
        processedAt: queueEntry.processed_at,
        errorMessage: queueEntry.error_message,
        invoice: invoiceInfo,
      };
    }),

  /**
   * Get Customer Payment History
   * Returns all QuickBooks payments for customer
   */
  getCustomerPaymentHistory: portalProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).optional().default(50),
      offset: z.number().min(0).optional().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const payments = await prisma.quickbooks_payment_queue.findMany({
        where: {
          customer_id: ctx.customerId,
          status: {
            in: ['completed', 'failed'],
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        take: input.limit,
        skip: input.offset,
      });

      const total = await prisma.quickbooks_payment_queue.count({
        where: {
          customer_id: ctx.customerId,
          status: {
            in: ['completed', 'failed'],
          },
        },
      });

      // Fetch invoice details for each payment
      const paymentsWithInvoices = await Promise.all(
        payments.map(async (p) => {
          const metadata = p.metadata as any;
          const productionInvoiceId = metadata?.production_invoice_id;
          const paymentMethod = metadata?.payment_method;

          let invoiceNumber = null;
          if (productionInvoiceId) {
            const invoice = await prisma.production_invoices.findFirst({
              where: {
                id: productionInvoiceId,
                customer_id: ctx.customerId,
              },
              select: {
                invoice_number: true,
              },
            });
            invoiceNumber = invoice?.invoice_number;
          }

          return {
            id: p.id,
            amount: Number(p.amount),
            status: p.status || 'pending',
            paymentMethod: paymentMethod || 'unknown',
            invoiceNumber,
            createdAt: p.created_at,
            processedAt: p.processed_at,
            errorMessage: p.error_message,
          };
        })
      );

      return {
        payments: paymentsWithInvoices,
        total,
        hasMore: (input.offset + input.limit) < total,
      };
    }),

  // ============================================
  // Designer Portal Procedures
  // ============================================

  /**
   * Get Designer Dashboard Stats
   */
  getDesignerDashboardStats: designerPortalProcedure
    .query(async ({ ctx }) => {
      const partnerId = ctx.entityId;

      const [
        activeProjects,
        pendingReviews,
        completedProjects,
      ] = await Promise.all([
        // Active design projects
        prisma.design_projects.count({
          where: {
            designer_id: partnerId,
            current_stage: {
              in: ['concept', 'sketching', 'rendering', 'revisions'],
            },
          },
        }),

        // Pending approvals/reviews (simplified - no direct designer link)
        Promise.resolve(0),

        // Completed projects
        prisma.design_projects.count({
          where: {
            designer_id: partnerId,
            current_stage: 'approved',
          },
        }),
      ]);

      return {
        activeProjects,
        pendingReviews,
        completedProjects,
      };
    }),

  /**
   * Get Designer Projects
   */
  getDesignerProjects: designerPortalProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
      status: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const partnerId = ctx.entityId;

      const projects = await prisma.design_projects.findMany({
        where: {
          designer_id: partnerId,
          ...(input.status && { current_stage: input.status }),
        },
        include: {
          design_briefs: {
            include: {
              design_projects: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        take: input.limit,
        skip: input.offset,
      });

      return { projects };
    }),

  // ============================================
  // Factory Portal Procedures
  // ============================================

  /**
   * Get Factory Dashboard Stats
   */
  getFactoryDashboardStats: factoryPortalProcedure
    .query(async ({ ctx }) => {
      const partnerId = ctx.entityId;

      const [
        activeOrders,
        pendingDeposit,
        inProduction,
        readyToShip,
      ] = await Promise.all([
        // All active orders
        prisma.production_orders.count({
          where: {
            factory_id: partnerId,
            status: {
              in: ['deposit_paid', 'in_progress', 'awaiting_final_payment'],
            },
          },
        }),

        // Pending deposit
        prisma.production_orders.count({
          where: {
            factory_id: partnerId,
            status: 'awaiting_deposit',
          },
        }),

        // In production
        prisma.production_orders.count({
          where: {
            factory_id: partnerId,
            status: 'in_progress',
          },
        }),

        // Ready to ship
        prisma.production_orders.count({
          where: {
            factory_id: partnerId,
            status: 'ready_to_ship',
          },
        }),
      ]);

      return {
        activeOrders,
        pendingDeposit,
        inProduction,
        readyToShip,
      };
    }),

  /**
   * Get Factory Orders
   */
  getFactoryOrders: factoryPortalProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
      status: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const partnerId = ctx.entityId;

      const orders = await prisma.production_orders.findMany({
        where: {
          factory_id: partnerId,
          ...(input.status && { status: input.status }),
        },
        include: {
          projects: true,
          production_invoices: true,
        },
        orderBy: {
          order_date: 'desc',
        },
        take: input.limit,
        skip: input.offset,
      });

      return { orders };
    }),

  // ============================================
  // QC Portal Procedures
  // ============================================

  /**
   * Get QC Dashboard Stats
   */
  getQCDashboardStats: qcPortalProcedure
    .query(async ({ ctx }) => {
      // QC tester ID available as ctx.entityId if needed

      const [
        pendingInspections,
        completedToday,
        defectsFound,
      ] = await Promise.all([
        // Pending inspections
        prisma.quality_inspections.count({
          where: {
            inspector_name: ctx.entity?.company_name,
            passed: null,
          },
        }),

        // Completed today
        prisma.quality_inspections.count({
          where: {
            inspector_name: ctx.entity?.company_name,
            inspection_date: new Date().toISOString().split('T')[0],
            passed: {
              not: null,
            },
          },
        }),

        // Defects found (last 30 days)
        prisma.quality_inspections.aggregate({
          where: {
            inspector_name: ctx.entity?.company_name,
            inspection_date: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            },
          },
          _sum: {
            defects_found: true,
          },
        }),
      ]);

      return {
        pendingInspections,
        completedToday,
        defectsFound: defectsFound._sum.defects_found || 0,
      };
    }),

  /**
   * Get QC Inspections
   */
  getQCInspections: qcPortalProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
      status: z.enum(['pending', 'passed', 'failed']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const inspections = await prisma.quality_inspections.findMany({
        where: {
          inspector_name: ctx.entity?.company_name,
          ...(input.status === 'pending' && { passed: null }),
          ...(input.status === 'passed' && { passed: true }),
          ...(input.status === 'failed' && { passed: false }),
        },
        include: {
          manufacturer_projects: true,
        },
        orderBy: {
          inspection_date: 'desc',
        },
        take: input.limit,
        skip: input.offset,
      });

      return { inspections };
    }),

  /**
   * Get QC Inspection by ID
   */
  getQCInspectionById: qcPortalProcedure
    .input(z.object({
      inspectionId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const inspection = await prisma.quality_inspections.findFirst({
        where: {
          id: input.inspectionId,
          inspector_name: ctx.entity?.company_name,
        },
        include: {
          manufacturer_projects: true,
        },
      });

      if (!inspection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Inspection not found or you do not have access to it',
        });
      }

      return inspection;
    }),

  /**
   * Update Notification Preferences
   */
  updateNotificationPreferences: portalProcedure
    .input(z.object({
      emailNotifications: z.boolean(),
      smsNotifications: z.boolean(),
      inAppNotifications: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.customerId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Customer ID is required to update preferences',
        });
      }

      const updatedSettings = await prisma.portal_settings.upsert({
        where: {
          customer_id: ctx.customerId,
        },
        update: {
          notification_preferences: {
            email: input.emailNotifications,
            sms: input.smsNotifications,
            in_app: input.inAppNotifications,
          },
        },
        create: {
          customer_id: ctx.customerId,
          notification_preferences: {
            email: input.emailNotifications,
            sms: input.smsNotifications,
            in_app: input.inAppNotifications,
          },
        },
      });

      return { success: true, settings: updatedSettings };
    }),

  /**
   * Get QC Documents
   */
  getQCDocuments: qcPortalProcedure
    .input(z.object({
      documentType: z.enum(['inspection_report', 'quality_certificate', 'photos', 'other']).optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const documents = await prisma.documents.findMany({
        where: {
          category: input.documentType,
          // Filter by QC-related documents
          // TODO: Add proper relationship filtering when schema is clarified
        },
        orderBy: {
          created_at: 'desc',
        },
        take: input.limit,
        skip: input.offset,
      });

      return { documents };
    }),
});

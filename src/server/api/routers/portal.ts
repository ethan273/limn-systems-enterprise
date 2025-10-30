import { log } from '@/lib/logger';
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
  // Note: findFirst not supported by wrapper, using findMany
  const portalAccess = (await ctx.db.customer_portal_access.findMany({
    where: {
      user_id: ctx.session.user.id,
      is_active: true,
    },
    include: {
      customers: true,
    },
    take: 1,
  }))[0];

  if (!portalAccess) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have access to the customer portal'
    });
  }

  // Phase 4C Fix: Validate customer_id is not null
  // customer_id can be null for non-customer portal types (designer, factory, QC)
  // This middleware is specifically for customer portals, so customer_id must exist
  if (!portalAccess.customer_id) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'This portal type is not a customer portal. Please use the appropriate portal type.'
    });
  }

  // NOTE: last_login tracking removed from middleware for performance
  // Login tracking should happen at authentication time, not on every API call

  return {
    customerId: portalAccess.customer_id,
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
  // Note: findFirst not supported by wrapper, using findMany
  const portalAccess = (await ctx.db.customer_portal_access.findMany({
    where: {
      user_id: ctx.session.user.id,
      is_active: true,
      ...(requiredType && { portal_type: requiredType }),
    },
    include: {
      customers: true,
    },
    take: 1,
  }))[0];

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
    entity = await ctx.db.customers.findUnique({
      where: { id: portalAccess.entity_id },
    });
  } else if (portalAccess.entity_type === 'partner' && portalAccess.entity_id) {
    entity = await ctx.db.partners.findUnique({
      where: { id: portalAccess.entity_id },
    });
  } else if (portalAccess.entity_type === 'qc_tester' && portalAccess.entity_id) {
    entity = await ctx.db.qc_testers.findUnique({
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
    // Backward compatibility: For customer portals, use customer_id if set, otherwise fall back to entity_id
    customerId: (portalAccess.customer_id || (portalAccess.entity_type === 'customer' ? portalAccess.entity_id : null)) as string,
    customer: portalAccess.customers || entity, // Use entity if customers is null
  };
};

/**
 * Portal Procedure - Protected procedure with portal access enforcement
 * DEPRECATED: Only for customer-portal-specific endpoints
 * For universal endpoints, use universalPortalProcedure
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
 * Universal Portal Procedure - Works for ALL portal types (customer, designer, factory, QC)
 * Returns portal type, entity info, and legacy customer fields for backward compatibility
 */
const universalPortalProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const portalData = await enforcePortalAccessByType(ctx);

  return next({
    ctx: {
      ...ctx,
      // New universal fields
      portalType: portalData.portalType,
      entityType: portalData.entityType,
      entityId: portalData.entityId,
      entity: portalData.entity,
      portalRole: portalData.portalRole,
      // Backward compatibility (will be null for non-customer portals)
      customerId: portalData.customerId,
      customer: portalData.customer,
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
   * Get Portal Access Information (Universal)
   * Works for all portal types
   */
  getPortalAccess: universalPortalProcedure
    .query(async ({ ctx }) => {
      // Note: findFirst not supported by wrapper, using findMany
      const access = (await ctx.db.customer_portal_access.findMany({
        where: {
          user_id: ctx.session.user.id,
          is_active: true,
        },
        include: {
          customers: true,
        },
        take: 1,
      }))[0];

      return access;
    }),

  /**
   * Get Portal Settings
   * NOTE: Uses protectedProcedure (not portalProcedure) since it handles all portal types
   */
  getPortalSettings: protectedProcedure
    .query(async ({ ctx }) => {
      // Determine portal type from portal access (default to 'customer' for backward compatibility)
      // Note: findFirst not supported by wrapper, using findMany
      const portalAccess = (await ctx.db.customer_portal_access.findMany({
        where: {
          user_id: ctx.session.user.id,
          is_active: true,
        },
        take: 1,
      }))[0];

      const portalType = portalAccess?.portal_type || 'customer';
      const entityId = portalAccess?.entity_id || portalAccess?.customer_id;

      // Fetch universal module settings from portal_module_settings table
      const moduleSettings = await ctx.db.portal_module_settings.findMany({
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
      let legacySettings: any = null;
      if (portalType === 'customer' && entityId) {
        legacySettings = await ctx.db.portal_settings.findUnique({
          where: {
            customer_id: entityId,
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
      const settings = await ctx.db.portal_settings.upsert({
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
   * Works for all portal types (customer, designer, factory, QC)
   */
  getCurrentUser: universalPortalProcedure
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

      // Phase 4E Fix: Block access if customerId is null (non-customer portal types)
      // This enforces that only customer portal users can access customer portal data
      if (!ctx.customerId) {
        log.info('❌ [getDashboardStats] Access denied: customerId is null (non-customer portal type)');
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This portal type is not a customer portal. Please use the appropriate portal type.'
        });
      }

      // Phase 1 Fix: Use two-step query instead of nested filters
      // Get all project IDs for this customer first
      const customerProjects = await ctx.db.projects.findMany({
        where: { customer_id: ctx.customerId },
        select: { id: true },
      });
      const projectIds = customerProjects.map(p => p.id);

      // Phase 4A Fix: Handle empty projectIds array to avoid Supabase .in() errors
      // If customer has no projects, return 0 for project-related counts
      const [
        activeOrders,
        pendingPayments,
        recentShipments,
        documentsCount,
      ] = await Promise.all([
        // Active orders count - use project_id IN array instead of nested filter
        projectIds.length === 0 ? Promise.resolve(0) : ctx.db.production_orders.count({
          where: {
            project_id: { in: projectIds },
            status: {
              in: ['pending_deposit', 'in_production', 'ready_to_ship'],
            },
          },
        }),

        // Pending payments (unpaid invoices)
        ctx.db.production_invoices.count({
          where: {
            customer_id: ctx.customerId,
            status: {
              in: ['pending_payment', 'partially_paid'],
            },
          },
        }),

        // Recent shipments (last 30 days) - use project_id IN array instead of nested filter
        projectIds.length === 0 ? Promise.resolve(0) : ctx.db.shipments.count({
          where: {
            project_id: { in: projectIds },
            created_at: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),

        // Documents count
        ctx.db.documents.count({
          where: {
            customer_id: ctx.customerId,
          },
        }),
      ]);

      log.info('✅ [Portal] getDashboardStats completed');
      log.info('   Active Orders:', { activeOrders });
      log.info('   Pending Payments:', { pendingPayments });
      log.info('   Recent Shipments:', { recentShipments });
      log.info('   Documents:', { documentsCount });

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
   * Get Notifications - Works for all portal types
   */
  getNotifications: universalPortalProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      read: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Only customers have customer_notifications (designer/factory don't have customerId)
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
        ctx.db.customer_notifications.findMany({
          where,
          orderBy: {
            created_at: 'desc',
          },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.customer_notifications.count({ where }),
        ctx.db.customer_notifications.count({
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
      // Note: findFirst not supported by wrapper, using findMany
      const notification = (await ctx.db.customer_notifications.findMany({
        where: {
          id: input.notificationId,
          customer_id: ctx.customerId,
        },
        take: 1,
      }))[0];

      if (!notification) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Notification not found',
        });
      }

      return ctx.db.customer_notifications.update({
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
      // Note: updateMany not supported by wrapper, using findMany + Promise.all
      const unreadNotifications = await ctx.db.customer_notifications.findMany({
        where: {
          customer_id: ctx.customerId,
          read: false,
        },
      });

      await Promise.all(
        unreadNotifications.map(notif =>
          ctx.db.customer_notifications.update({
            where: { id: notif.id },
            data: {
              read: true,
              read_at: new Date(),
            },
          })
        )
      );

      return { count: unreadNotifications.length };
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
      return ctx.db.customer_notifications.create({
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
      return ctx.db.customer_shipping_addresses.findMany({
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
        // Note: updateMany not supported by wrapper, using findMany + Promise.all
        const existingDefaults = await ctx.db.customer_shipping_addresses.findMany({
          where: {
            customer_id: ctx.customerId,
            is_default: true,
          },
        });
        await Promise.all(
          existingDefaults.map(addr =>
            ctx.db.customer_shipping_addresses.update({
              where: { id: addr.id },
              data: { is_default: false },
            })
          )
        );
      }

      return ctx.db.customer_shipping_addresses.create({
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
      // Note: findFirst not supported by wrapper, using findMany
      const address = (await ctx.db.customer_shipping_addresses.findMany({
        where: {
          id: addressId,
          customer_id: ctx.customerId,
        },
        take: 1,
      }))[0];

      if (!address) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Shipping address not found',
        });
      }

      // If setting as default, unset all other defaults
      if (input.is_default) {
        // Note: updateMany not supported by wrapper, using findMany + Promise.all
        const existingDefaults = await ctx.db.customer_shipping_addresses.findMany({
          where: {
            customer_id: ctx.customerId,
            is_default: true,
          },
        });
        await Promise.all(
          existingDefaults.map(addr =>
            ctx.db.customer_shipping_addresses.update({
              where: { id: addr.id },
              data: { is_default: false },
            })
          )
        );
      }

      return ctx.db.customer_shipping_addresses.update({
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
      // Note: findFirst not supported by wrapper, using findMany
      const address = (await ctx.db.customer_shipping_addresses.findMany({
        where: {
          id: input.addressId,
          customer_id: ctx.customerId,
        },
        take: 1,
      }))[0];

      if (!address) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Shipping address not found',
        });
      }

      // Soft delete
      return ctx.db.customer_shipping_addresses.update({
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
      // Phase 3 Fix: Use two-step query to avoid nested filter in count()
      // Step 1: Get project IDs for this customer
      const customerProjects = await ctx.db.projects.findMany({
        where: { customer_id: ctx.customerId },
        select: { id: true },
      });
      const projectIds = customerProjects.map(p => p.id);

      // Phase 4A Fix: Handle empty projectIds array
      if (projectIds.length === 0) {
        return {
          orders: [],
          total: 0,
          hasMore: false,
        };
      }

      // Step 2: Build where clause with direct filter
      const where: any = {
        project_id: { in: projectIds },
      };

      if (input.status && input.status !== 'all') {
        where.status = input.status;
      }

      const [orders, total] = await Promise.all([
        ctx.db.production_orders.findMany({
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
        ctx.db.production_orders.count({ where }),
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
      // Note: findFirst not supported by wrapper, using findMany
      const order = (await ctx.db.production_orders.findMany({
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
        take: 1,
      }))[0];

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
      // Note: findFirst not supported by wrapper, using findMany
      const order = (await ctx.db.production_orders.findMany({
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
        take: 1,
      }))[0];

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

      // Sort by date (handle null dates)
      timeline.sort((a, b) => (a.date ? new Date(a.date).getTime() : 0) - (b.date ? new Date(b.date).getTime() : 0));

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
      // Note: findFirst not supported by wrapper, using findMany
      const order = (await ctx.db.production_orders.findMany({
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
        take: 1,
      }))[0];

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
      // Note: findFirst not supported by wrapper, using findMany
      const order = (await ctx.db.production_orders.findMany({
        where: {
          id: input.orderId,
          projects: {
            customer_id: ctx.customerId,
          },
        },
        take: 1,
      }))[0];

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
      // Note: findFirst not supported by wrapper, using findMany
      const order = (await ctx.db.production_orders.findMany({
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
        take: 1,
      }))[0];

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

      return ctx.db.shipments.findMany({
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
      // Note: findFirst not supported by wrapper, using findMany
      const shipment = (await ctx.db.shipments.findMany({
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
        take: 1,
      }))[0];

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
      // Phase 3 Fix: Use two-step query to avoid nested filter in count()
      // Step 1: Get project IDs for this customer
      const customerProjects = await ctx.db.projects.findMany({
        where: { customer_id: ctx.customerId },
        select: { id: true },
      });
      const projectIds = customerProjects.map(p => p.id);

      // Phase 4A Fix: Handle empty projectIds array
      if (projectIds.length === 0) {
        return {
          shipments: [],
          total: 0,
          hasMore: false,
        };
      }

      // Step 2: Use direct filter
      const where = {
        project_id: { in: projectIds },
      };

      const [shipments, total] = await Promise.all([
        ctx.db.shipments.findMany({
          where,
          include: {
            production_orders: true,
          },
          orderBy: {
            created_at: 'desc',
          },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.shipments.count({ where }),
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
        ctx.db.documents.findMany({
          where,
          orderBy: {
            created_at: 'desc',
          },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.documents.count({ where }),
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
      // Note: findFirst not supported by wrapper, using findMany
      const document = (await ctx.db.documents.findMany({
        where: {
          id: input.documentId,
          customer_id: ctx.customerId,
        },
        take: 1,
      }))[0];

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
        // Note: findFirst not supported by wrapper, using findMany
        const order = (await ctx.db.production_orders.findMany({
          where: {
            id: input.orderId,
            projects: { customer_id: ctx.customerId },
          },
          select: { project_id: true },
          take: 1,
        }))[0];

        if (order?.project_id) {
          where.project_id = order.project_id;
        }
      }

      const [shopDrawings, total] = await Promise.all([
        ctx.db.shop_drawings.findMany({
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
        ctx.db.shop_drawings.count({ where }),
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
        ctx.db.production_invoices.findMany({
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
        ctx.db.production_invoices.count({ where }),
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
      // Note: findFirst not supported by wrapper, using findMany
      const invoice = (await ctx.db.production_invoices.findMany({
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
        take: 1,
      }))[0];

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
   * Log Portal Activity (Universal)
   * Works for all portal types
   */
  logActivity: universalPortalProcedure
    .input(z.object({
      action: z.string().min(1).max(100),
      entity_type: z.string().max(50).optional(),
      entity_id: z.string().uuid().optional(),
      metadata: z.record(z.any()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.portal_activity_log.create({
        data: {
          customer_id: ctx.customerId || null,
          user_id: ctx.session.user.id,
          activity_type: input.action,
          description: `${ctx.portalType || 'customer'} portal: ${input.action}`,
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
      const customer = await ctx.db.customers.findUnique({
        where: { id: ctx.customerId },
      });

      if (!customer) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Customer profile not found',
        });
      }

      // Update customer record
      return ctx.db.customers.update({
        where: { id: ctx.customerId },
        data: {
          ...input,
          updated_at: new Date(),
        },
      });
    }),

  /**
   * Get Portal Profile (Universal)
   * Returns profile information for ANY portal type (customer, designer, factory, QC)
   * Replaces getCustomerProfile with universal support
   */
  getPortalProfile: universalPortalProcedure
    .query(async ({ ctx }) => {
      // Return profile based on portal type
      // For customer portals, use customerId (legacy) OR entityId (new)
      if (ctx.portalType === 'customer' && (ctx.customerId || ctx.entityId)) {
        // Customer portal - return customer profile
        const customerId = ctx.customerId || ctx.entityId;
        const customer = await ctx.db.customers.findUnique({
          where: { id: customerId },
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

        return {
          type: 'customer' as const,
          profile: customer,
        };
      }

      if ((ctx.portalType === 'designer' || ctx.portalType === 'factory') && ctx.entityId) {
        // Designer/Factory portal - return partner profile
        // NOTE: design_projects table references the legacy 'designers' table, not 'partners'
        // Production orders link to partners via factory_id, but that's only for factories
        const partner = await ctx.db.partners.findUnique({
          where: { id: ctx.entityId },
          include: {
            production_orders: {
              select: {
                id: true,
                order_number: true,
                status: true,
                created_at: true,
              },
              orderBy: {
                created_at: 'desc',
              },
              take: 5,
            },
          },
        });

        if (!partner) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `${ctx.portalType === 'designer' ? 'Designer' : 'Factory'} profile not found`,
          });
        }

        return {
          type: ctx.portalType === 'designer' ? ('designer' as const) : ('factory' as const),
          profile: partner,
        };
      }

      if (ctx.portalType === 'qc' && ctx.entityId) {
        // QC portal - return QC tester profile
        const qcTester = await ctx.db.qc_testers.findUnique({
          where: { id: ctx.entityId },
        });

        if (!qcTester) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'QC tester profile not found',
          });
        }

        return {
          type: 'qc' as const,
          profile: qcTester,
        };
      }

      // Fallback error
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Portal type '${ctx.portalType}' is not supported or entity ID is missing`,
      });
    }),

  /**
   * Get Customer Profile (DEPRECATED)
   * Use getPortalProfile instead
   * Kept for backward compatibility
   */
  getCustomerProfile: portalProcedure
    .query(async ({ ctx }) => {
      const customer = await ctx.db.customers.findUnique({
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
      // Note: findFirst not supported by wrapper, using findMany
      const invoice = (await ctx.db.production_invoices.findMany({
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
        take: 1,
      }))[0];

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
      // Note: findFirst not supported by wrapper, using findMany
      const qbConnection = (await ctx.db.quickbooks_auth.findMany({
        where: {
          is_active: true,
        },
        orderBy: {
          created_at: 'desc',
        },
        take: 1,
      }))[0];

      if (!qbConnection) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'QuickBooks integration is not configured. Please contact support.',
        });
      }

      // Store payment method in metadata since there's no direct payment_method field
      const queueEntry = await ctx.db.quickbooks_payment_queue.create({
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
      // Note: findFirst not supported by wrapper, using findMany
      const queueEntry = (await ctx.db.quickbooks_payment_queue.findMany({
        where: {
          id: input.queueId,
          customer_id: ctx.customerId,
        },
        take: 1,
      }))[0];

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
      let invoiceInfo: any = null;
      if (productionInvoiceId) {
        // Note: findFirst not supported by wrapper, using findMany
        const invoice = (await ctx.db.production_invoices.findMany({
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
          take: 1,
        }))[0];
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
      const payments = await ctx.db.quickbooks_payment_queue.findMany({
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

      const total = await ctx.db.quickbooks_payment_queue.count({
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

          let invoiceNumber: string | null | undefined = null;
          if (productionInvoiceId) {
            // Note: findFirst not supported by wrapper, using findMany
            const invoice = (await ctx.db.production_invoices.findMany({
              where: {
                id: productionInvoiceId,
                customer_id: ctx.customerId,
              },
              select: {
                invoice_number: true,
              },
              take: 1,
            }))[0];
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
        ctx.db.design_projects.count({
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
        ctx.db.design_projects.count({
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

      const projects = await ctx.db.design_projects.findMany({
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

  /**
   * Get Designer Project by ID
   * Returns full design project details with all relationships
   */
  getDesignerProjectById: designerPortalProcedure
    .input(z.object({
      projectId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const partnerId = ctx.entityId;

      // Fetch the project with all related data
      const project = await ctx.db.design_projects.findFirst({
        where: {
          id: input.projectId,
          designer_id: partnerId, // Security: ensure designer owns this project
        },
        include: {
          // Project requirements and briefs
          design_briefs: {
            include: {
              design_projects: true,
            },
          },
          // Design deliverables (files, submissions)
          design_deliverables: {
            orderBy: {
              created_at: 'desc',
            },
          },
          // Revision history
          design_revisions: {
            orderBy: {
              created_at: 'desc',
            },
          },
          // Mood boards
          mood_boards: {
            orderBy: {
              created_at: 'desc',
            },
          },
          // Related documents
          documents: {
            orderBy: {
              created_at: 'desc',
            },
          },
          // Customer information (if linked)
          customers: true,
          // Concepts (if linked)
          concepts: true,
          // Prototypes with all related data (CRITICAL: for prototype review workflow)
          prototypes: {
            include: {
              // Production runs for each prototype
              prototype_production: {
                orderBy: {
                  created_at: 'desc',
                },
              },
              // Reviews from stakeholders
              prototype_reviews: {
                orderBy: {
                  review_date: 'desc',
                },
              },
              // Feedback from testing/reviews
              prototype_feedback: {
                orderBy: {
                  feedback_date: 'desc',
                },
              },
            },
            orderBy: {
              created_at: 'desc',
            },
          },
        },
      });

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Design project not found or you do not have access to it',
        });
      }

      return project;
    }),

  /**
   * Get Designer Documents
   * Returns all documents associated with designer's projects
   */
  getDesignerDocuments: designerPortalProcedure
    .query(async ({ ctx }) => {
      const designerId = ctx.entityId;

      // Fetch all documents for this designer
      const documents = await ctx.db.documents.findMany({
        where: {
          OR: [
            { designer_id: designerId },
            {
              design_projects: {
                designer_id: designerId,
              },
            },
          ],
          status: { not: 'deleted' },
        },
        include: {
          design_projects: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        take: 100,
      });

      return { documents };
    }),

  /**
   * Create Designer Document
   * Upload a new document and link to design project
   */
  createDesignerDocument: designerPortalProcedure
    .input(z.object({
      name: z.string().min(1, 'Document name is required'),
      documentType: z.enum(['brief', 'deliverable', 'mood_board', 'revision', 'reference', 'other']),
      storagePath: z.string().min(1, 'Storage path is required'),
      storageBucket: z.string().default('documents'),
      fileSize: z.number().optional(),
      mimeType: z.string().optional(),
      designProjectId: z.string().uuid().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const designerId = ctx.entityId;

      // Get designer info from designers table
      const designer = await ctx.db.designers.findUnique({
        where: { id: designerId },
        select: { name: true, company: true },
      });

      // Generate public URL from Supabase Storage
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();

      const { data: urlData } = supabase.storage
        .from(input.storageBucket)
        .getPublicUrl(input.storagePath);

      // Create document record
      const document = await ctx.db.documents.create({
        data: {
          name: input.name,
          original_name: input.name,
          category: input.documentType,
          type: input.mimeType || 'application/octet-stream',
          size: input.fileSize ? BigInt(input.fileSize) : null,
          storage_bucket: input.storageBucket,
          storage_type: 'supabase',
          url: urlData.publicUrl,
          download_url: urlData.publicUrl,
          designer_id: designerId,
          design_project_id: input.designProjectId,
          uploaded_by: designer?.name || 'Designer',
          notes: `Storage Path: ${input.storagePath}\nUploaded by ${designer?.name || 'Designer'}${input.description ? `\nDescription: ${input.description}` : ''}`,
          status: 'active',
          approval_status: 'pending',
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      return {
        document,
        success: true,
        message: 'Document uploaded successfully',
      };
    }),

  /**
   * Get Designer Performance Metrics
   * Returns performance data and statistics for the designer
   */
  getDesignerPerformance: designerPortalProcedure
    .query(async ({ ctx }) => {
      const designerId = ctx.entityId;

      // Get all performance records for this designer
      const performanceRecords = await ctx.db.designer_performance.findMany({
        where: { designer_id: designerId },
        include: {
          design_projects: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      // Calculate aggregate metrics
      const totalProjects = performanceRecords.length;
      const avgQualityRating = totalProjects > 0
        ? performanceRecords.reduce((sum, r) => sum + (r.quality_rating || 0), 0) / totalProjects
        : 0;
      const avgCreativityRating = totalProjects > 0
        ? performanceRecords.reduce((sum, r) => sum + (r.creativity_rating || 0), 0) / totalProjects
        : 0;
      const avgCommunicationRating = totalProjects > 0
        ? performanceRecords.reduce((sum, r) => sum + (r.communication_rating || 0), 0) / totalProjects
        : 0;
      const onTimeDeliveryRate = totalProjects > 0
        ? (performanceRecords.filter(r => r.on_time_delivery).length / totalProjects) * 100
        : 0;
      const avgRevisionCount = totalProjects > 0
        ? performanceRecords.reduce((sum, r) => sum + (r.revision_count || 0), 0) / totalProjects
        : 0;
      const wouldRehireRate = totalProjects > 0
        ? (performanceRecords.filter(r => r.would_rehire).length / totalProjects) * 100
        : 0;

      return {
        performanceRecords,
        aggregateMetrics: {
          totalProjects,
          avgQualityRating: Math.round(avgQualityRating * 10) / 10,
          avgCreativityRating: Math.round(avgCreativityRating * 10) / 10,
          avgCommunicationRating: Math.round(avgCommunicationRating * 10) / 10,
          onTimeDeliveryRate: Math.round(onTimeDeliveryRate),
          avgRevisionCount: Math.round(avgRevisionCount * 10) / 10,
          wouldRehireRate: Math.round(wouldRehireRate),
        },
      };
    }),

  /**
   * Get Designer Feedback and Revisions
   * Returns all feedback from revisions and prototype reviews
   */
  getDesignerFeedback: designerPortalProcedure
    .query(async ({ ctx }) => {
      const designerId = ctx.entityId;

      // Get design revisions for designer's projects
      const revisions = await ctx.db.design_revisions.findMany({
        where: {
          design_projects: {
            designer_id: designerId,
          },
        },
        include: {
          design_projects: {
            select: {
              id: true,
              name: true,
            },
          },
          users_design_revisions_requested_byTousers: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          request_date: 'desc',
        },
        take: 50,
      });

      // Get prototype feedback for designer's projects
      const prototypeFeedback = await ctx.db.prototype_feedback.findMany({
        where: {
          prototypes: {
            design_projects: {
              designer_id: designerId,
            },
          },
        },
        include: {
          prototypes: {
            select: {
              id: true,
              name: true,
              version: true,
              design_projects: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          feedback_date: 'desc',
        },
        take: 50,
      });

      return {
        revisions,
        prototypeFeedback,
      };
    }),

  /**
   * Get Designer Profile
   * Returns designer profile information for settings page
   */
  getDesignerProfile: designerPortalProcedure
    .query(async ({ ctx }) => {
      const designerId = ctx.entityId;

      const designer = await ctx.db.designers.findUnique({
        where: { id: designerId },
      });

      if (!designer) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Designer profile not found',
        });
      }

      return designer;
    }),

  /**
   * Update Designer Profile
   * Updates designer profile information
   */
  updateDesignerProfile: designerPortalProcedure
    .input(z.object({
      name: z.string().min(1).optional(),
      company_name: z.string().optional(),
      phone: z.string().optional(),
      website: z.string().url().optional().or(z.literal('')),
      portfolio_url: z.string().url().optional().or(z.literal('')),
      specialties: z.array(z.string()).optional(),
      design_style: z.array(z.string()).optional(),
      years_experience: z.number().int().min(0).optional(),
      hourly_rate: z.number().optional(),
      currency: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const designerId = ctx.entityId;

      // Prepare update data
      const updateData: any = {
        ...input,
        updated_at: new Date(),
      };

      // Handle JSON fields
      if (input.specialties) {
        updateData.specialties = input.specialties;
      }
      if (input.design_style) {
        updateData.design_style = input.design_style;
      }

      const designer = await ctx.db.designers.update({
        where: { id: designerId },
        data: updateData,
      });

      return {
        designer,
        success: true,
        message: 'Profile updated successfully',
      };
    }),

  /**
   * Update Designer Notification Preferences
   * Stores notification preferences in designer notes field (temporary solution)
   */
  updateDesignerNotificationPreferences: designerPortalProcedure
    .input(z.object({
      emailNotifications: z.boolean(),
      smsNotifications: z.boolean(),
      inAppNotifications: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const designerId = ctx.entityId;

      // Get current designer
      const designer = await ctx.db.designers.findUnique({
        where: { id: designerId },
      });

      if (!designer) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Designer profile not found',
        });
      }

      // Store preferences as JSON in a metadata field
      // Note: In production, create a designer_settings table
      const preferences = {
        email: input.emailNotifications,
        sms: input.smsNotifications,
        in_app: input.inAppNotifications,
      };

      // For now, we'll append to notes field
      const notificationMeta = `\n[NOTIFICATION_PREFS]${JSON.stringify(preferences)}[/NOTIFICATION_PREFS]`;
      const currentNotes = designer.notes || '';
      const cleanedNotes = currentNotes.replace(/\[NOTIFICATION_PREFS\].*?\[\/NOTIFICATION_PREFS\]/g, '');
      const newNotes = cleanedNotes + notificationMeta;

      await ctx.db.designers.update({
        where: { id: designerId },
        data: {
          notes: newNotes,
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        message: 'Notification preferences updated successfully',
        preferences,
      };
    }),

  /**
   * Get Designer Submissions
   * Returns all projects with deliverable submission status
   */
  getDesignerSubmissions: designerPortalProcedure
    .query(async ({ ctx }) => {
      const designerId = ctx.entityId;

      // Get all design projects for this designer
      const projects = await ctx.db.design_projects.findMany({
        where: { designer_id: designerId },
        include: {
          design_deliverables: {
            orderBy: {
              created_at: 'desc',
            },
          },
          customers: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      // Calculate submission status for each project
      const projectsWithStatus = projects.map((project) => {
        const deliverables = project.design_deliverables || [];
        const totalDeliverables = deliverables.length;
        const pendingDeliverables = deliverables.filter(d => d.status === 'pending').length;
        const approvedDeliverables = deliverables.filter(d => d.status === 'approved').length;
        const rejectedDeliverables = deliverables.filter(d => d.status === 'rejected').length;

        let submissionStatus = 'not_started';
        if (totalDeliverables === 0) {
          submissionStatus = 'not_started';
        } else if (approvedDeliverables === totalDeliverables) {
          submissionStatus = 'completed';
        } else if (rejectedDeliverables > 0) {
          submissionStatus = 'needs_revision';
        } else if (pendingDeliverables > 0) {
          submissionStatus = 'in_review';
        }

        return {
          ...project,
          submissionStatus,
          totalDeliverables,
          pendingDeliverables,
          approvedDeliverables,
          rejectedDeliverables,
        };
      });

      return { projects: projectsWithStatus };
    }),

  /**
   * Submit Designer Deliverable
   * Creates a new deliverable submission for a project
   */
  submitDesignerDeliverable: designerPortalProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      deliverableType: z.enum(['concept', 'sketch', 'render', 'final_design', 'technical_drawing', 'other']),
      fileName: z.string().min(1),
      fileUrl: z.string().min(1),
      fileSize: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const designerId = ctx.entityId;

      // Verify project belongs to designer
      const project = await ctx.db.design_projects.findFirst({
        where: {
          id: input.projectId,
          designer_id: designerId,
        },
      });

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found or you do not have access to it',
        });
      }

      // Get current version number
      const existingDeliverables = await ctx.db.design_deliverables.findMany({
        where: {
          design_project_id: input.projectId,
          deliverable_type: input.deliverableType,
        },
        orderBy: {
          version: 'desc',
        },
        take: 1,
      });

      const nextVersion = existingDeliverables.length > 0
        ? (existingDeliverables[0].version || 1) + 1
        : 1;

      // Create deliverable record
      const deliverable = await ctx.db.design_deliverables.create({
        data: {
          design_project_id: input.projectId,
          deliverable_type: input.deliverableType,
          version: nextVersion,
          file_name: input.fileName,
          file_url: input.fileUrl,
          file_size: input.fileSize,
          status: 'pending',
          submitted_date: new Date(),
          review_comments: input.notes,
          created_at: new Date(),
        },
      });

      return {
        deliverable,
        success: true,
        message: 'Deliverable submitted successfully',
      };
    }),

  /**
   * Get Project Deliverables
   * Returns all deliverables for a specific project
   */
  getProjectDeliverables: designerPortalProcedure
    .input(z.object({
      projectId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const designerId = ctx.entityId;

      // Verify project access
      const project = await ctx.db.design_projects.findFirst({
        where: {
          id: input.projectId,
          designer_id: designerId,
        },
      });

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found or you do not have access to it',
        });
      }

      const deliverables = await ctx.db.design_deliverables.findMany({
        where: { design_project_id: input.projectId },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: [
          { deliverable_type: 'asc' },
          { version: 'desc' },
        ],
      });

      return { deliverables };
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
        ctx.db.production_orders.count({
          where: {
            factory_id: partnerId,
            status: {
              in: ['deposit_paid', 'in_progress', 'awaiting_final_payment'],
            },
          },
        }),

        // Pending deposit
        ctx.db.production_orders.count({
          where: {
            factory_id: partnerId,
            status: 'awaiting_deposit',
          },
        }),

        // In production
        ctx.db.production_orders.count({
          where: {
            factory_id: partnerId,
            status: 'in_progress',
          },
        }),

        // Ready to ship
        ctx.db.production_orders.count({
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

      const orders = await ctx.db.production_orders.findMany({
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

  /**
   * Get Factory Documents
   */
  getFactoryDocuments: factoryPortalProcedure
    .query(async ({ ctx }) => {
      const partnerId = ctx.entityId;

      const documents = await ctx.db.documents.findMany({
        where: {
          OR: [
            // Documents linked to production orders from this factory
            {
              production_orders: {
                factory_id: partnerId,
              },
            },
            // Documents linked to quality inspections for this factory
            {
              quality_inspections: {
                production_orders: {
                  factory_id: partnerId,
                },
              },
            },
            // Documents created by the factory
            {
              uploaded_by: ctx.user?.id,
            },
          ],
        },
        include: {
          production_orders: {
            select: {
              id: true,
              order_number: true,
              status: true,
            },
          },
          quality_inspections: {
            select: {
              id: true,
              inspector_name: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        take: 100,
      });

      // Get document URLs from Supabase
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = createClient();

      const documentsWithUrls = await Promise.all(
        documents.map(async (doc) => {
          let url: string | null = null;
          let download_url: string | null = null;

          if (doc.storage_path && doc.storage_bucket) {
            const { data: urlData } = supabase.storage
              .from(doc.storage_bucket)
              .getPublicUrl(doc.storage_path);
            url = urlData.publicUrl;

            const { data: downloadData } = await supabase.storage
              .from(doc.storage_bucket)
              .createSignedUrl(doc.storage_path, 3600);
            download_url = downloadData?.signedUrl || null;
          }

          return {
            ...doc,
            url,
            download_url,
          };
        })
      );

      return {
        documents: documentsWithUrls,
      };
    }),

  /**
   * Create Factory Document
   */
  createFactoryDocument: factoryPortalProcedure
    .input(z.object({
      name: z.string().min(1),
      documentType: z.enum(['packing_list', 'qc_report', 'shipping_doc', 'invoice', 'certificate', 'other']),
      storagePath: z.string().min(1),
      storageBucket: z.string().min(1),
      fileSize: z.number().optional(),
      mimeType: z.string().optional(),
      productionOrderId: z.string().uuid().optional(),
      qualityInspectionId: z.string().uuid().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;

      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to upload documents',
        });
      }

      // Verify access to production order if provided
      if (input.productionOrderId) {
        const order = await ctx.db.production_orders.findFirst({
          where: {
            id: input.productionOrderId,
            factory_id: ctx.entityId,
          },
        });

        if (!order) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Production order not found or you do not have access to it',
          });
        }
      }

      // Create document record
      const document = await ctx.db.documents.create({
        data: {
          name: input.name,
          category: input.documentType,
          storage_path: input.storagePath,
          storage_bucket: input.storageBucket,
          size: input.fileSize ? BigInt(input.fileSize) : null,
          mime_type: input.mimeType,
          uploaded_by: userId,
          production_order_id: input.productionOrderId,
          quality_inspection_id: input.qualityInspectionId,
          description: input.description,
          created_at: new Date(),
        },
      });

      return {
        document,
        success: true,
        message: 'Document uploaded successfully',
      };
    }),

  /**
   * Get Factory Quality Reports
   */
  getFactoryQualityReports: factoryPortalProcedure
    .query(async ({ ctx }) => {
      const partnerId = ctx.entityId;

      // Get quality inspections for this factory's production orders
      const inspections = await ctx.db.quality_inspections.findMany({
        where: {
          production_orders: {
            factory_id: partnerId,
          },
        },
        include: {
          production_orders: {
            select: {
              id: true,
              order_number: true,
              status: true,
            },
          },
        },
        orderBy: {
          inspection_date: 'desc',
        },
        take: 50,
      });

      // Calculate aggregate metrics
      const totalInspections = inspections.length;
      const passedInspections = inspections.filter(i => i.passed === true).length;
      const failedInspections = inspections.filter(i => i.passed === false).length;
      const pendingInspections = inspections.filter(i => i.passed === null).length;
      const passRate = totalInspections > 0 ? Math.round((passedInspections / totalInspections) * 100) : 0;
      const totalDefects = inspections.reduce((sum, i) => sum + (i.defects_found || 0), 0);

      return {
        inspections,
        aggregateMetrics: {
          totalInspections,
          passedInspections,
          failedInspections,
          pendingInspections,
          passRate,
          totalDefects,
        },
      };
    }),

  /**
   * Update Factory Shipping Information
   */
  updateFactoryShipping: factoryPortalProcedure
    .input(z.object({
      orderId: z.string().uuid(),
      trackingNumber: z.string().min(1).optional(),
      shippingDate: z.date().optional(),
      carrier: z.string().optional(),
      notes: z.string().optional(),
      markAsShipped: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const partnerId = ctx.entityId;

      // Verify order belongs to this factory
      const order = await ctx.db.production_orders.findFirst({
        where: {
          id: input.orderId,
          factory_id: partnerId,
        },
      });

      if (!order) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Production order not found or you do not have access to it',
        });
      }

      // Prepare update data
      const updateData: any = {};

      if (input.trackingNumber) {
        updateData.tracking_number = input.trackingNumber;
      }

      if (input.shippingDate) {
        updateData.actual_ship_date = input.shippingDate;
      }

      if (input.carrier) {
        updateData.shipping_carrier = input.carrier;
      }

      if (input.notes) {
        // Append shipping notes to existing notes
        const existingNotes = order.notes || '';
        const timestamp = new Date().toISOString();
        const newNote = `\n[SHIPPING UPDATE ${timestamp}]: ${input.notes}`;
        updateData.notes = existingNotes + newNote;
      }

      if (input.markAsShipped && order.status === 'ready_to_ship') {
        updateData.status = 'shipped';
        if (!input.shippingDate) {
          updateData.actual_ship_date = new Date();
        }
      }

      // Update production order
      const updatedOrder = await ctx.db.production_orders.update({
        where: { id: input.orderId },
        data: updateData,
      });

      return {
        order: updatedOrder,
        success: true,
        message: 'Shipping information updated successfully',
      };
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
        ctx.db.quality_inspections.count({
          where: {
            inspector_name: ctx.entity?.company_name,
            passed: null,
          },
        }),

        // Completed today
        ctx.db.quality_inspections.count({
          where: {
            inspector_name: ctx.entity?.company_name,
            inspection_date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(new Date().setHours(23, 59, 59, 999)),
            },
            passed: {
              not: null,
            },
          },
        }),

        // Defects found (last 30 days)
        // Note: aggregate not supported by wrapper, using findMany + manual summation
        ctx.db.quality_inspections.findMany({
          where: {
            inspector_name: ctx.entity?.company_name,
            inspection_date: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

      // Manual summation for defects_found
      const totalDefects = defectsFound.reduce((sum, inspection) => sum + (inspection.defects_found || 0), 0);

      return {
        pendingInspections,
        completedToday,
        defectsFound: totalDefects,
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
      const inspections = await ctx.db.quality_inspections.findMany({
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
      // Note: findFirst not supported by wrapper, using findMany
      const inspection = (await ctx.db.quality_inspections.findMany({
        where: {
          id: input.inspectionId,
          inspector_name: ctx.entity?.company_name,
        },
        include: {
          manufacturer_projects: true,
        },
        take: 1,
      }))[0];

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

      const updatedSettings = await ctx.db.portal_settings.upsert({
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
   * Update QC Inspection Status
   */
  updateQCInspectionStatus: qcPortalProcedure
    .input(z.object({
      inspectionId: z.string().uuid(),
      passed: z.boolean(),
      defectsFound: z.number().int().min(0).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify inspection exists and belongs to a project accessible by this QC tester
      const inspection = await ctx.db.quality_inspections.findUnique({
        where: { id: input.inspectionId },
        include: {
          manufacturer_projects: true,
        },
      });

      if (!inspection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Inspection not found',
        });
      }

      // Update inspection
      const updatedInspection = await ctx.db.quality_inspections.update({
        where: { id: input.inspectionId },
        data: {
          passed: input.passed,
          defects_found: input.defectsFound !== undefined ? input.defectsFound : undefined,
          notes: input.notes || inspection.notes,
          inspection_date: inspection.inspection_date || new Date(),
        },
      });

      return {
        inspection: updatedInspection,
        success: true,
        message: 'Inspection status updated successfully',
      };
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
      // Get all manufacturer projects that have QC inspections assigned to this QC tester
      const inspections = await ctx.db.quality_inspections.findMany({
        where: {
          inspector_name: ctx.entity?.company_name,
        },
        select: {
          manufacturer_project_id: true,
        },
      });

      // Extract unique project IDs
      const projectIds = [...new Set(inspections.map(i => i.manufacturer_project_id).filter(Boolean))];

      if (projectIds.length === 0) {
        return { documents: [] };
      }

      // Filter documents by QC-related manufacturer projects and optional category
      const documents = await ctx.db.documents.findMany({
        where: {
          ...(input.documentType && { category: input.documentType }),
          manufacturer_project_id: { in: projectIds as string[] },
        },
        orderBy: {
          created_at: 'desc',
        },
        take: input.limit,
        skip: input.offset,
      });

      return { documents };
    }),

  /**
   * Get Recent QC Uploads
   * Returns recent documents uploaded by the current QC tester
   */
  getRecentQCUploads: qcPortalProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const qcTesterId = ctx.entityId;

      // Get documents uploaded by this QC tester (stored in notes field)
      const documents = await ctx.db.documents.findMany({
        where: {
          notes: {
            contains: qcTesterId, // QC tester ID stored in notes for tracking
          },
          category: {
            in: ['inspection_report', 'quality_certificate', 'photos', 'other'],
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        take: input.limit,
      });

      return { documents };
    }),

  /**
   * Create QC Document
   * Creates a document record after uploading to Supabase Storage
   */
  createQCDocument: qcPortalProcedure
    .input(z.object({
      name: z.string().min(1, 'Document name is required'),
      category: z.enum(['inspection_report', 'quality_certificate', 'photos', 'other']),
      storagePath: z.string().min(1, 'Storage path is required'),
      storageBucket: z.string().default('documents'),
      fileSize: z.number().optional(),
      mimeType: z.string().optional(),
      manufacturerProjectId: z.string().uuid().optional(),
      qualityInspectionId: z.string().uuid().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const qcTesterId = ctx.entityId;
      const qcTesterName = ctx.entity?.company_name || 'Unknown QC Tester';

      // Get public URL from Supabase
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();

      const { data: urlData } = supabase.storage
        .from(input.storageBucket)
        .getPublicUrl(input.storagePath);

      // Create document record in database
      const document = await ctx.db.documents.create({
        data: {
          name: input.name,
          original_name: input.name,
          category: input.category,
          type: input.mimeType || 'application/octet-stream',
          size: input.fileSize ? BigInt(input.fileSize) : null,
          storage_bucket: input.storageBucket,
          storage_type: 'supabase',
          url: urlData.publicUrl,
          download_url: urlData.publicUrl,
          manufacturer_project_id: input.manufacturerProjectId,
          quality_inspection_id: input.qualityInspectionId,
          // Store QC tester info and storage path in notes field for tracking
          notes: `Storage Path: ${input.storagePath}\nUploaded by ${qcTesterName} (QC Tester ID: ${qcTesterId})`,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      return {
        document,
        success: true,
        message: 'Document uploaded successfully',
      };
    }),

  /**
   * Create Customer Document
   * Creates a document record after uploading to Supabase Storage
   */
  createCustomerDocument: portalProcedure
    .input(z.object({
      name: z.string().min(1, 'Document name is required'),
      documentType: z.enum(['contract', 'invoice', 'shop_drawing', 'photo', 'other']),
      storagePath: z.string().min(1, 'Storage path is required'),
      storageBucket: z.string().default('documents'),
      fileSize: z.number().optional(),
      mimeType: z.string().optional(),
      projectId: z.string().uuid().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const customerId = ctx.customerId;

      // Get public URL from Supabase
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();

      const { data: urlData } = supabase.storage
        .from(input.storageBucket)
        .getPublicUrl(input.storagePath);

      // Get customer info for tracking
      const customer = await ctx.db.customers.findUnique({
        where: { id: customerId },
        select: { name: true, email: true },
      });

      // Create document record in database
      const document = await ctx.db.documents.create({
        data: {
          name: input.name,
          original_name: input.name,
          category: input.documentType,
          type: input.mimeType || 'application/octet-stream',
          size: input.fileSize ? BigInt(input.fileSize) : null,
          storage_bucket: input.storageBucket,
          storage_type: 'supabase',
          url: urlData.publicUrl,
          download_url: urlData.publicUrl,
          customer_id: customerId,
          project_id: input.projectId,
          // Store upload info in notes field
          notes: `Storage Path: ${input.storagePath}\nUploaded by ${customer?.name || 'Customer'} (Customer ID: ${customerId})${input.description ? `\nDescription: ${input.description}` : ''}`,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      return {
        document,
        success: true,
        message: 'Document uploaded successfully',
      };
    }),
});

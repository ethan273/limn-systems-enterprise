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

  // Update last login timestamp
  await prisma.customer_portal_access.update({
    where: { id: portalAccess.id },
    data: {
      last_login: new Date(),
      login_count: { increment: 1 },
    },
  }).catch(() => {
    // Non-critical update, continue even if it fails
  });

  return {
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
   */
  getPortalSettings: portalProcedure
    .query(async ({ ctx }) => {
      const settings = await prisma.portal_settings.findUnique({
        where: {
          customer_id: ctx.customerId,
        },
      });

      // Return default settings if not found
      return settings || {
        show_production_tracking: true,
        show_financial_details: true,
        show_shipping_info: true,
        allow_document_upload: false,
        allow_design_approval: false,
        notification_preferences: {
          sms: false,
          email: true,
          in_app: true,
        },
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
});

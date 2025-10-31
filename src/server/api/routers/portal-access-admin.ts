/**
 * Portal Access Management Router
 * Admin-only endpoints for managing user portal access post-approval
 *
 * Features:
 * - List all portal users with their access
 * - View detailed access for specific user
 * - Update modules and portal types
 * - Revoke and reactivate access
 * - View access history/audit log
 */

import { z } from 'zod';
import { createTRPCRouter, adminProcedure } from '../trpc/init';
import { TRPCError } from '@trpc/server';

export const portalAccessAdminRouter = createTRPCRouter({
  /**
   * Get All Portal Users
   * Lists all users with active or inactive portal access
   */
  getAllPortalUsers: adminProcedure
    .input(z.object({
      portalType: z.enum(['customer', 'designer', 'factory', 'qc', 'all']).optional().default('all'),
      isActive: z.boolean().optional(),
      limit: z.number().min(1).max(100).optional().default(50),
      offset: z.number().min(0).optional().default(0),
    }))
    .query(async ({ ctx, input }) => {
      // Build where clause
      const where: any = {};

      if (input.portalType !== 'all') {
        where.portal_type = input.portalType;
      }

      if (input.isActive !== undefined) {
        where.is_active = input.isActive;
      }

      // Fetch portal access records with user info
      const accessRecords = await ctx.prisma.portal_access.findMany({
        where,
        take: input.limit,
        skip: input.offset,
        orderBy: { created_at: 'desc' },
        include: {
          users_portal_access_user_idTousers: {
            select: {
              id: true,
              email: true,
            },
          },
          users_portal_access_granted_byTousers: {
            select: {
              id: true,
              email: true,
            },
          },
          users_portal_access_revoked_byTousers: {
            select: {
              id: true,
              email: true,
            },
          },
          customers: {
            select: {
              id: true,
              name: true,
            },
          },
          partners: {
            select: {
              id: true,
              company_name: true,
            },
          },
        },
      });

      // Count total for pagination
      const total = await ctx.prisma.portal_access.count({ where });

      return {
        accessRecords: accessRecords.map((record) => ({
          id: record.id,
          userId: record.user_id,
          userEmail: record.users_portal_access_user_idTousers.email,
          portalType: record.portal_type,
          allowedModules: record.allowed_modules as string[],
          isActive: record.is_active,
          customerId: record.customer_id,
          customerName: record.customers?.name,
          partnerId: record.partner_id,
          partnerName: record.partners?.company_name,
          grantedBy: record.users_portal_access_granted_byTousers?.email,
          grantedAt: record.granted_at,
          revokedAt: record.revoked_at,
          revokedBy: record.users_portal_access_revoked_byTousers?.email,
          lastAccessedAt: record.last_accessed_at,
        })),
        total,
        hasMore: total > input.offset + input.limit,
      };
    }),

  /**
   * Get User Portal Access
   * Fetches all portal access records for a specific user
   */
  getUserPortalAccess: adminProcedure
    .input(z.object({
      userId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const accessRecords = await ctx.prisma.portal_access.findMany({
        where: { user_id: input.userId },
        orderBy: { created_at: 'desc' },
        include: {
          users_portal_access_user_idTousers: {
            select: {
              id: true,
              email: true,
            },
          },
          users_portal_access_granted_byTousers: {
            select: {
              id: true,
              email: true,
            },
          },
          users_portal_access_revoked_byTousers: {
            select: {
              id: true,
              email: true,
            },
          },
          customers: {
            select: {
              id: true,
              name: true,
            },
          },
          partners: {
            select: {
              id: true,
              company_name: true,
            },
          },
        },
      });

      if (!accessRecords || accessRecords.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No portal access found for this user',
        });
      }

      return {
        user: {
          id: accessRecords[0].users_portal_access_user_idTousers.id,
          email: accessRecords[0].users_portal_access_user_idTousers.email,
        },
        accessRecords: accessRecords.map((record) => ({
          id: record.id,
          portalType: record.portal_type,
          allowedModules: record.allowed_modules as string[],
          isActive: record.is_active,
          customerId: record.customer_id,
          customerName: record.customers?.name,
          partnerId: record.partner_id,
          partnerName: record.partners?.company_name,
          grantedBy: record.users_portal_access_granted_byTousers?.email,
          grantedAt: record.granted_at,
          revokedAt: record.revoked_at,
          revokedBy: record.users_portal_access_revoked_byTousers?.email,
          lastAccessedAt: record.last_accessed_at,
          metadata: record.metadata,
        })),
      };
    }),

  /**
   * Update Portal Access
   * Updates modules and/or portal type for an existing access record
   */
  updatePortalAccess: adminProcedure
    .input(z.object({
      accessId: z.string().uuid(),
      allowedModules: z.array(z.string()).min(1, 'At least one module is required'),
      portalType: z.enum(['customer', 'designer', 'factory', 'qc']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if access record exists
      const existingAccess = await ctx.prisma.portal_access.findUnique({
        where: { id: input.accessId },
      });

      if (!existingAccess) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Portal access record not found',
        });
      }

      // Update the record
      const updatedAccess = await ctx.prisma.portal_access.update({
        where: { id: input.accessId },
        data: {
          allowed_modules: input.allowedModules,
          portal_type: input.portalType || existingAccess.portal_type,
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        message: 'Portal access updated successfully',
        access: {
          id: updatedAccess.id,
          portalType: updatedAccess.portal_type,
          allowedModules: updatedAccess.allowed_modules as string[],
        },
      };
    }),

  /**
   * Revoke Portal Access
   * Sets is_active to false and records revocation details
   */
  revokePortalAccess: adminProcedure
    .input(z.object({
      accessId: z.string().uuid(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if access record exists
      const existingAccess = await ctx.prisma.portal_access.findUnique({
        where: { id: input.accessId },
      });

      if (!existingAccess) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Portal access record not found',
        });
      }

      if (!existingAccess.is_active) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Portal access is already revoked',
        });
      }

      // Revoke access
      const updatedAccess = await ctx.prisma.portal_access.update({
        where: { id: input.accessId },
        data: {
          is_active: false,
          revoked_at: new Date(),
          revoked_by: ctx.session.user.id,
          metadata: input.reason
            ? {
                ...(existingAccess.metadata as object || {}),
                revocationReason: input.reason
              }
            : (existingAccess.metadata ?? {}),
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        message: 'Portal access revoked successfully',
        access: {
          id: updatedAccess.id,
          isActive: updatedAccess.is_active,
          revokedAt: updatedAccess.revoked_at,
        },
      };
    }),

  /**
   * Reactivate Portal Access
   * Sets is_active to true and clears revocation details
   */
  reactivatePortalAccess: adminProcedure
    .input(z.object({
      accessId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if access record exists
      const existingAccess = await ctx.prisma.portal_access.findUnique({
        where: { id: input.accessId },
      });

      if (!existingAccess) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Portal access record not found',
        });
      }

      if (existingAccess.is_active) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Portal access is already active',
        });
      }

      // Reactivate access
      const updatedAccess = await ctx.prisma.portal_access.update({
        where: { id: input.accessId },
        data: {
          is_active: true,
          revoked_at: null,
          revoked_by: null,
          updated_at: new Date(),
        },
      });

      return {
        success: true,
        message: 'Portal access reactivated successfully',
        access: {
          id: updatedAccess.id,
          isActive: updatedAccess.is_active,
        },
      };
    }),

  /**
   * Add Portal Access
   * Grants a new portal access to an existing user
   */
  addPortalAccess: adminProcedure
    .input(z.object({
      userId: z.string().uuid(),
      portalType: z.enum(['customer', 'designer', 'factory', 'qc']),
      allowedModules: z.array(z.string()).min(1, 'At least one module is required'),
      customerId: z.string().uuid().optional(),
      partnerId: z.string().uuid().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user exists
      const user = await ctx.db.users.findUnique({
        where: { id: input.userId },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Check if user already has this portal type
      const existingAccess = await ctx.prisma.portal_access.findFirst({
        where: {
          user_id: input.userId,
          portal_type: input.portalType,
          is_active: true,
        },
      });

      if (existingAccess) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `User already has active ${input.portalType} portal access`,
        });
      }

      // Create new portal access
      const newAccess = await ctx.prisma.portal_access.create({
        data: {
          user_id: input.userId,
          portal_type: input.portalType,
          allowed_modules: input.allowedModules,
          customer_id: input.customerId || null,
          partner_id: input.partnerId || null,
          is_active: true,
          granted_by: ctx.session.user.id,
          granted_at: new Date(),
        },
      });

      return {
        success: true,
        message: 'Portal access granted successfully',
        access: {
          id: newAccess.id,
          userId: newAccess.user_id,
          portalType: newAccess.portal_type,
          allowedModules: newAccess.allowed_modules as string[],
        },
      };
    }),

  /**
   * Delete Portal Access
   * Permanently deletes a portal access record (use with caution)
   */
  deletePortalAccess: adminProcedure
    .input(z.object({
      accessId: z.string().uuid(),
      confirm: z.literal(true, {
        errorMap: () => ({ message: 'Must confirm deletion' }),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if access record exists
      const existingAccess = await ctx.prisma.portal_access.findUnique({
        where: { id: input.accessId },
      });

      if (!existingAccess) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Portal access record not found',
        });
      }

      // Delete the record
      await ctx.prisma.portal_access.delete({
        where: { id: input.accessId },
      });

      return {
        success: true,
        message: 'Portal access deleted permanently',
      };
    }),
});

/**
 * Security tRPC Router
 *
 * Provides API endpoints for security features (IP whitelisting, rate limiting, emergency access)
 */

import { z } from 'zod';
import { createTRPCRouter, superAdminProcedure } from '../../trpc/init';
import {
  validateIpWhitelist,
  validateDomainWhitelist,
  checkAccess,
} from '@/lib/api-management/access-control';
import {
  getRateLimitStatus,
  getAllRateLimitStats,
} from '@/lib/api-management/rate-limiter';
import {
  requestEmergencyAccess,
  checkEmergencyAccess,
  revokeEmergencyAccess,
  getActiveEmergencyAccess,
} from '@/lib/api-management/emergency-access';
import { logCredentialAccess } from '@/lib/api-management/audit-logger';

export const securityRouter = createTRPCRouter({
  /**
   * Update IP whitelist for a credential
   */
  updateIpWhitelist: superAdminProcedure
    .input(
      z.object({
        credentialId: z.string(),
        allowedIps: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate IP whitelist
      const validation = validateIpWhitelist(input.allowedIps);
      if (!validation.valid) {
        throw new Error(`Invalid IP whitelist: ${validation.errors.join(', ')}`);
      }

      // Update credential
      const updated = await ctx.db.api_credentials.update({
        where: { id: input.credentialId },
        data: {
          allowed_ips: input.allowedIps,
          updated_at: new Date(),
          updated_by: ctx.user?.id || null,
        },
      });

      // Log in audit trail
      await logCredentialAccess({
        credentialId: input.credentialId,
        action: 'update',
        userId: ctx.user?.id || null,
        ipAddress: null,
        userAgent: null,
        success: true,
        metadata: {
          ipWhitelistUpdated: true,
          allowedIpsCount: input.allowedIps.length,
        },
      });

      return updated;
    }),

  /**
   * Update domain whitelist for a credential
   */
  updateDomainWhitelist: superAdminProcedure
    .input(
      z.object({
        credentialId: z.string(),
        allowedDomains: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate domain whitelist
      const validation = validateDomainWhitelist(input.allowedDomains);
      if (!validation.valid) {
        throw new Error(`Invalid domain whitelist: ${validation.errors.join(', ')}`);
      }

      // Update credential
      const updated = await ctx.db.api_credentials.update({
        where: { id: input.credentialId },
        data: {
          allowed_domains: input.allowedDomains,
          updated_at: new Date(),
          updated_by: ctx.user?.id || null,
        },
      });

      // Log in audit trail
      await logCredentialAccess({
        credentialId: input.credentialId,
        action: 'update',
        userId: ctx.user?.id || null,
        ipAddress: null,
        userAgent: null,
        success: true,
        metadata: {
          domainWhitelistUpdated: true,
          allowedDomainsCount: input.allowedDomains.length,
        },
      });

      return updated;
    }),

  /**
   * Update rate limits for a credential
   */
  updateRateLimits: superAdminProcedure
    .input(
      z.object({
        credentialId: z.string(),
        rateLimit: z.number().min(0),
        concurrentLimit: z.number().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Update credential
      const updated = await ctx.db.api_credentials.update({
        where: { id: input.credentialId },
        data: {
          rate_limit: input.rateLimit,
          concurrent_limit: input.concurrentLimit,
          updated_at: new Date(),
          updated_by: ctx.user?.id || null,
        },
      });

      // Log in audit trail
      await logCredentialAccess({
        credentialId: input.credentialId,
        action: 'update',
        userId: ctx.user?.id || null,
        ipAddress: null,
        userAgent: null,
        success: true,
        metadata: {
          rateLimitsUpdated: true,
          rateLimit: input.rateLimit,
          concurrentLimit: input.concurrentLimit,
        },
      });

      return updated;
    }),

  /**
   * Check if access is allowed for a credential
   */
  checkAccess: superAdminProcedure
    .input(
      z.object({
        credentialId: z.string(),
        clientIp: z.string(),
        domain: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return await checkAccess(input);
    }),

  /**
   * Get rate limit status for a credential
   */
  getRateLimitStatus: superAdminProcedure
    .input(
      z.object({
        credentialId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const credential = await ctx.db.api_credentials.findUnique({
        where: { id: input.credentialId },
      });

      if (!credential) {
        throw new Error('Credential not found');
      }

      return await getRateLimitStatus(
        input.credentialId,
        credential.rate_limit || 0,
        credential.concurrent_limit || 0
      );
    }),

  /**
   * Get all rate limit statistics
   */
  getAllRateLimitStats: superAdminProcedure.query(async () => {
    return getAllRateLimitStats();
  }),

  /**
   * Request emergency access to a credential
   */
  requestEmergencyAccess: superAdminProcedure
    .input(
      z.object({
        credentialId: z.string(),
        reason: z.string().min(10),
        durationHours: z.number().min(1).max(24),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new Error('User ID is required');
      }

      return await requestEmergencyAccess({
        credentialId: input.credentialId,
        requestedBy: ctx.user.id,
        reason: input.reason,
        durationHours: input.durationHours,
      });
    }),

  /**
   * Check emergency access status for a credential
   */
  checkEmergencyAccess: superAdminProcedure
    .input(
      z.object({
        credentialId: z.string(),
      })
    )
    .query(async ({ input }) => {
      return await checkEmergencyAccess(input.credentialId);
    }),

  /**
   * Revoke emergency access for a credential
   */
  revokeEmergencyAccess: superAdminProcedure
    .input(
      z.object({
        credentialId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new Error('User ID is required');
      }

      await revokeEmergencyAccess({
        credentialId: input.credentialId,
        revokedBy: ctx.user.id,
      });

      return { success: true };
    }),

  /**
   * Get all credentials with active emergency access
   */
  getActiveEmergencyAccess: superAdminProcedure.query(async () => {
    return await getActiveEmergencyAccess();
  }),

  /**
   * Get security metrics overview
   */
  getSecurityMetrics: superAdminProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get audit log counts (using Prisma directly for new tables)
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const totalEvents = await prisma.api_credential_audit_logs.count({
      where: {
        created_at: {
          gte: last30Days,
        },
      },
    });

    const failedEvents = await prisma.api_credential_audit_logs.count({
      where: {
        created_at: {
          gte: last30Days,
        },
        success: false,
      },
    });

    // Get active emergency access count
    const activeEmergencyAccess = await ctx.db.api_credentials.count({
      where: {
        emergency_access_enabled: true,
      },
    });

    // Get credentials with IP whitelisting
    const ipWhitelistCount = await ctx.db.api_credentials.count({
      where: {
        allowed_ips: {
          isEmpty: false,
        },
      },
    });

    // Get credentials with rate limiting
    const rateLimitCount = await ctx.db.api_credentials.count({
      where: {
        rate_limit: {
          gt: 0,
        },
      },
    });

    return {
      totalEvents,
      failedEvents,
      activeEmergencyAccess,
      ipWhitelistCount,
      rateLimitCount,
      successRate: totalEvents > 0 ? ((totalEvents - failedEvents) / totalEvents) * 100 : 100,
    };
  }),
});

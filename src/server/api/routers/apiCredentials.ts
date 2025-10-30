import { log } from '@/lib/logger';
import { z } from 'zod';
import { createTRPCRouter, superAdminProcedure } from '../trpc/init';
import { encryptCredentials, maskCredential } from '@/lib/encryption/credentials';
import type { ApiCredentialWithRelations } from '@/types/api-credentials';

// Direct Prisma client for accessing users table (not exposed by Supabase wrapper)

export const apiCredentialsRouter = createTRPCRouter({
  /**
   * Get all API credentials (with masked sensitive data)
   */
  getAll: superAdminProcedure.query(async ({ ctx }): Promise<ApiCredentialWithRelations[]> => {
    try {
      // Note: include with select not supported by wrapper, fetching full records
      const credentials = await ctx.db.api_credentials.findMany({
        orderBy: { created_at: 'desc' },
      });

      // Get unique user IDs
      const userIds = new Set<string>();
      credentials.forEach(cred => {
        if (cred.created_by) userIds.add(cred.created_by);
        if (cred.updated_by) userIds.add(cred.updated_by);
      });

      // Fetch user data separately (use user_profiles, not users table)
      const users = await ctx.db.user_profiles.findMany({
        where: { id: { in: Array.from(userIds) } },
      });

      const userMap = new Map(users.map(u => [u.id, { email: u.email, id: u.id }]));

      // Mask sensitive credential data and add user relations
      return credentials.map((cred) => ({
        ...cred,
        credentials: maskCredentials(cred.credentials as Record<string, unknown>),
        users_api_credentials_created_byTousers: cred.created_by ? userMap.get(cred.created_by) ?? null : null,
        users_api_credentials_updated_byTousers: cred.updated_by ? userMap.get(cred.updated_by) ?? null : null,
      })) as ApiCredentialWithRelations[];
    } catch (error) {
      log.error('Error fetching API credentials:', { error });
      throw new Error('Failed to fetch API credentials');
    }
  }),

  /**
   * Get a single API credential by ID (decrypted for editing)
   */
  getById: superAdminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }): Promise<ApiCredentialWithRelations> => {
      try {
        // Note: include with select not supported by wrapper
        const credential = await ctx.db.api_credentials.findUnique({
          where: { id: input.id },
        });

        if (!credential) {
          throw new Error('API credential not found');
        }

        // Fetch related user data separately
        const userIds = [credential.created_by, credential.updated_by].filter((id): id is string => !!id);
        const users = userIds.length > 0
          ? await ctx.db.users.findMany({ where: { id: { in: userIds } } })
          : [];

        const userMap = new Map(users.map(u => [u.id, { email: u.email, id: u.id }]));

        // Return with decrypted credentials for editing
        // In production, consider additional authorization checks
        return {
          ...credential,
          credentials: credential.credentials as unknown as Record<string, string>,
          users_api_credentials_created_byTousers: credential.created_by ? userMap.get(credential.created_by) ?? null : null,
          users_api_credentials_updated_byTousers: credential.updated_by ? userMap.get(credential.updated_by) ?? null : null,
        } as ApiCredentialWithRelations;
      } catch (error) {
        log.error('Error fetching API credential:', { error });
        throw new Error('Failed to fetch API credential');
      }
    }),

  /**
   * Create new API credential
   */
  create: superAdminProcedure
    .input(
      z.object({
        service_name: z.string().min(1),
        display_name: z.string().min(1),
        description: z.string().optional(),
        credential_type: z.string().default('api_key'),
        credentials: z.record(z.unknown()),
        environment: z.string().default('production'),
        expires_at: z.string().optional(),
        service_template: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Encrypt credentials before storing
        const encryptedCredentials = encryptCredentials(input.credentials);

        const newCredential = await ctx.db.api_credentials.create({
          data: {
            service_name: input.service_name,
            display_name: input.display_name,
            description: input.description,
            credential_type: input.credential_type,
            credentials: encryptedCredentials as any,
            environment: input.environment,
            expires_at: input.expires_at ? new Date(input.expires_at) : null,
            service_template: input.service_template,
            created_by: ctx.user?.id || null,
            updated_by: ctx.user?.id || null,
            is_active: true,
          },
        });

        return newCredential;
      } catch (error) {
        log.error('Error creating API credential:', { error });
        throw new Error('Failed to create API credential');
      }
    }),

  /**
   * Update existing API credential
   */
  update: superAdminProcedure
    .input(
      z.object({
        id: z.string(),
        display_name: z.string().min(1).optional(),
        description: z.string().optional(),
        credentials: z.record(z.unknown()).optional(),
        environment: z.string().optional(),
        is_active: z.boolean().optional(),
        expires_at: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, credentials, ...rest } = input;

        // Encrypt credentials if provided
        const updateData: any = {
          ...rest,
          updated_by: ctx.user?.id || null,
        };

        if (credentials) {
          updateData.credentials = encryptCredentials(credentials) as any;
        }

        if (input.expires_at !== undefined) {
          updateData.expires_at = input.expires_at ? new Date(input.expires_at) : null;
        }

        const updatedCredential = await ctx.db.api_credentials.update({
          where: { id },
          data: updateData,
        });

        return updatedCredential;
      } catch (error) {
        log.error('Error updating API credential:', { error });
        throw new Error('Failed to update API credential');
      }
    }),

  /**
   * Delete API credential
   */
  delete: superAdminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db.api_credentials.delete({
          where: { id: input.id },
        });

        return { success: true };
      } catch (error) {
        log.error('Error deleting API credential:', { error });
        throw new Error('Failed to delete API credential');
      }
    }),

  /**
   * Update last_used_at timestamp
   */
  recordUsage: superAdminProcedure
    .input(z.object({ service_name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.db.api_credentials.update({
          where: { service_name: input.service_name },
          data: { last_used_at: new Date() },
        });

        return { success: true };
      } catch (error) {
        log.error('Error recording API usage:', { error });
        throw new Error('Failed to record API usage');
      }
    }),

  /**
   * Get expiring credentials (within next 30 days)
   */
  getExpiring: superAdminProcedure.query(async ({ ctx }): Promise<ApiCredentialWithRelations[]> => {
    try {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const now = new Date();

      // WORKAROUND: Fetch all active credentials and filter in memory to avoid Supabase timezone bug
      const allCredentials = await ctx.db.api_credentials.findMany({
        where: {
          is_active: true,
        },
        orderBy: { expires_at: 'asc' },
      });

      // Filter for expiring credentials in memory
      const expiringCredentials = allCredentials.filter((cred) => {
        if (!cred.expires_at) return false;
        const expiresAt = new Date(cred.expires_at);
        return expiresAt >= now && expiresAt <= thirtyDaysFromNow;
      });

      // Get unique user IDs
      const userIds = new Set<string>();
      expiringCredentials.forEach(cred => {
        if (cred.created_by) userIds.add(cred.created_by);
        if (cred.updated_by) userIds.add(cred.updated_by);
      });

      // Fetch user data separately if needed
      const users = userIds.size > 0
        ? await ctx.db.users.findMany({ where: { id: { in: Array.from(userIds) } } })
        : [];

      const userMap = new Map(users.map(u => [u.id, { email: u.email, id: u.id }]));

      return expiringCredentials.map((cred) => ({
        ...cred,
        credentials: maskCredentials(cred.credentials as Record<string, unknown>),
        users_api_credentials_created_byTousers: cred.created_by ? userMap.get(cred.created_by) ?? null : null,
        users_api_credentials_updated_byTousers: cred.updated_by ? userMap.get(cred.updated_by) ?? null : null,
      })) as ApiCredentialWithRelations[];
    } catch (error) {
      log.error('Error fetching expiring credentials:', { error });
      throw new Error('Failed to fetch expiring credentials');
    }
  }),

  /**
   * Get usage analytics for all or specific API key
   */
  getUsageAnalytics: superAdminProcedure
    .input(z.object({
      service_name: z.string().optional(),
      days: z.number().min(1).max(90).default(7),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const { service_name, days } = input;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const whereClause: any = {
          created_at: { gte: startDate },
        };

        if (service_name) {
          whereClause.service_name = service_name;
        }

        // Get all usage logs for the period
        const usageLogs = await ctx.db.api_usage_logs.findMany({
          where: whereClause,
          orderBy: { created_at: 'asc' },
        });

        // Calculate aggregate metrics
        const totalRequests = usageLogs.length;
        const successfulRequests = usageLogs.filter(log =>
          log.status_code && log.status_code >= 200 && log.status_code < 300
        ).length;
        const errorRequests = usageLogs.filter(log =>
          log.status_code && log.status_code >= 400
        ).length;

        const avgResponseTime = usageLogs.length > 0
          ? usageLogs.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / usageLogs.length
          : 0;

        const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;

        // Group by day for time series
        const dailyStats = usageLogs.reduce((acc, log) => {
          const day = log.created_at?.toISOString().split('T')[0] || '';
          // eslint-disable-next-line security/detect-object-injection
          if (!acc[day]) { // Safe: day is validated ISO date string
            // eslint-disable-next-line security/detect-object-injection
            acc[day] = { requests: 0, errors: 0, totalResponseTime: 0, count: 0 }; // Safe: day is validated ISO date string
          }
          // eslint-disable-next-line security/detect-object-injection
          acc[day].requests += 1; // Safe: day is validated ISO date string
          if (log.status_code && log.status_code >= 400) {
            // eslint-disable-next-line security/detect-object-injection
            acc[day].errors += 1; // Safe: day is validated ISO date string
          }
          if (log.response_time_ms) {
            // eslint-disable-next-line security/detect-object-injection
            acc[day].totalResponseTime += log.response_time_ms; // Safe: day is validated ISO date string
            // eslint-disable-next-line security/detect-object-injection
            acc[day].count += 1; // Safe: day is validated ISO date string
          }
          return acc;
        }, {} as Record<string, any>);

        const timeSeries = Object.entries(dailyStats).map(([date, stats]) => ({
          date,
          requests: stats.requests,
          errors: stats.errors,
          avgResponseTime: stats.count > 0 ? stats.totalResponseTime / stats.count : 0,
          errorRate: stats.requests > 0 ? (stats.errors / stats.requests) * 100 : 0,
        }));

        return {
          totalRequests,
          successfulRequests,
          errorRequests,
          avgResponseTime: Math.round(avgResponseTime),
          errorRate: Math.round(errorRate * 100) / 100,
          timeSeries,
        };
      } catch (error) {
        log.error('Error fetching usage analytics:', { error });
        throw new Error('Failed to fetch usage analytics');
      }
    }),

  /**
   * Get security metrics and alerts
   */
  getSecurityMetrics: superAdminProcedure.query(async ({ ctx }) => {
    try {
      const now = new Date();

      // Get all credentials
      const allCredentials = await ctx.db.api_credentials.findMany({
        where: { is_active: true },
      });

      const alerts: Array<{
        type: string;
        severity: string;
        service: string;
        message: string;
        daysOverdue?: number;
        daysUntilExpiry?: number;
        daysOld?: number;
      }> = [];
      let securityScore = 100;

      for (const cred of allCredentials) {
        // Check expiration
        if (cred.expires_at) {
          const daysUntilExpiry = Math.ceil(
            (new Date(cred.expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysUntilExpiry < 0) {
            alerts.push({
              type: 'expired',
              severity: 'critical',
              service: cred.display_name,
              message: 'Credentials have expired',
              daysOverdue: Math.abs(daysUntilExpiry),
            });
            securityScore -= 20;
          } else if (daysUntilExpiry <= 7) {
            alerts.push({
              type: 'expiring_soon',
              severity: 'warning',
              service: cred.display_name,
              message: `Expires in ${daysUntilExpiry} days`,
              daysUntilExpiry,
            });
            securityScore -= 10;
          }
        }

        // Check age
        const daysOld = Math.floor(
          (now.getTime() - new Date(cred.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysOld >= 120) {
          alerts.push({
            type: 'rotation_overdue',
            severity: 'warning',
            service: cred.display_name,
            message: `Credentials are ${daysOld} days old`,
            daysOld,
          });
          securityScore -= 5;
        } else if (daysOld >= 90) {
          alerts.push({
            type: 'rotation_due',
            severity: 'info',
            service: cred.display_name,
            message: `Consider rotating (${daysOld} days old)`,
            daysOld,
          });
          securityScore -= 3;
        }
      }

      // Get recent error rate
      const last24Hours = new Date();
      last24Hours.setHours(last24Hours.getHours() - 24);

      const recentLogs = await ctx.db.api_usage_logs.findMany({
        where: { created_at: { gte: last24Hours } },
      });

      const recentErrorRate = recentLogs.length > 0
        ? (recentLogs.filter(log => log.status_code && log.status_code >= 400).length / recentLogs.length) * 100
        : 0;

      const avgResponseTime = recentLogs.length > 0
        ? recentLogs.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / recentLogs.length
        : 0;

      return {
        securityScore: Math.max(0, securityScore),
        alerts,
        recentErrorRate: Math.round(recentErrorRate * 100) / 100,
        avgResponseTime: Math.round(avgResponseTime),
        totalCredentials: allCredentials.length,
        activeAlerts: alerts.filter(a => a.severity === 'critical' || a.severity === 'warning').length,
      };
    } catch (error) {
      log.error('Error fetching security metrics:', { error });
      throw new Error('Failed to fetch security metrics');
    }
  }),

  /**
   * Scan environment files for API keys
   */
  scanEnvironment: superAdminProcedure.query(async () => {
    try {
      const { scanEnvironmentForAPIKeys, getRecommendedAPIs } = await import('@/lib/credentials/env-scanner');

      const detectedKeys = scanEnvironmentForAPIKeys();
      const recommendations = getRecommendedAPIs(detectedKeys);

      return {
        detected: detectedKeys,
        recommended: recommendations,
        summary: {
          total: recommendations.length,
          configured: recommendations.filter(r => r.isConfigured).length,
          needed: recommendations.filter(r => !r.isConfigured).length,
        },
      };
    } catch (error) {
      log.error('Error scanning environment:', { error });
      throw new Error('Failed to scan environment files');
    }
  }),

  /**
   * Get rotation schedule data
   */
  getRotationSchedule: superAdminProcedure.query(async ({ ctx }) => {
    try {
      const now = new Date();

      const allCredentials = await ctx.db.api_credentials.findMany({
        where: { is_active: true },
        orderBy: { created_at: 'asc' },
      });

      const scheduleItems = allCredentials.map(cred => {
        const createdDate = new Date(cred.created_at);
        const daysOld = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

        // Recommend rotation every 90 days
        const recommendedRotationDate = new Date(createdDate);
        recommendedRotationDate.setDate(recommendedRotationDate.getDate() + 90);

        const daysUntilRotation = Math.ceil(
          (recommendedRotationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        let status: 'upcoming' | 'overdue' | 'current' = 'upcoming';
        if (daysUntilRotation < 0) {
          status = 'overdue';
        } else if (daysUntilRotation <= 30) {
          status = 'upcoming';
        } else {
          status = 'current';
        }

        return {
          id: cred.id,
          serviceName: cred.service_name,
          displayName: cred.display_name,
          createdAt: cred.created_at,
          lastUsedAt: cred.last_used_at,
          daysOld,
          recommendedRotationDate,
          daysUntilRotation,
          status,
          expiresAt: cred.expires_at,
        };
      });

      const upcoming = scheduleItems.filter(item =>
        item.status === 'upcoming' || (item.daysUntilRotation > 0 && item.daysUntilRotation <= 30)
      );
      const overdue = scheduleItems.filter(item => item.status === 'overdue');
      const current = scheduleItems.filter(item => item.status === 'current');

      return {
        total: scheduleItems.length,
        upcoming: upcoming.length,
        overdue: overdue.length,
        current: current.length,
        schedule: scheduleItems,
      };
    } catch (error) {
      log.error('Error fetching rotation schedule:', { error });
      throw new Error('Failed to fetch rotation schedule');
    }
  }),
});

/**
 * Mask credentials for display
 */
function maskCredentials(credentials: Record<string, unknown>): Record<string, string> {
  const masked: Record<string, string> = {};

  for (const [key, value] of Object.entries(credentials)) {
    if (typeof value === 'string') {
      // eslint-disable-next-line security/detect-object-injection
      masked[key] = maskCredential(value); // Safe: key is from Object.entries iteration
    } else {
      // eslint-disable-next-line security/detect-object-injection
      masked[key] = '[ENCRYPTED]'; // Safe: key is from Object.entries iteration
    }
  }

  return masked;
}

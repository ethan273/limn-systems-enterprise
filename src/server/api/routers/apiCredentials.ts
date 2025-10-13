import { z } from 'zod';
import { createTRPCRouter, superAdminProcedure } from '../trpc/init';
import { encryptCredentials, decryptCredentials, maskCredential } from '@/lib/encryption/credentials';

export const apiCredentialsRouter = createTRPCRouter({
  /**
   * Get all API credentials (with masked sensitive data)
   */
  getAll: superAdminProcedure.query(async ({ ctx }) => {
    try {
      const credentials = await ctx.db.api_credentials.findMany({
        orderBy: { created_at: 'desc' },
        include: {
          users_api_credentials_created_byTousers: {
            select: {
              email: true,
              id: true,
            },
          },
          users_api_credentials_updated_byTousers: {
            select: {
              email: true,
              id: true,
            },
          },
        },
      });

      // Mask sensitive credential data
      return credentials.map((cred) => ({
        ...cred,
        credentials: maskCredentials(cred.credentials as Record<string, unknown>),
      }));
    } catch (error) {
      console.error('Error fetching API credentials:', error);
      throw new Error('Failed to fetch API credentials');
    }
  }),

  /**
   * Get a single API credential by ID (decrypted for editing)
   */
  getById: superAdminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const credential = await ctx.db.api_credentials.findUnique({
          where: { id: input.id },
          include: {
            users_api_credentials_created_byTousers: {
              select: {
                email: true,
                id: true,
              },
            },
            users_api_credentials_updated_byTousers: {
              select: {
                email: true,
                id: true,
              },
            },
          },
        });

        if (!credential) {
          throw new Error('API credential not found');
        }

        // Return with decrypted credentials for editing
        // In production, consider additional authorization checks
        return {
          ...credential,
          credentials: credential.credentials as Record<string, unknown>,
        };
      } catch (error) {
        console.error('Error fetching API credential:', error);
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
            created_by: ctx.user?.id || null,
            updated_by: ctx.user?.id || null,
            is_active: true,
          },
        });

        return newCredential;
      } catch (error) {
        console.error('Error creating API credential:', error);
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
        console.error('Error updating API credential:', error);
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
        console.error('Error deleting API credential:', error);
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
        console.error('Error recording API usage:', error);
        throw new Error('Failed to record API usage');
      }
    }),

  /**
   * Get expiring credentials (within next 30 days)
   */
  getExpiring: superAdminProcedure.query(async ({ ctx }) => {
    try {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const expiringCredentials = await ctx.db.api_credentials.findMany({
        where: {
          is_active: true,
          expires_at: {
            lte: thirtyDaysFromNow,
            gte: new Date(),
          },
        },
        orderBy: { expires_at: 'asc' },
      });

      return expiringCredentials.map((cred) => ({
        ...cred,
        credentials: maskCredentials(cred.credentials as Record<string, unknown>),
      }));
    } catch (error) {
      console.error('Error fetching expiring credentials:', error);
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
          if (!acc[day]) {
            acc[day] = { requests: 0, errors: 0, totalResponseTime: 0, count: 0 };
          }
          acc[day].requests += 1;
          if (log.status_code && log.status_code >= 400) {
            acc[day].errors += 1;
          }
          if (log.response_time_ms) {
            acc[day].totalResponseTime += log.response_time_ms;
            acc[day].count += 1;
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
        console.error('Error fetching usage analytics:', error);
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
      console.error('Error fetching security metrics:', error);
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
      console.error('Error scanning environment:', error);
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
      console.error('Error fetching rotation schedule:', error);
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
      masked[key] = maskCredential(value);
    } else {
      masked[key] = '[ENCRYPTED]';
    }
  }

  return masked;
}

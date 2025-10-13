/**
 * Health Monitoring System for API Credentials
 *
 * Provides automated health checking with service-specific validation strategies
 * Runs every 15 minutes to detect issues before they impact production
 */

import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Health check status
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

/**
 * Health check result
 */
export interface HealthCheckResult {
  id: string;
  credential_id: string;
  status: HealthStatus;
  response_time_ms: number | null;
  error_message: string | null;
  checked_at: Date;
  metadata: Prisma.JsonValue | null;
}

/**
 * Current health status with recent history
 */
export interface CurrentHealthStatus {
  credential_id: string;
  current_status: HealthStatus;
  last_checked_at: Date | null;
  consecutive_failures: number;
  recent_checks: HealthCheckResult[];
}

/**
 * Uptime metrics
 */
export interface UptimeMetrics {
  credential_id: string;
  period_days: number;
  total_checks: number;
  successful_checks: number;
  failed_checks: number;
  uptime_percentage: number;
  average_response_time_ms: number;
  incidents: HealthIncident[];
}

/**
 * Health incident
 */
export interface HealthIncident {
  started_at: Date;
  ended_at: Date | null;
  duration_minutes: number | null;
  status: HealthStatus;
  error_message: string | null;
}

/**
 * Health check strategy based on service type
 */
interface HealthCheckStrategy {
  name: string;
  check: (credential: any) => Promise<{
    success: boolean;
    responseTime: number;
    error?: string;
    metadata?: Record<string, unknown>;
  }>;
}

/**
 * Get health check strategy for a service type
 */
function getHealthCheckStrategy(serviceType: string): HealthCheckStrategy {
  switch (serviceType.toLowerCase()) {
    case 'stripe':
      return {
        name: 'Stripe Balance Check',
        check: async (credential) => {
          const startTime = Date.now();
          try {
            // For Stripe, we'd call the /v1/balance endpoint
            // This is a placeholder - actual implementation would use Stripe SDK
            const response = await fetch('https://api.stripe.com/v1/balance', {
              headers: {
                'Authorization': `Bearer ${credential.decryptedValue}`,
              },
            });

            const responseTime = Date.now() - startTime;

            if (response.ok) {
              return {
                success: true,
                responseTime,
                metadata: { statusCode: response.status },
              };
            }

            return {
              success: false,
              responseTime,
              error: `HTTP ${response.status}: ${response.statusText}`,
              metadata: { statusCode: response.status },
            };
          } catch (error) {
            return {
              success: false,
              responseTime: Date.now() - startTime,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        },
      };

    case 'google_oauth':
      return {
        name: 'Google OAuth Token Validation',
        check: async (credential) => {
          const startTime = Date.now();
          try {
            // For Google OAuth, we'd validate the token
            const response = await fetch(
              `https://oauth2.googleapis.com/tokeninfo?access_token=${credential.decryptedValue}`
            );

            const responseTime = Date.now() - startTime;

            if (response.ok) {
              return {
                success: true,
                responseTime,
                metadata: { statusCode: response.status },
              };
            }

            return {
              success: false,
              responseTime,
              error: `HTTP ${response.status}: ${response.statusText}`,
              metadata: { statusCode: response.status },
            };
          } catch (error) {
            return {
              success: false,
              responseTime: Date.now() - startTime,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        },
      };

    default:
      return {
        name: 'Generic Connectivity Check',
        check: async (credential) => {
          const startTime = Date.now();
          try {
            // For custom APIs, use the configured test endpoint if available
            const testEndpoint = credential.test_endpoint || credential.base_url;

            if (!testEndpoint) {
              return {
                success: true,
                responseTime: 0,
                metadata: { reason: 'No test endpoint configured, assuming healthy' },
              };
            }

            const response = await fetch(testEndpoint, {
              method: 'HEAD',
              signal: AbortSignal.timeout(10000), // 10 second timeout
            });

            const responseTime = Date.now() - startTime;

            if (response.ok || response.status === 401 || response.status === 403) {
              // 401/403 means the endpoint is reachable but requires auth
              // This is considered healthy for connectivity purposes
              return {
                success: true,
                responseTime,
                metadata: { statusCode: response.status },
              };
            }

            return {
              success: false,
              responseTime,
              error: `HTTP ${response.status}: ${response.statusText}`,
              metadata: { statusCode: response.status },
            };
          } catch (error) {
            return {
              success: false,
              responseTime: Date.now() - startTime,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        },
      };
  }
}

/**
 * Perform health check for a credential
 *
 * @param credentialId - Credential ID to check
 * @returns Health check result
 */
export async function performHealthCheck(
  credentialId: string
): Promise<HealthCheckResult> {
  try {
    // Get credential details
    const credential = await prisma.api_credentials.findUnique({
      where: { id: credentialId },
      include: {
        service_templates: true,
      },
    });

    if (!credential) {
      throw new Error('Credential not found');
    }

    // Get appropriate health check strategy
    const strategy = getHealthCheckStrategy(
      credential.service_templates?.service_type || 'custom'
    );

    // Decrypt credential (placeholder - would use actual decryption)
    const decryptedCredential = {
      ...credential,
      decryptedValue: credential.encrypted_value, // Placeholder
      test_endpoint: (credential.metadata as any)?.test_endpoint,
      base_url: (credential.metadata as any)?.base_url,
    };

    // Perform health check
    const result = await strategy.check(decryptedCredential);

    // Determine status
    let status: HealthStatus;
    if (result.success) {
      if (result.responseTime > 5000) {
        status = 'degraded'; // Slow response
      } else {
        status = 'healthy';
      }
    } else {
      status = 'unhealthy';
    }

    // Store health check result
    const healthCheck = await prisma.api_credential_health_checks.create({
      data: {
        credential_id: credentialId,
        status,
        response_time_ms: result.responseTime,
        error_message: result.error || undefined,
        metadata: result.metadata || undefined,
      } as any,
    });

    return healthCheck;
  } catch (error) {
    // Log error but don't fail completely
    console.error('Health check failed:', error);

    // Store failure in database
    const healthCheck = await prisma.api_credential_health_checks.create({
      data: {
        credential_id: credentialId,
        status: 'unhealthy',
        response_time_ms: null,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        metadata: null,
      } as any,
    });

    return healthCheck;
  }
}

/**
 * Get current health status for a credential
 *
 * @param credentialId - Credential ID
 * @returns Current health status with recent history
 */
export async function getHealthStatus(
  credentialId: string
): Promise<CurrentHealthStatus> {
  // Get recent health checks (last 10)
  const recentChecks = await prisma.api_credential_health_checks.findMany({
    where: { credential_id: credentialId },
    orderBy: { checked_at: 'desc' },
    take: 10,
  });

  if (recentChecks.length === 0) {
    return {
      credential_id: credentialId,
      current_status: 'unknown',
      last_checked_at: null,
      consecutive_failures: 0,
      recent_checks: [],
    };
  }

  // Calculate consecutive failures
  let consecutiveFailures = 0;
  for (const check of recentChecks) {
    if (check.status === 'unhealthy') {
      consecutiveFailures++;
    } else {
      break;
    }
  }

  return {
    credential_id: credentialId,
    current_status: recentChecks[0].status as HealthStatus,
    last_checked_at: recentChecks[0].checked_at,
    consecutive_failures: consecutiveFailures,
    recent_checks: recentChecks,
  };
}

/**
 * Get health check history for a credential
 *
 * @param credentialId - Credential ID
 * @param days - Number of days of history to retrieve
 * @returns Health check results
 */
export async function getHealthHistory(
  credentialId: string,
  days = 30
): Promise<HealthCheckResult[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const checks = await prisma.api_credential_health_checks.findMany({
    where: {
      credential_id: credentialId,
      checked_at: { gte: startDate },
    },
    orderBy: { checked_at: 'desc' },
  });

  return checks;
}

/**
 * Calculate uptime metrics for a credential
 *
 * @param credentialId - Credential ID
 * @param days - Number of days to calculate metrics for
 * @returns Uptime metrics
 */
export async function calculateUptime(
  credentialId: string,
  days = 30
): Promise<UptimeMetrics> {
  const checks = await getHealthHistory(credentialId, days);

  if (checks.length === 0) {
    return {
      credential_id: credentialId,
      period_days: days,
      total_checks: 0,
      successful_checks: 0,
      failed_checks: 0,
      uptime_percentage: 0,
      average_response_time_ms: 0,
      incidents: [],
    };
  }

  const totalChecks = checks.length;
  const successfulChecks = checks.filter(
    (c) => c.status === 'healthy' || c.status === 'degraded'
  ).length;
  const failedChecks = totalChecks - successfulChecks;
  const uptimePercentage = (successfulChecks / totalChecks) * 100;

  // Calculate average response time (excluding null values)
  const responseTimes = checks
    .map((c) => c.response_time_ms)
    .filter((rt): rt is number => rt !== null);
  const averageResponseTime =
    responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

  // Identify incidents (periods of consecutive failures)
  const incidents: HealthIncident[] = [];
  let currentIncident: HealthIncident | null = null;

  // Process checks in chronological order
  for (let i = checks.length - 1; i >= 0; i--) {
    const check = checks[i];

    if (check.status === 'unhealthy') {
      if (!currentIncident) {
        // Start new incident
        currentIncident = {
          started_at: check.checked_at,
          ended_at: null,
          duration_minutes: null,
          status: check.status as HealthStatus,
          error_message: check.error_message,
        };
      }
    } else if (currentIncident) {
      // End current incident
      currentIncident.ended_at = check.checked_at;
      currentIncident.duration_minutes = Math.round(
        (currentIncident.ended_at.getTime() - currentIncident.started_at.getTime()) /
          (1000 * 60)
      );
      incidents.push(currentIncident);
      currentIncident = null;
    }
  }

  // If there's an ongoing incident, add it
  if (currentIncident) {
    currentIncident.ended_at = new Date();
    currentIncident.duration_minutes = Math.round(
      (currentIncident.ended_at.getTime() - currentIncident.started_at.getTime()) /
        (1000 * 60)
    );
    incidents.push(currentIncident);
  }

  return {
    credential_id: credentialId,
    period_days: days,
    total_checks: totalChecks,
    successful_checks: successfulChecks,
    failed_checks: failedChecks,
    uptime_percentage: Math.round(uptimePercentage * 100) / 100,
    average_response_time_ms: Math.round(averageResponseTime),
    incidents,
  };
}

/**
 * Perform health checks for all active credentials
 *
 * @returns Results of all health checks
 */
export async function performAllHealthChecks(): Promise<{
  total: number;
  successful: number;
  failed: number;
  results: HealthCheckResult[];
}> {
  // Get all active credentials
  const credentials = await prisma.api_credentials.findMany({
    where: {
      status: 'active',
    },
    select: {
      id: true,
    },
  });

  console.log(`Starting health checks for ${credentials.length} credentials...`);

  const results: HealthCheckResult[] = [];
  let successful = 0;
  let failed = 0;

  // Process in batches to avoid overwhelming the system
  const batchSize = 5;
  for (let i = 0; i < credentials.length; i += batchSize) {
    const batch = credentials.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(async (cred) => {
        try {
          const result = await performHealthCheck(cred.id);
          if (result.status === 'healthy' || result.status === 'degraded') {
            successful++;
          } else {
            failed++;
          }
          return result;
        } catch (error) {
          console.error(`Health check failed for ${cred.id}:`, error);
          failed++;
          return null;
        }
      })
    );

    results.push(...batchResults.filter((r): r is HealthCheckResult => r !== null));
  }

  console.log(`Health checks completed: ${successful} successful, ${failed} failed`);

  return {
    total: credentials.length,
    successful,
    failed,
    results,
  };
}

/**
 * Get health dashboard summary for all credentials
 *
 * @returns Dashboard summary with health status for all credentials
 */
export async function getHealthDashboard(): Promise<{
  total_credentials: number;
  healthy: number;
  degraded: number;
  unhealthy: number;
  unknown: number;
  credentials: Array<{
    id: string;
    name: string;
    service_type: string;
    status: HealthStatus;
    last_checked_at: Date | null;
    uptime_24h: number;
    consecutive_failures: number;
  }>;
}> {
  // Get all credentials with their latest health check
  const credentials = await prisma.api_credentials.findMany({
    where: {
      status: 'active',
    },
    include: {
      service_templates: {
        select: {
          service_type: true,
        },
      },
    },
  });

  const dashboard: {
    total_credentials: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
    unknown: number;
    credentials: Array<{
      id: string;
      name: string;
      service_type: string;
      status: HealthStatus;
      last_checked_at: Date | null;
      uptime_24h: number;
      consecutive_failures: number;
    }>;
  } = {
    total_credentials: credentials.length,
    healthy: 0,
    degraded: 0,
    unhealthy: 0,
    unknown: 0,
    credentials: [],
  };

  for (const cred of credentials) {
    const healthStatus = await getHealthStatus(cred.id);
    const uptime = await calculateUptime(cred.id, 1); // 24 hours

    dashboard.credentials.push({
      id: cred.id,
      name: cred.name,
      service_type: cred.service_templates?.service_type || 'custom',
      status: healthStatus.current_status,
      last_checked_at: healthStatus.last_checked_at,
      uptime_24h: uptime.uptime_percentage,
      consecutive_failures: healthStatus.consecutive_failures,
    });

    // Update counters
    switch (healthStatus.current_status) {
      case 'healthy':
        dashboard.healthy++;
        break;
      case 'degraded':
        dashboard.degraded++;
        break;
      case 'unhealthy':
        dashboard.unhealthy++;
        break;
      default:
        dashboard.unknown++;
    }
  }

  return dashboard;
}

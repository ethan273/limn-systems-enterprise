/**
 * Background Jobs System for API Management
 *
 * Handles scheduled tasks for health monitoring, expiration checks, and cleanup
 */

import { PrismaClient } from '@prisma/client';
import { performAllHealthChecks } from './health-monitor';
import { expireEmergencyAccess } from './emergency-access';

const prisma = new PrismaClient();

/**
 * Job types
 */
export type JobType =
  | 'health_check'
  | 'emergency_expiration'
  | 'credential_expiration_warning'
  | 'audit_log_cleanup'
  | 'health_history_cleanup';

/**
 * Job status
 */
export type JobStatus = 'running' | 'completed' | 'failed';

/**
 * Job result
 */
export interface JobResult {
  jobType: JobType;
  status: JobStatus;
  startedAt: Date;
  completedAt: Date;
  duration_ms: number;
  itemsProcessed: number;
  itemsSucceeded: number;
  itemsFailed: number;
  errors: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Job execution record
 */
export interface JobExecutionRecord {
  id: string;
  job_type: JobType;
  status: JobStatus;
  started_at: Date;
  completed_at: Date | null;
  duration_ms: number | null;
  items_processed: number;
  items_succeeded: number;
  items_failed: number;
  error_message: string | null;
  metadata: any;
}

/**
 * Track job execution in database (future enhancement)
 */
async function recordJobExecution(result: JobResult): Promise<void> {
  try {
    // This would store job execution history in a dedicated table
    // For now, we'll just log it
    console.log('Job execution completed:', {
      type: result.jobType,
      status: result.status,
      duration: result.duration_ms,
      processed: result.itemsProcessed,
      succeeded: result.itemsSucceeded,
      failed: result.itemsFailed,
    });
  } catch (error) {
    console.error('Failed to record job execution:', error);
  }
}

/**
 * Health Check Job
 * Runs every 15 minutes to check health of all active credentials
 */
export async function runHealthCheckJob(): Promise<JobResult> {
  const startedAt = new Date();
  const errors: string[] = [];

  console.log('[Health Check Job] Starting...');

  try {
    const result = await performAllHealthChecks();

    const completedAt = new Date();
    const duration = completedAt.getTime() - startedAt.getTime();

    const jobResult: JobResult = {
      jobType: 'health_check',
      status: 'completed',
      startedAt,
      completedAt,
      duration_ms: duration,
      itemsProcessed: result.total,
      itemsSucceeded: result.successful,
      itemsFailed: result.failed,
      errors: [],
      metadata: {
        checks_performed: result.results.length,
      },
    };

    await recordJobExecution(jobResult);

    console.log(
      `[Health Check Job] Completed: ${result.successful}/${result.total} healthy`
    );

    return jobResult;
  } catch (error) {
    const completedAt = new Date();
    const duration = completedAt.getTime() - startedAt.getTime();

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(errorMessage);

    console.error('[Health Check Job] Failed:', errorMessage);

    const jobResult: JobResult = {
      jobType: 'health_check',
      status: 'failed',
      startedAt,
      completedAt,
      duration_ms: duration,
      itemsProcessed: 0,
      itemsSucceeded: 0,
      itemsFailed: 0,
      errors,
    };

    await recordJobExecution(jobResult);

    return jobResult;
  }
}

/**
 * Emergency Access Expiration Job
 * Runs every 5 minutes to expire emergency access grants
 */
export async function runEmergencyExpirationJob(): Promise<JobResult> {
  const startedAt = new Date();
  const errors: string[] = [];

  console.log('[Emergency Expiration Job] Starting...');

  try {
    const expiredCount = await expireEmergencyAccess();

    const completedAt = new Date();
    const duration = completedAt.getTime() - startedAt.getTime();

    const jobResult: JobResult = {
      jobType: 'emergency_expiration',
      status: 'completed',
      startedAt,
      completedAt,
      duration_ms: duration,
      itemsProcessed: expiredCount,
      itemsSucceeded: expiredCount,
      itemsFailed: 0,
      errors: [],
    };

    await recordJobExecution(jobResult);

    console.log(
      `[Emergency Expiration Job] Completed: ${expiredCount} access grants expired`
    );

    return jobResult;
  } catch (error) {
    const completedAt = new Date();
    const duration = completedAt.getTime() - startedAt.getTime();

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(errorMessage);

    console.error('[Emergency Expiration Job] Failed:', errorMessage);

    const jobResult: JobResult = {
      jobType: 'emergency_expiration',
      status: 'failed',
      startedAt,
      completedAt,
      duration_ms: duration,
      itemsProcessed: 0,
      itemsSucceeded: 0,
      itemsFailed: 0,
      errors,
    };

    await recordJobExecution(jobResult);

    return jobResult;
  }
}

/**
 * Credential Expiration Warning Job
 * Runs daily to check for credentials expiring soon
 */
export async function runCredentialExpirationWarningJob(): Promise<JobResult> {
  const startedAt = new Date();
  const errors: string[] = [];

  console.log('[Expiration Warning Job] Starting...');

  try {
    // Get all active credentials with expiry dates
    const now = new Date();
    const thresholds = [30, 14, 7, 1]; // Days before expiry to warn
    let totalProcessed = 0;
    let totalWarnings = 0;

    for (const days of thresholds) {
      const expiryDate = new Date(now);
      expiryDate.setDate(expiryDate.getDate() + days);

      // Find credentials expiring on this threshold
      const expiringCredentials = await prisma.api_credentials.findMany({
        where: {
          is_active: true,
          expires_at: {
            gte: now,
            lte: expiryDate,
          },
        },
      });

      totalProcessed += expiringCredentials.length;

      for (const credential of expiringCredentials) {
        // Check if we've already warned for this threshold
        const lastWarning = await prisma.api_credential_audit_logs.findFirst({
          where: {
            credential_id: credential.id,
            action: 'expiration_warning',
            created_at: {
              gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        });

        if (!lastWarning) {
          // Log warning
          await prisma.api_credential_audit_logs.create({
            data: {
              credential_id: credential.id,
              action: 'expiration_warning',
              performed_by: 'system',
              success: true,
              metadata: {
                days_until_expiry: days,
                expires_at: credential.expires_at,
                service_type: credential.service_template,
              },
            } as any,
          });

          totalWarnings++;

          // Here we would send a notification
          // notifyExpirationWarning(credential.id, days)
        }
      }
    }

    const completedAt = new Date();
    const duration = completedAt.getTime() - startedAt.getTime();

    const jobResult: JobResult = {
      jobType: 'credential_expiration_warning',
      status: 'completed',
      startedAt,
      completedAt,
      duration_ms: duration,
      itemsProcessed: totalProcessed,
      itemsSucceeded: totalWarnings,
      itemsFailed: 0,
      errors: [],
      metadata: {
        warnings_sent: totalWarnings,
      },
    };

    await recordJobExecution(jobResult);

    console.log(
      `[Expiration Warning Job] Completed: ${totalWarnings} warnings sent for ${totalProcessed} credentials`
    );

    return jobResult;
  } catch (error) {
    const completedAt = new Date();
    const duration = completedAt.getTime() - startedAt.getTime();

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(errorMessage);

    console.error('[Expiration Warning Job] Failed:', errorMessage);

    const jobResult: JobResult = {
      jobType: 'credential_expiration_warning',
      status: 'failed',
      startedAt,
      completedAt,
      duration_ms: duration,
      itemsProcessed: 0,
      itemsSucceeded: 0,
      itemsFailed: 0,
      errors,
    };

    await recordJobExecution(jobResult);

    return jobResult;
  }
}

/**
 * Audit Log Cleanup Job
 * Runs weekly to remove old audit logs (keep 90 days)
 */
export async function runAuditLogCleanupJob(): Promise<JobResult> {
  const startedAt = new Date();
  const errors: string[] = [];

  console.log('[Audit Log Cleanup Job] Starting...');

  try {
    const retentionDays = 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Delete old audit logs
    const deleteResult = await prisma.api_credential_audit_logs.deleteMany({
      where: {
        created_at: {
          lt: cutoffDate,
        },
      },
    });

    const completedAt = new Date();
    const duration = completedAt.getTime() - startedAt.getTime();

    const jobResult: JobResult = {
      jobType: 'audit_log_cleanup',
      status: 'completed',
      startedAt,
      completedAt,
      duration_ms: duration,
      itemsProcessed: deleteResult.count,
      itemsSucceeded: deleteResult.count,
      itemsFailed: 0,
      errors: [],
      metadata: {
        retention_days: retentionDays,
        cutoff_date: cutoffDate.toISOString(),
      },
    };

    await recordJobExecution(jobResult);

    console.log(
      `[Audit Log Cleanup Job] Completed: ${deleteResult.count} old logs deleted`
    );

    return jobResult;
  } catch (error) {
    const completedAt = new Date();
    const duration = completedAt.getTime() - startedAt.getTime();

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(errorMessage);

    console.error('[Audit Log Cleanup Job] Failed:', errorMessage);

    const jobResult: JobResult = {
      jobType: 'audit_log_cleanup',
      status: 'failed',
      startedAt,
      completedAt,
      duration_ms: duration,
      itemsProcessed: 0,
      itemsSucceeded: 0,
      itemsFailed: 0,
      errors,
    };

    await recordJobExecution(jobResult);

    return jobResult;
  }
}

/**
 * Health History Cleanup Job
 * Runs daily to remove old health check history (keep 90 days)
 */
export async function runHealthHistoryCleanupJob(): Promise<JobResult> {
  const startedAt = new Date();
  const errors: string[] = [];

  console.log('[Health History Cleanup Job] Starting...');

  try {
    const retentionDays = 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Delete old health checks
    const deleteResult = await prisma.api_health_check_results.deleteMany({
      where: {
        checked_at: {
          lt: cutoffDate,
        },
      },
    });

    const completedAt = new Date();
    const duration = completedAt.getTime() - startedAt.getTime();

    const jobResult: JobResult = {
      jobType: 'health_history_cleanup',
      status: 'completed',
      startedAt,
      completedAt,
      duration_ms: duration,
      itemsProcessed: deleteResult.count,
      itemsSucceeded: deleteResult.count,
      itemsFailed: 0,
      errors: [],
      metadata: {
        retention_days: retentionDays,
        cutoff_date: cutoffDate.toISOString(),
      },
    };

    await recordJobExecution(jobResult);

    console.log(
      `[Health History Cleanup Job] Completed: ${deleteResult.count} old health checks deleted`
    );

    return jobResult;
  } catch (error) {
    const completedAt = new Date();
    const duration = completedAt.getTime() - startedAt.getTime();

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(errorMessage);

    console.error('[Health History Cleanup Job] Failed:', errorMessage);

    const jobResult: JobResult = {
      jobType: 'health_history_cleanup',
      status: 'failed',
      startedAt,
      completedAt,
      duration_ms: duration,
      itemsProcessed: 0,
      itemsSucceeded: 0,
      itemsFailed: 0,
      errors,
    };

    await recordJobExecution(jobResult);

    return jobResult;
  }
}

/**
 * Get job execution history
 *
 * @param jobType - Optional job type filter
 * @param limit - Maximum number of records to return
 * @returns Recent job executions
 */
export async function getJobHistory(
  jobType?: JobType,
  limit = 50
): Promise<any[]> {
  // This would query a job_executions table
  // For now, return empty array as placeholder
  console.log(`Getting job history for ${jobType || 'all jobs'}`);
  return [];
}

/**
 * Get current status of all jobs
 *
 * @returns Status summary for all job types
 */
export async function getJobsStatus(): Promise<{
  jobs: Array<{
    type: JobType;
    lastRun: Date | null;
    lastStatus: JobStatus | null;
    lastDuration: number | null;
    nextScheduledRun: Date | null;
    schedule: string;
  }>;
}> {
  // This would fetch actual job execution data
  // For now, return placeholder data with schedules
  const now = new Date();

  return {
    jobs: [
      {
        type: 'health_check',
        lastRun: null,
        lastStatus: null,
        lastDuration: null,
        nextScheduledRun: new Date(now.getTime() + 15 * 60 * 1000),
        schedule: 'Every 15 minutes',
      },
      {
        type: 'emergency_expiration',
        lastRun: null,
        lastStatus: null,
        lastDuration: null,
        nextScheduledRun: new Date(now.getTime() + 5 * 60 * 1000),
        schedule: 'Every 5 minutes',
      },
      {
        type: 'credential_expiration_warning',
        lastRun: null,
        lastStatus: null,
        lastDuration: null,
        nextScheduledRun: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 1,
          2,
          0
        ),
        schedule: 'Daily at 2:00 AM',
      },
      {
        type: 'audit_log_cleanup',
        lastRun: null,
        lastStatus: null,
        lastDuration: null,
        nextScheduledRun: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + (7 - now.getDay()),
          2,
          0
        ),
        schedule: 'Weekly on Sunday at 2:00 AM',
      },
      {
        type: 'health_history_cleanup',
        lastRun: null,
        lastStatus: null,
        lastDuration: null,
        nextScheduledRun: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 1,
          3,
          0
        ),
        schedule: 'Daily at 3:00 AM',
      },
    ],
  };
}

/**
 * Manually trigger a job
 *
 * @param jobType - Job type to run
 * @returns Job result
 */
export async function triggerJob(jobType: JobType): Promise<JobResult> {
  console.log(`Manually triggering job: ${jobType}`);

  switch (jobType) {
    case 'health_check':
      return runHealthCheckJob();

    case 'emergency_expiration':
      return runEmergencyExpirationJob();

    case 'credential_expiration_warning':
      return runCredentialExpirationWarningJob();

    case 'audit_log_cleanup':
      return runAuditLogCleanupJob();

    case 'health_history_cleanup':
      return runHealthHistoryCleanupJob();

    default:
      throw new Error(`Unknown job type: ${jobType}`);
  }
}

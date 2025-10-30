import { log } from '@/lib/logger';
/* eslint-disable security/detect-object-injection */
/**
 * Background Jobs System for API Management
 *
 * Handles scheduled tasks for health monitoring, expiration checks, and cleanup
 */

import { PrismaClient } from '@prisma/client';
import { performAllHealthChecks } from './health-monitor';
import { expireEmergencyAccess } from './emergency-access';
import { completeRotation } from './credential-rotation';

const prisma = new PrismaClient();

/**
 * Job types
 */
export type JobType =
  | 'health_check'
  | 'emergency_expiration'
  | 'rotation_cleanup'
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
    log.info('Job execution completed:', {
      type: result.jobType,
      status: result.status,
      duration: result.duration_ms,
      processed: result.itemsProcessed,
      succeeded: result.itemsSucceeded,
      failed: result.itemsFailed,
    });
  } catch (error) {
    log.error('Failed to record job execution:', { error });
  }
}

/**
 * Health Check Job
 * Runs every 15 minutes to check health of all active credentials
 */
export async function runHealthCheckJob(): Promise<JobResult> {
  const startedAt = new Date();
  const errors: string[] = [];

  log.info('[Health Check Job] Starting...');

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

    log.info(
      `[Health Check Job] Completed: ${result.successful}/${result.total} healthy`
    );

    return jobResult;
  } catch (error) {
    const completedAt = new Date();
    const duration = completedAt.getTime() - startedAt.getTime();

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(errorMessage);

    log.error('[Health Check Job] Failed:', errorMessage);

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

  log.info('[Emergency Expiration Job] Starting...');

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

    log.info(
      `[Emergency Expiration Job] Completed: ${expiredCount} access grants expired`
    );

    return jobResult;
  } catch (error) {
    const completedAt = new Date();
    const duration = completedAt.getTime() - startedAt.getTime();

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(errorMessage);

    log.error('[Emergency Expiration Job] Failed:', errorMessage);

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
 * Rotation Cleanup Job
 * Runs every hour to complete rotations past their grace period
 */
export async function runRotationCleanupJob(): Promise<JobResult> {
  const startedAt = new Date();
  const errors: string[] = [];

  log.info('[Rotation Cleanup Job] Starting...');

  try {
    const now = new Date();
    let totalProcessed = 0;
    let totalCompleted = 0;
    let totalFailed = 0;

    // Find rotations in grace_period status that have passed their end time
    const expiredRotations = await prisma.api_credential_rotations.findMany({
      where: {
        status: 'grace_period',
        grace_period_ends_at: {
          lte: now,
        },
      },
    });

    log.info(`[Rotation Cleanup Job] Found ${expiredRotations.length} expired rotations`);

    totalProcessed = expiredRotations.length;

    // Complete each expired rotation
    for (const rotation of expiredRotations) {
      try {
        await completeRotation(rotation.id);
        totalCompleted++;
        log.info(`[Rotation Cleanup Job] Completed rotation ${rotation.id}`);
      } catch (error) {
        totalFailed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Rotation ${rotation.id}: ${errorMessage}`);
        log.error(`[Rotation Cleanup Job] Failed to complete rotation ${rotation.id}:`, errorMessage);
      }
    }

    const completedAt = new Date();
    const duration = completedAt.getTime() - startedAt.getTime();

    const jobResult: JobResult = {
      jobType: 'rotation_cleanup',
      status: 'completed',
      startedAt,
      completedAt,
      duration_ms: duration,
      itemsProcessed: totalProcessed,
      itemsSucceeded: totalCompleted,
      itemsFailed: totalFailed,
      errors,
      metadata: {
        rotations_completed: totalCompleted,
        rotations_failed: totalFailed,
      },
    };

    await recordJobExecution(jobResult);

    log.info(
      `[Rotation Cleanup Job] Completed: ${totalCompleted}/${totalProcessed} rotations finalized`
    );

    return jobResult;
  } catch (error) {
    const completedAt = new Date();
    const duration = completedAt.getTime() - startedAt.getTime();

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(errorMessage);

    log.error('[Rotation Cleanup Job] Failed:', errorMessage);

    const jobResult: JobResult = {
      jobType: 'rotation_cleanup',
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

  log.info('[Expiration Warning Job] Starting...');

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
        // Note: findFirst not supported by wrapper, using findMany
        const lastWarningArray = await prisma.api_credential_audit_logs.findMany({
          where: {
            credential_id: credential.id,
            action: 'expiration_warning',
            created_at: {
              gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
          take: 1,
        });
        const lastWarning = lastWarningArray.length > 0 ? lastWarningArray[0] : null;

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

    log.info(
      `[Expiration Warning Job] Completed: ${totalWarnings} warnings sent for ${totalProcessed} credentials`
    );

    return jobResult;
  } catch (error) {
    const completedAt = new Date();
    const duration = completedAt.getTime() - startedAt.getTime();

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(errorMessage);

    log.error('[Expiration Warning Job] Failed:', errorMessage);

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

  log.info('[Audit Log Cleanup Job] Starting...');

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

    log.info(
      `[Audit Log Cleanup Job] Completed: ${deleteResult.count} old logs deleted`
    );

    return jobResult;
  } catch (error) {
    const completedAt = new Date();
    const duration = completedAt.getTime() - startedAt.getTime();

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(errorMessage);

    log.error('[Audit Log Cleanup Job] Failed:', errorMessage);

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

  log.info('[Health History Cleanup Job] Starting...');

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

    log.info(
      `[Health History Cleanup Job] Completed: ${deleteResult.count} old health checks deleted`
    );

    return jobResult;
  } catch (error) {
    const completedAt = new Date();
    const duration = completedAt.getTime() - startedAt.getTime();

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(errorMessage);

    log.error('[Health History Cleanup Job] Failed:', errorMessage);

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
  _limit = 50
): Promise<any[]> {
  // This would query a job_executions table
  // For now, return empty array as placeholder
  log.info(`Getting job history for ${jobType || 'all jobs'}`);
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
  log.info(`Manually triggering job: ${jobType}`);

  switch (jobType) {
    case 'health_check':
      return runHealthCheckJob();

    case 'emergency_expiration':
      return runEmergencyExpirationJob();

    case 'rotation_cleanup':
      return runRotationCleanupJob();

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

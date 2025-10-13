/**
 * Cleanup Jobs API Route
 *
 * Triggered by cron service daily to clean up old audit logs and health history
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  runAuditLogCleanupJob,
  runHealthHistoryCleanupJob,
  runCredentialExpirationWarningJob,
} from '@/lib/api-management/background-jobs';

/**
 * POST /api/jobs/cleanup
 *
 * Run cleanup jobs (audit logs, health history)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET;

    if (!expectedToken) {
      console.error('[Cleanup Job] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${expectedToken}`) {
      console.error('[Cleanup Job] Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cleanup Job] Authorized request received');

    // Run all cleanup jobs in parallel
    const [auditResult, healthResult, expirationResult] = await Promise.all([
      runAuditLogCleanupJob(),
      runHealthHistoryCleanupJob(),
      runCredentialExpirationWarningJob(),
    ]);

    return NextResponse.json({
      success: true,
      jobs: [
        {
          jobType: auditResult.jobType,
          status: auditResult.status,
          duration_ms: auditResult.duration_ms,
          itemsProcessed: auditResult.itemsProcessed,
        },
        {
          jobType: healthResult.jobType,
          status: healthResult.status,
          duration_ms: healthResult.duration_ms,
          itemsProcessed: healthResult.itemsProcessed,
        },
        {
          jobType: expirationResult.jobType,
          status: expirationResult.status,
          duration_ms: expirationResult.duration_ms,
          itemsProcessed: expirationResult.itemsProcessed,
        },
      ],
    });
  } catch (error) {
    console.error('[Cleanup Job] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/jobs/cleanup
 *
 * Get job status (for monitoring)
 */
export async function GET() {
  return NextResponse.json({
    jobType: 'cleanup',
    schedule: 'Daily at 2:00 AM',
    description: 'Cleans up old audit logs (90 days), health history (90 days), and sends expiration warnings',
  });
}

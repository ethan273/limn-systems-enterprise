import { log } from '@/lib/logger';
/**
 * Health Check Job API Route
 *
 * Triggered by cron service every 15 minutes to check health of all active credentials
 */

import { NextRequest, NextResponse } from 'next/server';
import { runHealthCheckJob } from '@/lib/api-management/background-jobs';

/**
 * POST /api/jobs/health-check
 *
 * Run health check job for all active credentials
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET;

    if (!expectedToken) {
      log.error('[Health Check Job] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${expectedToken}`) {
      log.error('[Health Check Job] Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    log.info('[Health Check Job] Authorized request received');

    // Run the job
    const result = await runHealthCheckJob();

    return NextResponse.json({
      success: result.status === 'completed',
      jobType: result.jobType,
      startedAt: result.startedAt.toISOString(),
      completedAt: result.completedAt.toISOString(),
      duration_ms: result.duration_ms,
      itemsProcessed: result.itemsProcessed,
      itemsSucceeded: result.itemsSucceeded,
      itemsFailed: result.itemsFailed,
      errors: result.errors,
    });
  } catch (error) {
    log.error('[Health Check Job] Error:', { error });

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
 * GET /api/jobs/health-check
 *
 * Get job status (for monitoring)
 */
export async function GET() {
  return NextResponse.json({
    jobType: 'health_check',
    schedule: 'Every 15 minutes',
    description: 'Checks health of all active API credentials',
  });
}

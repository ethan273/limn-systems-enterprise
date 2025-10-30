import { log } from '@/lib/logger';
/**
 * Emergency Access Expiration Job API Route
 *
 * Triggered by cron service every 5 minutes to expire emergency access grants
 */

import { NextRequest, NextResponse } from 'next/server';
import { runEmergencyExpirationJob } from '@/lib/api-management/background-jobs';

/**
 * POST /api/jobs/expiration
 *
 * Run emergency access expiration job
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET;

    if (!expectedToken) {
      log.error('[Expiration Job] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${expectedToken}`) {
      log.error('[Expiration Job] Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    log.info('[Expiration Job] Authorized request received');

    // Run the job
    const result = await runEmergencyExpirationJob();

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
    log.error('[Expiration Job] Error:', { error });

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
 * GET /api/jobs/expiration
 *
 * Get job status (for monitoring)
 */
export async function GET() {
  return NextResponse.json({
    jobType: 'emergency_expiration',
    schedule: 'Every 5 minutes',
    description: 'Expires emergency access grants that have passed their time limit',
  });
}

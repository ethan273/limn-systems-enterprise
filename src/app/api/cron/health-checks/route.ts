import { log } from '@/lib/logger';
/**
 * Health Checks Cron Job
 *
 * Runs every 15 minutes to check health of all active credentials
 * Triggers notifications on failures
 */

import { NextRequest, NextResponse } from 'next/server';
import { runHealthCheckJob } from '@/lib/api-management/background-jobs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      log.error('[Cron:Health] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      log.error('[Cron:Health] Unauthorized request - invalid secret');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    log.info('[Cron:Health] Starting health check job...');

    // Run health check job
    const result = await runHealthCheckJob();

    log.info('[Cron:Health] Job completed:', {
      status: result.status,
      processed: result.itemsProcessed,
      succeeded: result.itemsSucceeded,
      failed: result.itemsFailed,
      duration: result.duration_ms,
    });

    return NextResponse.json({
      success: result.status === 'completed',
      message: 'Health check job completed',
      result,
    });
  } catch (error) {
    log.error('[Cron:Health] Error:', { error });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

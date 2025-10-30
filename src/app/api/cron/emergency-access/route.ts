import { log } from '@/lib/logger';
/**
 * Emergency Access Expiration Cron Job
 *
 * Runs every 15 minutes to expire emergency access tokens
 * Logs expiration events and sends notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { runEmergencyExpirationJob } from '@/lib/api-management/background-jobs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      log.error('[Cron:Emergency] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      log.error('[Cron:Emergency] Unauthorized request - invalid secret');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    log.info('[Cron:Emergency] Starting emergency expiration job...');

    // Run emergency expiration job
    const result = await runEmergencyExpirationJob();

    log.info('[Cron:Emergency] Job completed:', {
      status: result.status,
      expired: result.itemsSucceeded,
      duration: result.duration_ms,
    });

    return NextResponse.json({
      success: result.status === 'completed',
      message: 'Emergency access expiration job completed',
      result,
    });
  } catch (error) {
    log.error('[Cron:Emergency] Error:', { error });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

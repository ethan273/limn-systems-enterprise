/**
 * Rotation Cleanup Cron Job
 *
 * Runs every hour to complete rotations past their grace period
 * Cleans up stuck rotation sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { runRotationCleanupJob } from '@/lib/api-management/background-jobs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('[Cron:Rotation] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Cron:Rotation] Unauthorized request - invalid secret');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cron:Rotation] Starting rotation cleanup job...');

    // Run rotation cleanup job
    const result = await runRotationCleanupJob();

    console.log('[Cron:Rotation] Job completed:', {
      status: result.status,
      processed: result.itemsProcessed,
      completed: result.itemsSucceeded,
      failed: result.itemsFailed,
      duration: result.duration_ms,
    });

    return NextResponse.json({
      success: result.status === 'completed',
      message: 'Rotation cleanup job completed',
      result,
    });
  } catch (error) {
    console.error('[Cron:Rotation] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

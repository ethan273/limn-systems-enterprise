/**
 * Session Cleanup Cron Job (RBAC Phase 2.2)
 *
 * Runs every 5 minutes to:
 * - Terminate inactive sessions exceeding timeout
 * - Clean up old session tracking data (> 90 days)
 * - Maintain session security and hygiene
 *
 * Schedule: Every 5 minutes
 * Vercel Cron: "0,5,10,15,20,25,30,35,40,45,50,55 * * * *"
 */

import { NextRequest, NextResponse } from 'next/server';
import { cleanupInactiveSessions } from '@/lib/services/session-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60; // 1 minute max

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('[Cron:SessionCleanup] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Cron:SessionCleanup] Unauthorized request - invalid secret');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cron:SessionCleanup] Starting session cleanup job...');

    // Run cleanup job
    const terminatedCount = await cleanupInactiveSessions();

    const duration = Date.now() - startTime;

    console.log('[Cron:SessionCleanup] Job completed:', {
      terminatedSessions: terminatedCount,
      duration_ms: duration,
    });

    return NextResponse.json({
      success: true,
      message: 'Session cleanup job completed',
      result: {
        terminatedSessions: terminatedCount,
        duration_ms: duration,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    console.error('[Cron:SessionCleanup] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration_ms: duration,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

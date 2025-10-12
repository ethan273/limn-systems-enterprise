import { NextResponse } from 'next/server';
import { sendRotationNotifications } from '@/lib/credentials/rotation-checker';

/**
 * API Endpoint: Check API Credential Rotations
 *
 * This endpoint should be called by a cron job daily to check for:
 * - Expiring credentials
 * - Expired credentials
 * - Credentials that need rotation
 *
 * Setup with Vercel Cron:
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/credentials/check-rotations",
 *     "schedule": "0 9 * * *"
 *   }]
 * }
 *
 * Or use an external cron service like cron-job.org
 */
export async function GET(request: Request) {
  try {
    // Optional: Add authentication/authorization
    // You might want to check for a secret token to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Run the rotation checker
    await sendRotationNotifications();

    return NextResponse.json({
      success: true,
      message: 'Credential rotation check completed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in check-rotations endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Also support POST for flexibility
export async function POST(request: Request) {
  return GET(request);
}

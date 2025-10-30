import { log } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json();

    // Get user session from Supabase
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Remove push subscription from database using Prisma
    const { prisma } = await import('@/lib/db');
    await prisma.push_subscriptions.deleteMany({
      where: {
        endpoint: subscription.endpoint,
        user_id: user.id, // Ensure user can only delete their own subscriptions
      },
    });

    log.info('[Push API] Subscription removed for user:', user.id);

    return NextResponse.json({ success: true, message: 'Subscription removed' });
  } catch (error) {
    log.error('[Push API] Error removing subscription:', { error });
    return NextResponse.json(
      { success: false, error: 'Failed to remove subscription' },
      { status: 500 }
    );
  }
}

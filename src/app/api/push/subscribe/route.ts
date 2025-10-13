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

    // Store push subscription in database using Prisma
    const { prisma } = await import('@/lib/db');

    // Generate a device_id from the endpoint (or use a provided device identifier)
    const deviceId = subscription.deviceId || Buffer.from(subscription.endpoint).toString('base64').slice(0, 50);

    await prisma.push_subscriptions.upsert({
      where: {
        user_id_device_id: {
          user_id: user.id,
          device_id: deviceId,
        },
      },
      create: {
        user_id: user.id,
        device_id: deviceId,
        push_token: subscription.endpoint,
        endpoint: subscription.endpoint,
        auth_keys: subscription.keys,
        is_active: true,
      },
      update: {
        push_token: subscription.endpoint,
        endpoint: subscription.endpoint,
        auth_keys: subscription.keys,
        is_active: true,
        last_used: new Date(),
      },
    });

    console.log('[Push API] Subscription saved for user:', user.id);

    return NextResponse.json({ success: true, message: 'Subscription saved' });
  } catch (error) {
    console.error('[Push API] Error saving subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json();

    // TODO: Store push subscription in database
    // Example implementation:
    // await prisma.pushSubscription.create({
    //   data: {
    //     endpoint: subscription.endpoint,
    //     p256dh: subscription.keys.p256dh,
    //     auth: subscription.keys.auth,
    //     userId: userId, // Get from session
    //   },
    // });

    console.log('[Push API] Subscription received:', subscription);

    return NextResponse.json({ success: true, message: 'Subscription saved' });
  } catch (error) {
    console.error('[Push API] Error saving subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}

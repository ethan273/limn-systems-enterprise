import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json();

    // TODO: Remove push subscription from database
    // Example implementation:
    // await prisma.pushSubscription.deleteMany({
    //   where: {
    //     endpoint: subscription.endpoint,
    //   },
    // });

    console.log('[Push API] Subscription removed:', subscription);

    return NextResponse.json({ success: true, message: 'Subscription removed' });
  } catch (error) {
    console.error('[Push API] Error removing subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove subscription' },
      { status: 500 }
    );
  }
}

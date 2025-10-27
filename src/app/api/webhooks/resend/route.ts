/**
 * Resend Webhook Handler
 *
 * Receives webhook events from Resend for real-time email tracking:
 * - email.sent
 * - email.delivered
 * - email.delivery_delayed
 * - email.complained
 * - email.bounced
 * - email.opened
 * - email.clicked
 *
 * @module webhooks/resend
 * @created 2025-10-26
 * @phase Grand Plan Phase 5 - Critical Fix
 */

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { db } from '@/lib/db';
import type { EmailEventType } from '@/lib/services/email-types';

/**
 * Resend webhook event interface
 */
interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id?: string;
    from?: string;
    to?: string[];
    subject?: string;
    created_at?: string;
    // Event-specific data
    ip?: string;
    user_agent?: string;
    link?: string;
    bounce_type?: string;
    bounce_reason?: string;
    complaint_reason?: string;
  };
}

/**
 * Map Resend event types to our internal event types
 */
function mapResendEventType(resendType: string): EmailEventType | null {
  const mapping: Record<string, EmailEventType> = {
    'email.sent': 'sent',
    'email.delivered': 'delivered',
    'email.opened': 'opened',
    'email.clicked': 'clicked',
    'email.bounced': 'bounced',
    'email.complained': 'complained',
  };

  return mapping[resendType] ?? null;
}

/**
 * POST handler for Resend webhooks
 */
export async function POST(request: Request) {
  try {
    // Get webhook body and headers
    const body = await request.text();
    const headersList = await headers();
    const svixId = headersList.get('svix-id');
    const svixTimestamp = headersList.get('svix-timestamp');
    const svixSignature = headersList.get('svix-signature');

    // Verify webhook signature
    if (!process.env.RESEND_WEBHOOK_SECRET) {
      console.error('[webhook:resend] RESEND_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error('[webhook:resend] Missing required Svix headers');
      return NextResponse.json(
        { error: 'Missing webhook headers' },
        { status: 400 }
      );
    }

    const webhook = new Webhook(process.env.RESEND_WEBHOOK_SECRET);
    let event: ResendWebhookEvent;

    try {
      event = webhook.verify(body, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as ResendWebhookEvent;
    } catch (err) {
      console.error('[webhook:resend] Webhook verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    console.log(`[webhook:resend] Received event: ${event.type}`);

    // Map Resend event type to our internal event type
    const eventType = mapResendEventType(event.type);
    if (!eventType) {
      console.log(`[webhook:resend] Ignoring unknown event type: ${event.type}`);
      return NextResponse.json({ success: true, ignored: true });
    }

    // Extract recipient email (first recipient)
    const recipientEmail = event.data.to?.[0] ?? null;

    // Find the email queue item by recipient and rough timestamp match
    // (Resend doesn't always provide our internal email_id)
    let campaignId: string | null = null;

    if (recipientEmail) {
      // Try to find the email in queue within last 24 hours
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const queueItems = await db.email_queue.findMany({
        where: {
          recipient_email: recipientEmail,
          created_at: { gte: since },
        },
      });

      // Get the most recent one
      const queueItem = queueItems.length > 0 ? queueItems[queueItems.length - 1] : null;

      if (queueItem) {
        campaignId = queueItem.campaign_id;
      }
    }

    // Prepare event data
    const eventData: Record<string, unknown> = {};

    if (event.data.link) {
      eventData.link_url = event.data.link;
    }

    if (event.data.bounce_type || event.data.bounce_reason) {
      eventData.bounce_type = event.data.bounce_type;
      eventData.bounce_reason = event.data.bounce_reason;
    }

    if (event.data.complaint_reason) {
      eventData.complaint_reason = event.data.complaint_reason;
    }

    // Track the event in our database
    const trackingEvent = await db.email_tracking.create({
      data: {
        campaign_id: campaignId,
        recipient_email: recipientEmail,
        event_type: eventType,
        event_data: Object.keys(eventData).length > 0 ? eventData : null,
        ip_address: event.data.ip ?? null,
        user_agent: event.data.user_agent ?? null,
      },
    });

    console.log(`[webhook:resend] Created tracking event: ${trackingEvent.id} for ${eventType}`);

    // Update campaign metrics if campaign_id is available
    if (campaignId) {
      const fieldMap: Record<EmailEventType, string> = {
        sent: 'sent_count',
        delivered: 'sent_count', // Delivered counted in sent_count
        opened: 'open_count',
        clicked: 'click_count',
        bounced: 'bounce_count',
        unsubscribed: 'unsubscribe_count',
        complained: 'bounce_count', // Complaints counted as bounces
      };

      const field = fieldMap[eventType];

      // Only increment for non-sent events (sent is already counted)
      if (field && eventType !== 'sent' && eventType !== 'delivered') {
        await db.email_campaigns.update({
          where: { id: campaignId },
          data: {
            [field]: { increment: 1 },
            updated_at: new Date(),
          },
        });

        console.log(`[webhook:resend] Updated campaign ${campaignId} ${field}`);
      }
    }

    return NextResponse.json({
      success: true,
      event_id: trackingEvent.id,
      event_type: eventType,
    });
  } catch (error) {
    console.error('[webhook:resend] Error processing webhook:', error);

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
 * GET handler to verify webhook endpoint is accessible
 */
export async function GET() {
  return NextResponse.json({
    service: 'Resend Webhook Handler',
    status: 'active',
    events: [
      'email.sent',
      'email.delivered',
      'email.opened',
      'email.clicked',
      'email.bounced',
      'email.complained',
    ],
  });
}

/**
 * Alert Notification Service - Phase 3 Session 4
 *
 * Multi-channel notification delivery for alerts
 *
 * @module lib/services/alert-notification-service
 * @created 2025-10-30
 */

import { Resend } from 'resend';
import { db } from '@/lib/db';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export type AlertChannel = 'email' | 'in_app' | 'google_chat' | 'sms';

export type AlertNotification = {
  ruleId: string;
  ruleName: string;
  metric: string;
  currentValue: number;
  thresholdValue: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
};

/**
 * Send alert notification via all configured channels
 */
export async function sendAlertNotification(
  notification: AlertNotification,
  channels: AlertChannel[],
  recipients: {
    userIds?: string[];
    emails?: string[];
    roles?: string[];
  }
): Promise<{ success: boolean; results: Record<string, boolean> }> {
  const results: Record<string, boolean> = {};

  for (const channel of channels) {
    try {
      switch (channel) {
        case 'email':
          results.email = await sendEmailNotification(notification, recipients);
          break;

        case 'in_app':
          results.in_app = await sendInAppNotification(notification, recipients);
          break;

        case 'google_chat':
          results.google_chat = await sendGoogleChatNotification(notification);
          break;

        case 'sms':
          results.sms = await sendSMSNotification(notification, recipients);
          break;
      }
    } catch (error) {
      console.error(`[Alert] Failed to send via ${channel}:`, error);
      results[channel] = false;
    }
  }

  const success = Object.values(results).some((r) => r === true);

  return { success, results };
}

/**
 * Send email notification
 */
async function sendEmailNotification(
  notification: AlertNotification,
  recipients: { userIds?: string[]; emails?: string[]; roles?: string[] }
): Promise<boolean> {
  if (!resend) {
    console.warn('[Alert] Resend not configured, skipping email notification');
    return false;
  }

  // Collect email addresses
  const emailAddresses: string[] = [];

  // Add direct emails
  if (recipients.emails) {
    emailAddresses.push(...recipients.emails);
  }

  // Get emails from user IDs
  if (recipients.userIds && recipients.userIds.length > 0) {
    const users = await db.user_profiles.findMany({
      where: { id: { in: recipients.userIds } },
      select: { email: true },
    });
    emailAddresses.push(...users.map((u) => u.email));
  }

  // Get emails from roles (TODO: implement role-based email lookup)

  if (emailAddresses.length === 0) {
    console.warn('[Alert] No email recipients found');
    return false;
  }

  const severityEmoji = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    critical: '🚨',
  };

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'alerts@limn.us.com',
      to: emailAddresses,
      subject: `${severityEmoji[notification.severity]} Alert: ${notification.ruleName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${getSeverityColor(notification.severity)};">
            ${severityEmoji[notification.severity]} Workflow Alert Triggered
          </h2>

          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Rule:</strong> ${notification.ruleName}</p>
            <p style="margin: 5px 0;"><strong>Metric:</strong> ${notification.metric}</p>
            <p style="margin: 5px 0;"><strong>Current Value:</strong> ${notification.currentValue}</p>
            <p style="margin: 5px 0;"><strong>Threshold:</strong> ${notification.thresholdValue}</p>
            <p style="margin: 5px 0;"><strong>Severity:</strong> ${notification.severity.toUpperCase()}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${notification.timestamp.toLocaleString()}</p>
          </div>

          <p>${notification.message}</p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="font-size: 12px; color: #888;">
              This is an automated alert from the Limn Automation System.
              <br>
              Visit the <a href="${process.env.NEXT_PUBLIC_URL}/automation/alerts">Alert Dashboard</a> to manage alerts.
            </p>
          </div>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error('[Alert] Failed to send email:', error);
    return false;
  }
}

/**
 * Send in-app notification via real_time_events
 */
async function sendInAppNotification(
  notification: AlertNotification,
  recipients: { userIds?: string[]; emails?: string[]; roles?: string[] }
): Promise<boolean> {
  try {
    const recipientUserIds = recipients.userIds || [];

    await db.real_time_events.create({
      data: {
        event_type: 'notification',
        event_name: 'alert_triggered',
        entity_type: 'alert_rule',
        entity_id: notification.ruleId,
        event_data: {
          ruleName: notification.ruleName,
          metric: notification.metric,
          currentValue: notification.currentValue,
          thresholdValue: notification.thresholdValue,
          severity: notification.severity,
          message: notification.message,
        } as any,
        metadata: {} as any,
        recipient_user_ids: recipientUserIds,
        priority: notification.severity === 'critical' || notification.severity === 'error' ? 'urgent' : 'high',
        status: 'pending',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    return true;
  } catch (error) {
    console.error('[Alert] Failed to send in-app notification:', error);
    return false;
  }
}

/**
 * Send Google Chat notification
 */
async function sendGoogleChatNotification(
  notification: AlertNotification
): Promise<boolean> {
  const webhookUrl = process.env.GOOGLE_CHAT_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('[Alert] Google Chat webhook not configured');
    return false;
  }

  const severityColor = {
    info: '#3B82F6',
    warning: '#F59E0B',
    error: '#EF4444',
    critical: '#DC2626',
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cards: [
          {
            header: {
              title: `🚨 Workflow Alert: ${notification.ruleName}`,
              subtitle: `Severity: ${notification.severity.toUpperCase()}`,
              imageUrl: 'https://developers.google.com/chat/images/quickstart-app-avatar.png',
            },
            sections: [
              {
                widgets: [
                  {
                    keyValue: {
                      topLabel: 'Metric',
                      content: notification.metric,
                      contentMultiline: false,
                    },
                  },
                  {
                    keyValue: {
                      topLabel: 'Current Value',
                      content: notification.currentValue.toString(),
                      contentMultiline: false,
                    },
                  },
                  {
                    keyValue: {
                      topLabel: 'Threshold',
                      content: notification.thresholdValue.toString(),
                      contentMultiline: false,
                    },
                  },
                  {
                    textParagraph: {
                      text: notification.message,
                    },
                  },
                  {
                    buttons: [
                      {
                        textButton: {
                          text: 'VIEW ALERT DASHBOARD',
                          onClick: {
                            openLink: {
                              url: `${process.env.NEXT_PUBLIC_URL}/automation/alerts`,
                            },
                          },
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('[Alert] Failed to send Google Chat notification:', error);
    return false;
  }
}

/**
 * Send SMS notification (placeholder)
 */
async function sendSMSNotification(
  notification: AlertNotification,
  recipients: { userIds?: string[]; emails?: string[]; roles?: string[] }
): Promise<boolean> {
  // TODO: Implement SMS via Twilio or similar service
  console.warn('[Alert] SMS notifications not yet implemented');
  return false;
}

/**
 * Get color for severity level
 */
function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'info':
      return '#3B82F6';
    case 'warning':
      return '#F59E0B';
    case 'error':
      return '#EF4444';
    case 'critical':
      return '#DC2626';
    default:
      return '#6B7280';
  }
}

/**
 * Google Chat Notifications for QC & Factory Review Events
 *
 * Provides notification functions for:
 * - QC inspection completions
 * - Factory review completions
 * - Supervisor nudges (long-running inspections)
 *
 * Uses unified Google Chat client for consistent delivery and rate limiting.
 */

import { sendGoogleChatMessage } from './client';
import { getStatusEmoji } from './formatters';

export interface QCNotificationData {
  item_name: string;
  inspection_status: 'passed' | 'failed';
  inspector_name?: string;
  issues_found: number;
  critical_issues: number;
  photos_captured: number;
  duration_minutes: number;
  factory_name?: string;
}

export interface FactoryReviewNotificationData {
  prototype_name: string;
  review_status: 'approved' | 'rejected' | 'revision_required';
  reviewer_name?: string;
  issues_found: number;
  photos_captured: number;
  factory_name?: string;
}

export interface SupervisorNudgeData {
  tech_name: string;
  item_name: string;
  elapsed_minutes: number;
}

/**
 * Send QC inspection completion notification
 */
export async function sendQCNotification(
  webhookUrl: string,
  data: QCNotificationData
): Promise<boolean> {
  const statusEmoji = getStatusEmoji(data.inspection_status);
  const statusText = data.inspection_status === 'passed' ? 'PASSED' : 'FAILED';
  const criticalBadge = data.critical_issues > 0 ? `🚨 ${data.critical_issues} CRITICAL` : '';

  const message = {
    text: `${statusEmoji} QC Inspection ${statusText}`,
    cards: [
      {
        header: {
          title: `QC Inspection ${statusText}`,
          subtitle: data.item_name,
          imageUrl:
            data.inspection_status === 'passed'
              ? 'https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/check_circle/default/24px.svg'
              : 'https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/cancel/default/24px.svg',
        },
        sections: [
          {
            widgets: [
              {
                keyValue: {
                  topLabel: 'Item',
                  content: data.item_name,
                },
              },
              {
                keyValue: {
                  topLabel: 'Status',
                  content: `${statusEmoji} ${statusText} ${criticalBadge}`,
                },
              },
              {
                keyValue: {
                  topLabel: 'Inspector',
                  content: data.inspector_name || 'Unknown',
                },
              },
              {
                keyValue: {
                  topLabel: 'Factory',
                  content: data.factory_name || 'N/A',
                },
              },
              {
                keyValue: {
                  topLabel: 'Issues Found',
                  content: `${data.issues_found} total (${data.critical_issues} critical)`,
                },
              },
              {
                keyValue: {
                  topLabel: 'Photos Captured',
                  content: `${data.photos_captured} photos`,
                },
              },
              {
                keyValue: {
                  topLabel: 'Duration',
                  content: `${data.duration_minutes} minutes`,
                },
              },
            ],
          },
        ],
      },
    ],
  };

  const result = await sendGoogleChatMessage({
    webhookUrl,
    message,
    rateLimitKey: webhookUrl,
  });

  return result.success;
}

/**
 * Send Factory Review completion notification
 */
export async function sendFactoryReviewNotification(
  webhookUrl: string,
  data: FactoryReviewNotificationData
): Promise<boolean> {
  const statusEmoji = getStatusEmoji(data.review_status);
  const statusText =
    data.review_status === 'approved'
      ? 'APPROVED'
      : data.review_status === 'rejected'
      ? 'REJECTED'
      : 'REVISION REQUIRED';

  const message = {
    text: `${statusEmoji} Factory Review ${statusText}`,
    cards: [
      {
        header: {
          title: `Factory Review ${statusText}`,
          subtitle: data.prototype_name,
          imageUrl:
            data.review_status === 'approved'
              ? 'https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/check_circle/default/24px.svg'
              : 'https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/error/default/24px.svg',
        },
        sections: [
          {
            widgets: [
              {
                keyValue: {
                  topLabel: 'Prototype',
                  content: data.prototype_name,
                },
              },
              {
                keyValue: {
                  topLabel: 'Status',
                  content: `${statusEmoji} ${statusText}`,
                },
              },
              {
                keyValue: {
                  topLabel: 'Reviewer',
                  content: data.reviewer_name || 'Unknown',
                },
              },
              {
                keyValue: {
                  topLabel: 'Factory',
                  content: data.factory_name || 'N/A',
                },
              },
              {
                keyValue: {
                  topLabel: 'Issues Found',
                  content: `${data.issues_found} issues`,
                },
              },
              {
                keyValue: {
                  topLabel: 'Photos Captured',
                  content: `${data.photos_captured} photos`,
                },
              },
            ],
          },
        ],
      },
    ],
  };

  const result = await sendGoogleChatMessage({
    webhookUrl,
    message,
    rateLimitKey: webhookUrl,
  });

  return result.success;
}

/**
 * Send supervisor nudge notification
 */
export async function sendSupervisorNudge(
  webhookUrl: string,
  techName: string,
  itemName: string,
  elapsedMinutes: number
): Promise<boolean> {
  const message = {
    text: `⏰ QC Inspection Nudge: ${techName}`,
    cards: [
      {
        header: {
          title: 'QC Inspection Reminder',
          subtitle: `Inspection in progress for ${elapsedMinutes} minutes`,
          imageUrl:
            'https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/notifications_active/default/24px.svg',
        },
        sections: [
          {
            widgets: [
              {
                textParagraph: {
                  text: `<b>${techName}</b> has been inspecting <b>${itemName}</b> for ${elapsedMinutes} minutes.`,
                },
              },
              {
                keyValue: {
                  topLabel: 'Action',
                  content: 'Please check on progress or offer assistance if needed.',
                },
              },
            ],
          },
        ],
      },
    ],
  };

  const result = await sendGoogleChatMessage({
    webhookUrl,
    message,
    rateLimitKey: webhookUrl,
  });

  return result.success;
}

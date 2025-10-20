/**
 * Google Chat Integration
 * Sends notifications to Google Chat webhooks for QC and Factory Review events
 */

// Rate limiting: Track last message time per webhook
const lastMessageTimes = new Map<string, number>();
const MIN_INTERVAL_MS = 1000; // 1 second between messages

interface QCNotificationData {
  item_name: string;
  inspection_status: 'passed' | 'failed';
  inspector_name?: string;
  issues_found: number;
  critical_issues: number;
  photos_captured: number;
  duration_minutes: number;
  factory_name?: string;
}

interface FactoryReviewNotificationData {
  prototype_name: string;
  review_status: 'approved' | 'rejected' | 'revision_required';
  reviewer_name?: string;
  issues_found: number;
  photos_captured: number;
  factory_name?: string;
}

/**
 * Send QC inspection completion notification
 */
export async function sendQCNotification(
  webhookUrl: string,
  data: QCNotificationData
): Promise<boolean> {
  // Rate limiting check
  const lastTime = lastMessageTimes.get(webhookUrl) || 0;
  const now = Date.now();
  if (now - lastTime < MIN_INTERVAL_MS) {
    console.warn('Rate limit: Message throttled, waiting...');
    await new Promise(resolve => setTimeout(resolve, MIN_INTERVAL_MS - (now - lastTime)));
  }

  const statusEmoji = data.inspection_status === 'passed' ? '✅' : '❌';
  const statusText = data.inspection_status === 'passed' ? 'PASSED' : 'FAILED';
  const criticalBadge = data.critical_issues > 0 ? `🚨 ${data.critical_issues} CRITICAL` : '';

  const message = {
    text: `${statusEmoji} QC Inspection ${statusText}`,
    cards: [
      {
        header: {
          title: `QC Inspection ${statusText}`,
          subtitle: data.item_name,
          imageUrl: data.inspection_status === 'passed'
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

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error('Google Chat webhook error:', response.status, await response.text());
      return false;
    }

    lastMessageTimes.set(webhookUrl, Date.now());
    return true;
  } catch (error) {
    console.error('Error sending Google Chat notification:', error);
    return false;
  }
}

/**
 * Send Factory Review completion notification
 */
export async function sendFactoryReviewNotification(
  webhookUrl: string,
  data: FactoryReviewNotificationData
): Promise<boolean> {
  // Rate limiting check
  const lastTime = lastMessageTimes.get(webhookUrl) || 0;
  const now = Date.now();
  if (now - lastTime < MIN_INTERVAL_MS) {
    console.warn('Rate limit: Message throttled, waiting...');
    await new Promise(resolve => setTimeout(resolve, MIN_INTERVAL_MS - (now - lastTime)));
  }

  const statusEmoji =
    data.review_status === 'approved'
      ? '✅'
      : data.review_status === 'rejected'
      ? '❌'
      : '⚠️';
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

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error('Google Chat webhook error:', response.status, await response.text());
      return false;
    }

    lastMessageTimes.set(webhookUrl, Date.now());
    return true;
  } catch (error) {
    console.error('Error sending Google Chat notification:', error);
    return false;
  }
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
  // Rate limiting check
  const lastTime = lastMessageTimes.get(webhookUrl) || 0;
  const now = Date.now();
  if (now - lastTime < MIN_INTERVAL_MS) {
    console.warn('Rate limit: Message throttled, waiting...');
    await new Promise(resolve => setTimeout(resolve, MIN_INTERVAL_MS - (now - lastTime)));
  }

  const message = {
    text: `⏰ QC Inspection Nudge: ${techName}`,
    cards: [
      {
        header: {
          title: 'QC Inspection Reminder',
          subtitle: `Inspection in progress for ${elapsedMinutes} minutes`,
          imageUrl: 'https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/notifications_active/default/24px.svg',
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

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error('Google Chat webhook error:', response.status, await response.text());
      return false;
    }

    lastMessageTimes.set(webhookUrl, Date.now());
    return true;
  } catch (error) {
    console.error('Error sending Google Chat notification:', error);
    return false;
  }
}

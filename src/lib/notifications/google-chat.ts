/**
 * Google Chat Webhook Notification Service
 *
 * Sends formatted card messages to Limn Systems Notification Google Chat space
 * for authentication and admin-related events.
 *
 * Webhook URL: https://chat.googleapis.com/v1/spaces/AAQAk9osLBU/messages
 */

const GOOGLE_CHAT_WEBHOOK_URL = process.env.GOOGLE_CHAT_WEBHOOK_URL;

interface GoogleChatCard {
  cardsV2: Array<{
    cardId: string;
    card: {
      header?: {
        title: string;
        subtitle?: string;
        imageUrl?: string;
      };
      sections: Array<{
        header?: string;
        widgets: Array<{
          decoratedText?: {
            topLabel?: string;
            text: string;
            startIcon?: {
              knownIcon: string;
            };
          };
          textParagraph?: {
            text: string;
          };
          divider?: object;
        }>;
      }>;
    };
  }>;
}

type NotificationType = 'info' | 'warning' | 'success' | 'error';

function getIconForType(type: NotificationType): string {
  switch (type) {
    case 'success':
      return 'STAR';
    case 'error':
      return 'BOOKMARK';
    case 'warning':
      return 'DESCRIPTION';
    case 'info':
    default:
      return 'PERSON';
  }
}

/**
 * Send a formatted card message to Google Chat
 */
export async function sendGoogleChatNotification(params: {
  title: string;
  message: string;
  type: NotificationType;
  metadata?: Record<string, string>;
}): Promise<{ success: boolean; error?: string }> {
  // Skip if webhook URL is not configured
  if (!GOOGLE_CHAT_WEBHOOK_URL) {
    console.warn('[Google Chat] Webhook URL not configured - skipping notification');
    return { success: false, error: 'Webhook URL not configured' };
  }

  try {
    const { title, message, type, metadata } = params;

    // Build widgets for metadata
    const metadataWidgets = metadata
      ? Object.entries(metadata).map(([key, value]) => ({
          decoratedText: {
            topLabel: key,
            text: value,
          },
        }))
      : [];

    const card: GoogleChatCard = {
      cardsV2: [
        {
          cardId: `notification-${Date.now()}`,
          card: {
            header: {
              title,
              subtitle: new Date().toLocaleString('en-US', {
                timeZone: 'America/Los_Angeles',
                dateStyle: 'medium',
                timeStyle: 'short',
              }),
            },
            sections: [
              {
                widgets: [
                  {
                    decoratedText: {
                      text: message,
                      startIcon: {
                        knownIcon: getIconForType(type),
                      },
                    },
                  },
                ],
              },
              ...(metadataWidgets.length > 0
                ? [
                    {
                      widgets: [
                        { divider: {} },
                        ...metadataWidgets,
                      ],
                    },
                  ]
                : []),
            ],
          },
        },
      ],
    };

    const response = await fetch(GOOGLE_CHAT_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(card),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Google Chat] Webhook request failed:', {
        status: response.status,
        error: errorText,
      });
      return {
        success: false,
        error: `Webhook request failed: ${response.status}`,
      };
    }

    console.log(`[Google Chat] ✅ Notification sent: ${title}`);
    return { success: true };
  } catch (error) {
    console.error('[Google Chat] Error sending notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Notify admins of new access request
 */
export async function notifyAccessRequest(data: {
  email: string;
  name: string;
  company?: string;
  userType: string;
  phone?: string;
}): Promise<{ success: boolean; error?: string }> {
  const fullName = data.name || 'Unknown';

  return sendGoogleChatNotification({
    title: '🔔 New Access Request',
    message: `${fullName} (${data.email}) requested ${data.userType} access`,
    type: 'info',
    metadata: {
      'Email': data.email,
      'Name': fullName,
      'Company': data.company || 'N/A',
      'Phone': data.phone || 'N/A',
      'User Type': data.userType,
      'Action Required': 'Review at /admin/access-requests',
    },
  });
}

/**
 * Notify when magic link is sent
 */
export async function notifyMagicLinkSent(data: {
  email: string;
  userType?: string;
}): Promise<{ success: boolean; error?: string }> {
  return sendGoogleChatNotification({
    title: '🔗 Magic Link Sent',
    message: `Magic link authentication sent to ${data.email}`,
    type: 'info',
    metadata: {
      'Email': data.email,
      'User Type': data.userType || 'Unknown',
      'Login Type': 'Magic Link',
    },
  });
}

/**
 * Notify when access is approved
 */
export async function notifyAccessApproved(data: {
  email: string;
  name?: string;
  approvedBy: string;
}): Promise<{ success: boolean; error?: string }> {
  return sendGoogleChatNotification({
    title: '✅ Access Approved',
    message: `${data.name || data.email} access approved by ${data.approvedBy}`,
    type: 'success',
    metadata: {
      'Email': data.email,
      'Approved By': data.approvedBy,
      'Status': 'Invitation email sent',
    },
  });
}

/**
 * Notify when access is denied
 */
export async function notifyAccessDenied(data: {
  email: string;
  name?: string;
  deniedBy: string;
  reason?: string;
}): Promise<{ success: boolean; error?: string }> {
  return sendGoogleChatNotification({
    title: '❌ Access Denied',
    message: `${data.name || data.email} access denied by ${data.deniedBy}`,
    type: 'warning',
    metadata: {
      'Email': data.email,
      'Denied By': data.deniedBy,
      'Reason': data.reason || 'Not specified',
    },
  });
}

/**
 * Notify when user is directly invited by admin
 */
export async function notifyUserInvited(data: {
  email: string;
  name?: string;
  invitedBy: string;
  userType: string;
}): Promise<{ success: boolean; error?: string }> {
  return sendGoogleChatNotification({
    title: '📨 User Invited',
    message: `${data.name || data.email} invited as ${data.userType} by ${data.invitedBy}`,
    type: 'success',
    metadata: {
      'Email': data.email,
      'User Type': data.userType,
      'Invited By': data.invitedBy,
      'Status': 'Invitation email sent',
    },
  });
}

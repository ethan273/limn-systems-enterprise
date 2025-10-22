/**
 * Google Chat Card Formatting Utilities
 *
 * Provides helpers for creating consistently formatted Google Chat cards
 * using the CardsV2 API format.
 */

export type NotificationType = 'info' | 'warning' | 'success' | 'error';

/**
 * Get icon for notification type
 */
export function getIconForType(type: NotificationType): string {
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
 * Get status emoji for pass/fail status
 */
export function getStatusEmoji(status: 'passed' | 'failed' | 'approved' | 'rejected' | 'revision_required'): string {
  switch (status) {
    case 'passed':
    case 'approved':
      return '✅';
    case 'failed':
    case 'rejected':
      return '❌';
    case 'revision_required':
      return '⚠️';
    default:
      return '🔵';
  }
}

/**
 * Format metadata as key-value widgets
 */
export function formatMetadataWidgets(metadata: Record<string, string>): any[] {
  return Object.entries(metadata).map(([key, value]) => ({
    decoratedText: {
      topLabel: key,
      text: value,
    },
  }));
}

/**
 * Create a CardsV2 formatted message
 */
export function createCardV2Message(params: {
  title: string;
  subtitle?: string;
  message: string;
  type: NotificationType;
  metadata?: Record<string, string>;
}): any {
  const { title, subtitle, message, type, metadata } = params;

  const metadataWidgets = metadata ? formatMetadataWidgets(metadata) : [];

  return {
    cardsV2: [
      {
        cardId: `notification-${Date.now()}`,
        card: {
          header: {
            title,
            subtitle:
              subtitle ||
              new Date().toLocaleString('en-US', {
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
                    widgets: [{ divider: {} }, ...metadataWidgets],
                  },
                ]
              : []),
          ],
        },
      },
    ],
  };
}

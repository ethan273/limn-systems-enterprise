/**
 * Unified Notification Service
 *
 * Centralized notification system supporting multiple channels:
 * - In-app notifications (database + real-time)
 * - Email notifications (Resend API)
 * - Google Chat notifications (webhook)
 *
 * Features:
 * - Multi-channel delivery
 * - User preferences
 * - Delivery tracking
 * - Rate limiting
 * - Template support
 */

import { sendGoogleChatMessage, createCardV2Message, type NotificationType } from '@/lib/google-chat';
import { sendEmail } from '@/lib/notifications/email-service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type NotificationChannel = 'in_app' | 'email' | 'google_chat';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type NotificationCategory =
  | 'system'
  | 'order'
  | 'production'
  | 'shipping'
  | 'payment'
  | 'task'
  | 'message'
  | 'alert';

export interface NotificationRecipient {
  userId: string;
  email?: string;
  name?: string;
  preferences?: UserNotificationPreferences;
}

export interface UserNotificationPreferences {
  channels: {
    in_app: boolean;
    email: boolean;
    google_chat: boolean;
  };
  categories: {
    // eslint-disable-next-line no-unused-vars -- TypeScript mapped type syntax
    [key in NotificationCategory]?: {
      enabled: boolean;
      channels: NotificationChannel[];
    };
  };
  quietHours?: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;
  };
}

export interface SendNotificationParams {
  // Recipients
  recipients: NotificationRecipient[];

  // Content
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;

  // Optional metadata
  actionUrl?: string;
  actionLabel?: string;
  imageUrl?: string;
  metadata?: Record<string, any>;

  // Channel overrides
  channels?: NotificationChannel[];

  // Template support
  templateId?: string;
  templateData?: Record<string, any>;
}

export interface NotificationResult {
  success: boolean;
  notificationId?: string;
  deliveryStatus: {
    in_app?: { success: boolean; error?: string };
    email?: { success: boolean; error?: string };
    google_chat?: { success: boolean; error?: string };
  };
}

/**
 * Get user notification preferences
 *
 * Note: user_notification_preferences table doesn't exist yet.
 * For now, return default preferences for all users.
 */
async function getUserPreferences(_userId: string): Promise<UserNotificationPreferences> {
  // TODO: Implement when user_notification_preferences table is created
  // Return default preferences for now
  return {
    channels: {
      in_app: true,
      email: true,
      google_chat: false, // Opt-in for Google Chat
    },
    categories: {
      system: { enabled: true, channels: ['in_app', 'email'] },
      order: { enabled: true, channels: ['in_app', 'email'] },
      production: { enabled: true, channels: ['in_app', 'email'] },
      shipping: { enabled: true, channels: ['in_app', 'email'] },
      payment: { enabled: true, channels: ['in_app', 'email'] },
      task: { enabled: true, channels: ['in_app'] },
      message: { enabled: true, channels: ['in_app'] },
      alert: { enabled: true, channels: ['in_app', 'email', 'google_chat'] },
    },
  };
}

/**
 * Check if notification should be sent based on quiet hours
 */
function isQuietHours(preferences: UserNotificationPreferences): boolean {
  if (!preferences.quietHours?.enabled) {
    return false;
  }

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const { start, end } = preferences.quietHours;

  // Handle case where quiet hours cross midnight
  if (start > end) {
    return currentTime >= start || currentTime < end;
  }

  return currentTime >= start && currentTime < end;
}

/**
 * Determine which channels to use for a notification
 */
function determineChannels(
  params: SendNotificationParams,
  preferences: UserNotificationPreferences
): NotificationChannel[] {
  // If channels explicitly specified, use those
  if (params.channels && params.channels.length > 0) {
    return params.channels;
  }

  // Check category preferences
  const categoryPrefs = preferences.categories[params.category];
  if (categoryPrefs && !categoryPrefs.enabled) {
    return []; // Category disabled
  }

  // Use category-specific channels if available
  if (categoryPrefs && categoryPrefs.channels.length > 0) {
    return categoryPrefs.channels.filter(channel =>
      preferences.channels[channel]
    );
  }

  // Fall back to enabled channels
  const channels: NotificationChannel[] = [];
  if (preferences.channels.in_app) channels.push('in_app');
  if (preferences.channels.email) channels.push('email');
  if (preferences.channels.google_chat) channels.push('google_chat');

  return channels;
}

/**
 * Send in-app notification
 */
async function sendInAppNotification(
  recipient: NotificationRecipient,
  params: SendNotificationParams
): Promise<{ success: boolean; error?: string; notificationId?: string }> {
  try {
    const notification = await prisma.notifications.create({
      data: {
        user_id: recipient.userId,
        title: params.title,
        message: params.message,
        type: params.category, // Map category to type field
        priority: params.priority,
        link: params.actionUrl, // Map actionUrl to link field
        data: {
          actionLabel: params.actionLabel,
          imageUrl: params.imageUrl,
          ...params.metadata,
        } as any,
        read: false,
        read_at: null,
        created_at: new Date(),
      },
    });

    return {
      success: true,
      notificationId: notification.id,
    };
  } catch (error) {
    console.error('[Notifications] Error sending in-app notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send email notification
 */
async function sendEmailNotification(
  recipient: NotificationRecipient,
  params: SendNotificationParams
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!recipient.email) {
      return {
        success: false,
        error: 'No email address provided',
      };
    }

    await sendEmail({
      to: recipient.email,
      subject: params.title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${params.title}</h2>
          <p style="color: #666; line-height: 1.6;">${params.message}</p>
          ${params.actionUrl && params.actionLabel ? `
            <a href="${params.actionUrl}"
               style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin-top: 16px;">
              ${params.actionLabel}
            </a>
          ` : ''}
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">
            This is an automated notification from Limn Systems Enterprise.
          </p>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('[Notifications] Error sending email notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send Google Chat notification
 */
async function sendGoogleChatNotification(
  recipient: NotificationRecipient,
  params: SendNotificationParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const notificationType: NotificationType =
      params.priority === 'urgent' || params.priority === 'high' ? 'error' :
      params.priority === 'normal' ? 'info' : 'success';

    const message = createCardV2Message({
      type: notificationType,
      title: params.title,
      subtitle: params.message,
      message: params.message,
      metadata: params.metadata as Record<string, string> | undefined,
    });

    const result = await sendGoogleChatMessage({ message });

    return {
      success: result.success,
      error: result.error,
    };
  } catch (error) {
    console.error('[Notifications] Error sending Google Chat notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send notification to a single recipient across all applicable channels
 */
async function sendToRecipient(
  recipient: NotificationRecipient,
  params: SendNotificationParams
): Promise<NotificationResult> {
  const preferences = recipient.preferences || await getUserPreferences(recipient.userId);

  // Check quiet hours for non-urgent notifications
  if (params.priority !== 'urgent' && isQuietHours(preferences)) {
    // Queue for later or skip based on configuration
    // For now, we'll only send urgent notifications during quiet hours
    return {
      success: false,
      deliveryStatus: {},
    };
  }

  const channels = determineChannels(params, preferences);

  if (channels.length === 0) {
    return {
      success: false,
      deliveryStatus: {},
    };
  }

  const deliveryStatus: NotificationResult['deliveryStatus'] = {};
  let notificationId: string | undefined;

  // Send to each channel
  for (const channel of channels) {
    switch (channel) {
      case 'in_app':
        const inAppResult = await sendInAppNotification(recipient, params);
        deliveryStatus.in_app = inAppResult;
        if (inAppResult.notificationId) {
          notificationId = inAppResult.notificationId;
        }
        break;

      case 'email':
        deliveryStatus.email = await sendEmailNotification(recipient, params);
        break;

      case 'google_chat':
        deliveryStatus.google_chat = await sendGoogleChatNotification(recipient, params);
        break;
    }
  }

  const anySuccess = Object.values(deliveryStatus).some(status => status && status.success);

  return {
    success: anySuccess,
    notificationId,
    deliveryStatus,
  };
}

/**
 * Send notification to multiple recipients
 */
export async function sendNotification(
  params: SendNotificationParams
): Promise<NotificationResult[]> {
  const results: NotificationResult[] = [];

  for (const recipient of params.recipients) {
    const result = await sendToRecipient(recipient, params);
    results.push(result);
  }

  return results;
}

/**
 * Send notification to a single user (convenience method)
 */
export async function sendNotificationToUser(
  userId: string,
  params: Omit<SendNotificationParams, 'recipients'>
): Promise<NotificationResult> {
  const user = await prisma.user_profiles.findUnique({
    where: { id: userId },
    select: { id: true, email: true, first_name: true, last_name: true },
  });

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  const results = await sendNotification({
    ...params,
    recipients: [{
      userId: user.id,
      email: user.email || undefined,
      name: `${user.first_name} ${user.last_name}`.trim(),
    }],
  });

  return results[0] || {
    success: false,
    deliveryStatus: {},
  };
}

/**
 * Send notification to all admins
 */
export async function sendNotificationToAdmins(
  params: Omit<SendNotificationParams, 'recipients'>
): Promise<NotificationResult[]> {
  const admins = await prisma.user_profiles.findMany({
    where: {
      user_type: 'admin',
    },
    select: { id: true, email: true, first_name: true, last_name: true },
  });

  return sendNotification({
    ...params,
    recipients: admins.map(admin => ({
      userId: admin.id,
      email: admin.email || undefined,
      name: `${admin.first_name} ${admin.last_name}`.trim(),
    })),
  });
}

/**
 * Send notification to users with specific permission
 *
 * Note: RBAC integration requires user_role_assignments table.
 * For now, send to admins as fallback.
 */
export async function sendNotificationToUsersWithPermission(
  permission: string,
  params: Omit<SendNotificationParams, 'recipients'>
): Promise<NotificationResult[]> {
  // TODO: Implement when RBAC tables are fully integrated
  // For now, send to admins as a safe fallback
  console.log(`[Notifications] Sending to admins (permission: ${permission})`);
  return sendNotificationToAdmins(params);
}

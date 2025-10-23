/**
 * Server-Side Push Notification Service
 *
 * Provides web push notification delivery using the web-push library.
 * Integrates with the existing push_subscriptions table.
 */

import webpush from 'web-push';
import { prisma } from '@/lib/db';

/**
 * Initialize VAPID keys for web push
 *
 * In production, these should be set as environment variables.
 * Generate keys using: npx web-push generate-vapid-keys
 */
function initializeVapid() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@limn.us.com';

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('[Push] VAPID keys not configured - push notifications disabled');
    return false;
  }

  webpush.setVapidDetails(
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey
  );

  return true;
}

// Initialize VAPID on module load
const vapidConfigured = initializeVapid();

/**
 * Push notification payload
 */
export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

/**
 * Push delivery result
 */
export interface PushDeliveryResult {
  userId: string;
  successful: number;
  failed: number;
  errors: Array<{
    deviceId: string;
    error: string;
  }>;
}

/**
 * Send push notification to a specific user
 *
 * @param userId - User ID to send notification to
 * @param payload - Notification payload
 * @returns Delivery result
 */
export async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload
): Promise<PushDeliveryResult> {
  if (!vapidConfigured) {
    console.warn('[Push] VAPID not configured, skipping push notification');
    return {
      userId,
      successful: 0,
      failed: 0,
      errors: [{ deviceId: 'all', error: 'VAPID not configured' }],
    };
  }

  try {
    // Get all active push subscriptions for user
    const subscriptions = await prisma.push_subscriptions.findMany({
      where: {
        user_id: userId,
        is_active: true,
      },
    });

    if (subscriptions.length === 0) {
      console.log(`[Push] No active subscriptions for user ${userId}`);
      return {
        userId,
        successful: 0,
        failed: 0,
        errors: [],
      };
    }

    console.log(`[Push] Sending to ${subscriptions.length} device(s) for user ${userId}`);

    // Send to all user's devices
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: subscription.auth_keys as any,
          };

          await webpush.sendNotification(
            pushSubscription,
            JSON.stringify(payload)
          );

          // Update last_used timestamp
          await prisma.push_subscriptions.update({
            where: { id: subscription.id },
            data: { last_used: new Date() },
          });

          return { deviceId: subscription.device_id, success: true };
        } catch (error: any) {
          console.error(`[Push] Failed to send to device ${subscription.device_id}:`, error);

          // Handle subscription errors (expired, invalid, etc.)
          if (error.statusCode === 410 || error.statusCode === 404) {
            // Subscription is no longer valid, deactivate it
            await prisma.push_subscriptions.update({
              where: { id: subscription.id },
              data: { is_active: false },
            });
            console.log(`[Push] Deactivated invalid subscription for device ${subscription.device_id}`);
          }

          throw error;
        }
      })
    );

    // Aggregate results
    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    const errors = results
      .filter((r) => r.status === 'rejected')
      .map((r, index) => {
        const subscription = subscriptions.at(index);
        return {
          deviceId: subscription?.device_id || 'unknown',
          error: r.status === 'rejected' ? r.reason?.message || 'Unknown error' : '',
        };
      });

    console.log(`[Push] Delivery complete: ${successful} successful, ${failed} failed`);

    return {
      userId,
      successful,
      failed,
      errors,
    };
  } catch (error) {
    console.error('[Push] Error sending push notification:', error);
    throw error;
  }
}

/**
 * Send push notification to multiple users
 *
 * @param userIds - Array of user IDs
 * @param payload - Notification payload
 * @returns Array of delivery results
 */
export async function sendPushNotificationToUsers(
  userIds: string[],
  payload: PushNotificationPayload
): Promise<PushDeliveryResult[]> {
  const results = await Promise.all(
    userIds.map((userId) => sendPushNotification(userId, payload))
  );

  const totalSuccessful = results.reduce((sum, r) => sum + r.successful, 0);
  const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);

  console.log(`[Push] Batch delivery complete: ${totalSuccessful} successful, ${totalFailed} failed across ${userIds.length} users`);

  return results;
}

/**
 * Send push notification for a database notification
 *
 * Automatically sends push notification when a database notification is created.
 *
 * @param notificationId - Database notification ID
 */
export async function sendPushForDatabaseNotification(
  notificationId: string
): Promise<PushDeliveryResult | null> {
  try {
    // Get notification from database
    const notification = await prisma.notifications.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      console.error(`[Push] Notification ${notificationId} not found`);
      return null;
    }

    // Build push payload from database notification
    const payload: PushNotificationPayload = {
      title: (notification as any).title || 'New Notification',
      body: (notification as any).message || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: (notification as any).type || 'notification',
      data: {
        notificationId: notification.id,
        link: (notification as any).link || '/',
        ...(notification as any).data,
      },
    };

    // Send to user
    const result = await sendPushNotification(
      (notification as any).user_id,
      payload
    );

    return result;
  } catch (error) {
    console.error('[Push] Error sending push for database notification:', error);
    return null;
  }
}

/**
 * Clean up expired push subscriptions
 *
 * Should be run periodically (e.g., daily cron job)
 */
export async function cleanupExpiredSubscriptions(): Promise<number> {
  try {
    // Deactivate subscriptions not used in 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const result = await prisma.push_subscriptions.updateMany({
      where: {
        is_active: true,
        OR: [
          { last_used: { lt: ninetyDaysAgo } },
          { last_used: null, created_at: { lt: ninetyDaysAgo } },
        ],
      },
      data: {
        is_active: false,
      },
    });

    console.log(`[Push] Deactivated ${result.count} expired subscriptions`);
    return result.count;
  } catch (error) {
    console.error('[Push] Error cleaning up subscriptions:', error);
    return 0;
  }
}

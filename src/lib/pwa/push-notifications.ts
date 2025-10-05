"use client";

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class PushNotificationManager {
  private static instance: PushNotificationManager;

  private constructor() {
    this.initialize();
  }

  static getInstance(): PushNotificationManager {
    if (!PushNotificationManager.instance) {
      PushNotificationManager.instance = new PushNotificationManager();
    }
    return PushNotificationManager.instance;
  }

  private initialize(): void {
    if (typeof window === 'undefined') return;

    // Request permission on user interaction
    document.addEventListener('click', this.handleUserInteraction.bind(this), { once: true });
  }

  private async handleUserInteraction(): Promise<void> {
    // Only request if not already granted or denied
    if (Notification.permission === 'default') {
      // Show custom prompt instead of browser default
      console.log('[Push] User interaction detected - ready to request permission');
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.error('Notifications not supported');
      return 'denied';
    }

    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      console.log('[Push] Notification permission granted');
      await this.subscribeUser();
    } else {
      console.log('[Push] Notification permission denied');
    }

    return permission;
  }

  async subscribeUser(): Promise<PushSubscriptionData | null> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.error('Push notifications not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Subscribe to push notifications
        // NOTE: Replace with your actual VAPID public key in production
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

        if (!vapidPublicKey) {
          console.warn('[Push] VAPID public key not configured');
          return null;
        }

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
        });
      }

      // Extract subscription data
      const subscriptionData = this.extractSubscriptionData(subscription);

      // Send subscription to server
      await this.sendSubscriptionToServer(subscriptionData);

      console.log('[Push] User subscribed:', subscriptionData);
      return subscriptionData;
    } catch (error) {
      console.error('[Push] Failed to subscribe user:', error);
      return null;
    }
  }

  async unsubscribeUser(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Notify server to remove subscription
        await this.removeSubscriptionFromServer(this.extractSubscriptionData(subscription));

        console.log('[Push] User unsubscribed');
        return true;
      }

      return false;
    } catch (error) {
      console.error('[Push] Failed to unsubscribe user:', error);
      return false;
    }
  }

  async getSubscriptionStatus(): Promise<{
    isSubscribed: boolean;
    subscription: PushSubscriptionData | null;
  }> {
    if (!('serviceWorker' in navigator)) {
      return { isSubscribed: false, subscription: null };
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        return {
          isSubscribed: true,
          subscription: this.extractSubscriptionData(subscription),
        };
      }

      return { isSubscribed: false, subscription: null };
    } catch (error) {
      console.error('[Push] Failed to get subscription status:', error);
      return { isSubscribed: false, subscription: null };
    }
  }

  showLocalNotification(title: string, options?: NotificationOptions): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      const defaultOptions: NotificationOptions & { vibrate?: number[] } = {
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        vibrate: [200, 100, 200],
        ...options,
      };

      new Notification(title, defaultOptions);
    }
  }

  /**
   * Show notification with action buttons
   */
  async showActionNotification(
    title: string,
    options: {
      body: string;
      tag?: string;
      data?: any;
      actions: Array<{ action: string; title: string; icon?: string }>;
      requireInteraction?: boolean;
    }
  ): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('[Push] Service Worker not available');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      await registration.showNotification(title, {
        body: options.body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: options.tag || `notification-${Date.now()}`,
        data: options.data,
        actions: options.actions as any,
        vibrate: [200, 100, 200] as any,
        requireInteraction: options.requireInteraction || false,
      } as NotificationOptions);
    } catch (error) {
      console.error('[Push] Error showing action notification:', error);
    }
  }

  /**
   * Show task notification with approve/complete/snooze actions
   */
  async showTaskNotification(task: {
    id: string;
    title: string;
    description: string;
    priority: string;
  }): Promise<void> {
    await this.showActionNotification(`New Task: ${task.title}`, {
      body: task.description,
      tag: `task-${task.id}`,
      data: { type: 'task', taskId: task.id, ...task },
      actions: [
        { action: 'view', title: '👁️ View' },
        { action: 'complete', title: '✅ Complete' },
        { action: 'snooze', title: '⏰ Snooze' },
      ],
      requireInteraction: task.priority === 'high',
    });
  }

  /**
   * Show order notification with approve/reject actions
   */
  async showOrderNotification(order: {
    id: string;
    orderNumber: string;
    customer: string;
    amount: number;
  }): Promise<void> {
    await this.showActionNotification(`New Order: ${order.orderNumber}`, {
      body: `${order.customer} - $${order.amount.toFixed(2)}`,
      tag: `order-${order.id}`,
      data: { type: 'order', orderId: order.id, ...order },
      actions: [
        { action: 'approve', title: '✅ Approve' },
        { action: 'reject', title: '❌ Reject' },
        { action: 'view', title: '👁️ View Details' },
      ],
      requireInteraction: true,
    });
  }

  /**
   * Show message notification with reply action
   */
  async showMessageNotification(message: {
    id: string;
    from: string;
    subject: string;
    preview: string;
  }): Promise<void> {
    await this.showActionNotification(`Message from ${message.from}`, {
      body: `${message.subject}\n${message.preview}`,
      tag: `message-${message.id}`,
      data: { type: 'message', messageId: message.id, ...message },
      actions: [
        { action: 'reply', title: '💬 Reply' },
        { action: 'view', title: '👁️ View' },
        { action: 'archive', title: '📁 Archive' },
      ],
    });
  }

  /**
   * Group notifications by tag
   */
  async groupNotifications(tag: string, count: number, title: string): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      await registration.showNotification(title, {
        body: `You have ${count} ${tag}`,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: `group-${tag}`,
        data: { type: 'group', tag, count },
        actions: [
          { action: 'view-all', title: '👁️ View All' },
          { action: 'clear-all', title: '🗑️ Clear All' },
        ] as any,
      } as NotificationOptions);
    } catch (error) {
      console.error('[Push] Error showing grouped notification:', error);
    }
  }

  private extractSubscriptionData(subscription: PushSubscription): PushSubscriptionData {
    const keys = subscription.toJSON();
    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: keys.keys?.p256dh || '',
        auth: keys.keys?.auth || '',
      },
    };
  }

  private async sendSubscriptionToServer(subscription: PushSubscriptionData): Promise<void> {
    try {
      // TODO: Implement server endpoint to store push subscription
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        console.error('[Push] Failed to save subscription to server');
      }
    } catch (error) {
      console.error('[Push] Error sending subscription to server:', error);
    }
  }

  private async removeSubscriptionFromServer(subscription: PushSubscriptionData): Promise<void> {
    try {
      // TODO: Implement server endpoint to remove push subscription
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        console.error('[Push] Failed to remove subscription from server');
      }
    } catch (error) {
      console.error('[Push] Error removing subscription from server:', error);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      // eslint-disable-next-line security/detect-object-injection
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }
}

// Export singleton instance
export const pushNotificationManager = typeof window !== 'undefined'
  ? PushNotificationManager.getInstance()
  : null;

// React hook for push notifications
export function usePushNotifications() {
  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!pushNotificationManager) return 'denied';
    return await pushNotificationManager.requestPermission();
  };

  const subscribe = async (): Promise<PushSubscriptionData | null> => {
    if (!pushNotificationManager) return null;
    return await pushNotificationManager.subscribeUser();
  };

  const unsubscribe = async (): Promise<boolean> => {
    if (!pushNotificationManager) return false;
    return await pushNotificationManager.unsubscribeUser();
  };

  const getStatus = async () => {
    if (!pushNotificationManager) return { isSubscribed: false, subscription: null };
    return await pushNotificationManager.getSubscriptionStatus();
  };

  const showNotification = (title: string, options?: NotificationOptions): void => {
    if (!pushNotificationManager) return;
    pushNotificationManager.showLocalNotification(title, options);
  };

  return {
    requestPermission,
    subscribe,
    unsubscribe,
    getStatus,
    showNotification,
  };
}

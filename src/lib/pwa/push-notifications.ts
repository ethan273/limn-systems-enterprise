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
          applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey),
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
      const defaultOptions: NotificationOptions = {
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        vibrate: [200, 100, 200],
        ...options,
      };

      new Notification(title, defaultOptions);
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

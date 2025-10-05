"use client";

import { useEffect } from 'react';

interface PWAAnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
}

class PWAAnalytics {
  private static instance: PWAAnalytics;
  private sessionStartTime: number;
  private isStandalone: boolean;
  private connectionType: string;

  private constructor() {
    this.sessionStartTime = Date.now();
    this.isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    this.connectionType = this.getConnectionType();
  }

  static getInstance(): PWAAnalytics {
    if (!PWAAnalytics.instance) {
      PWAAnalytics.instance = new PWAAnalytics();
    }
    return PWAAnalytics.instance;
  }

  private getConnectionType(): string {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection?.effectiveType || 'unknown';
  }

  private trackEvent({ category, action, label, value }: PWAAnalyticsEvent): void {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
      });
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[PWA Analytics]', { category, action, label, value });
    }
  }

  trackInstall(): void {
    this.trackEvent({
      category: 'PWA',
      action: 'install',
      label: this.isStandalone ? 'standalone' : 'browser',
    });

    // Store install date
    if (typeof window !== 'undefined') {
      localStorage.setItem('pwa-install-date', Date.now().toString());
    }
  }

  trackOfflineUsage(pathname: string): void {
    if (!navigator.onLine) {
      this.trackEvent({
        category: 'PWA',
        action: 'offline_usage',
        label: pathname,
      });
    }
  }

  trackCacheHit(cacheName: string): void {
    this.trackEvent({
      category: 'PWA',
      action: 'cache_hit',
      label: cacheName,
    });
  }

  trackCacheMiss(url: string): void {
    this.trackEvent({
      category: 'PWA',
      action: 'cache_miss',
      label: url,
    });
  }

  trackServiceWorkerUpdate(): void {
    this.trackEvent({
      category: 'PWA',
      action: 'service_worker_update',
      label: 'new_version_available',
    });
  }

  trackSessionDuration(): void {
    const duration = Math.round((Date.now() - this.sessionStartTime) / 1000);
    this.trackEvent({
      category: 'PWA',
      action: 'session_duration',
      label: this.isStandalone ? 'standalone' : 'browser',
      value: duration,
    });
  }

  trackConnectionChange(isOnline: boolean): void {
    this.trackEvent({
      category: 'PWA',
      action: 'connection_change',
      label: isOnline ? 'online' : 'offline',
    });
  }

  trackShareAction(shareType: string): void {
    this.trackEvent({
      category: 'PWA',
      action: 'share',
      label: shareType,
    });
  }

  trackNotificationPermission(permission: NotificationPermission): void {
    this.trackEvent({
      category: 'PWA',
      action: 'notification_permission',
      label: permission,
    });
  }

  getInstallStats(): {
    isInstalled: boolean;
    installDate: number | null;
    daysSinceInstall: number | null;
  } {
    const installDate = typeof window !== 'undefined'
      ? localStorage.getItem('pwa-install-date')
      : null;

    const installTimestamp = installDate ? parseInt(installDate) : null;
    const daysSinceInstall = installTimestamp
      ? Math.floor((Date.now() - installTimestamp) / (1000 * 60 * 60 * 24))
      : null;

    return {
      isInstalled: this.isStandalone,
      installDate: installTimestamp,
      daysSinceInstall,
    };
  }

  getCacheStats(): Promise<{
    totalSize: number;
    cacheCount: number;
    caches: Array<{ name: string; size: number }>;
  }> {
    return new Promise(async (resolve) => {
      if (!('caches' in window)) {
        resolve({ totalSize: 0, cacheCount: 0, caches: [] });
        return;
      }

      try {
        const cacheNames = await caches.keys();
        const cacheStats = await Promise.all(
          cacheNames.map(async (cacheName) => {
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();
            return {
              name: cacheName,
              size: keys.length,
            };
          })
        );

        const totalSize = cacheStats.reduce((acc, cache) => acc + cache.size, 0);

        resolve({
          totalSize,
          cacheCount: cacheNames.length,
          caches: cacheStats,
        });
      } catch (error) {
        console.error('Error getting cache stats:', error);
        resolve({ totalSize: 0, cacheCount: 0, caches: [] });
      }
    });
  }
}

export function PWAAnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const analytics = PWAAnalytics.getInstance();

    // Track if running as standalone app
    if (window.matchMedia('(display-mode: standalone)').matches) {
      analytics.trackInstall();
    }

    // Track offline usage
    const handleOffline = () => {
      analytics.trackConnectionChange(false);
      analytics.trackOfflineUsage(window.location.pathname);
    };

    const handleOnline = () => {
      analytics.trackConnectionChange(true);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Track session duration on page unload
    const handleBeforeUnload = () => {
      analytics.trackSessionDuration();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Track service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        analytics.trackServiceWorkerUpdate();
      });
    }

    // Track app install events
    const handleAppInstalled = () => {
      analytics.trackInstall();
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  return <>{children}</>;
}

// Export singleton instance for use in other components
export const pwaAnalytics = typeof window !== 'undefined' ? PWAAnalytics.getInstance() : null;

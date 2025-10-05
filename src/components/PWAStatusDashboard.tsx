"use client";

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Download, Bell, Database, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useBackgroundSync } from '@/lib/pwa/background-sync';

interface PWAStatus {
  isOnline: boolean;
  isInstalled: boolean;
  installDate: number | null;
  daysSinceInstall: number | null;
  serviceWorkerStatus: 'active' | 'installing' | 'waiting' | 'none';
  notificationPermission: NotificationPermission;
  cacheStats: {
    totalSize: number;
    cacheCount: number;
    caches: Array<{ name: string; size: number }>;
  };
  syncQueueStats: {
    queueLength: number;
    oldestTimestamp: number | null;
    types: Record<string, number>;
  };
}

export function PWAStatusDashboard() {
  const [status, setStatus] = useState<PWAStatus>({
    isOnline: true,
    isInstalled: false,
    installDate: null,
    daysSinceInstall: null,
    serviceWorkerStatus: 'none',
    notificationPermission: 'default',
    cacheStats: {
      totalSize: 0,
      cacheCount: 0,
      caches: [],
    },
    syncQueueStats: {
      queueLength: 0,
      oldestTimestamp: null,
      types: {},
    },
  });

  const { getStats, processQueue, clearQueue } = useBackgroundSync();

  useEffect(() => {
    const updateStatus = async () => {
      // Online status
      const isOnline = navigator.onLine;

      // Install status
      const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
      const installDateStr = localStorage.getItem('pwa-install-date');
      const installDate = installDateStr ? parseInt(installDateStr) : null;
      const daysSinceInstall = installDate
        ? Math.floor((Date.now() - installDate) / (1000 * 60 * 60 * 24))
        : null;

      // Service worker status
      let serviceWorkerStatus: 'active' | 'installing' | 'waiting' | 'none' = 'none';
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          if (registration.active) serviceWorkerStatus = 'active';
          else if (registration.installing) serviceWorkerStatus = 'installing';
          else if (registration.waiting) serviceWorkerStatus = 'waiting';
        }
      }

      // Notification permission
      const notificationPermission = 'Notification' in window ? Notification.permission : 'default';

      // Cache stats
      let cacheStats = {
        totalSize: 0,
        cacheCount: 0,
        caches: [] as Array<{ name: string; size: number }>,
      };

      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          const cacheData = await Promise.all(
            cacheNames.map(async (cacheName) => {
              const cache = await caches.open(cacheName);
              const keys = await cache.keys();
              return {
                name: cacheName,
                size: keys.length,
              };
            })
          );

          cacheStats = {
            totalSize: cacheData.reduce((acc, cache) => acc + cache.size, 0),
            cacheCount: cacheNames.length,
            caches: cacheData,
          };
        } catch (error) {
          console.error('Error getting cache stats:', error);
        }
      }

      // Sync queue stats
      const syncQueueStats = await getStats();

      setStatus({
        isOnline,
        isInstalled,
        installDate,
        daysSinceInstall,
        serviceWorkerStatus,
        notificationPermission,
        cacheStats,
        syncQueueStats,
      });
    };

    updateStatus();

    // Update every 30 seconds
    const interval = setInterval(updateStatus, 30000);

    // Listen for online/offline events
    const handleOnline = () => updateStatus();
    const handleOffline = () => updateStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [getStats]);

  const handleClearCache = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      window.location.reload();
    }
  };

  const handleProcessQueue = async () => {
    await processQueue();
    // Refresh stats after processing
    const syncQueueStats = await getStats();
    setStatus(prev => ({ ...prev, syncQueueStats }));
  };

  const handleClearQueue = async () => {
    if (confirm('Clear all queued actions? This cannot be undone.')) {
      await clearQueue();
      const syncQueueStats = await getStats();
      setStatus(prev => ({ ...prev, syncQueueStats }));
    }
  };

  const getStatusColor = (isGood: boolean) => isGood ? 'text-success' : 'text-error';

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-bold text-foreground mb-4">PWA Status Dashboard</h2>

        {/* Connection Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="status-card">
            <div className="flex items-center gap-2 mb-2">
              {status.isOnline ? (
                <Wifi className="h-5 w-5 text-success" />
              ) : (
                <WifiOff className="h-5 w-5 text-error" />
              )}
              <h3 className="font-semibold text-foreground">Connection</h3>
            </div>
            <p className={status.isOnline ? 'text-success' : 'text-error'}>
              {status.isOnline ? 'Online' : 'Offline'}
            </p>
          </div>

          {/* Installation Status */}
          <div className="status-card">
            <div className="flex items-center gap-2 mb-2">
              <Download className={`h-5 w-5 ${getStatusColor(status.isInstalled)}`} />
              <h3 className="font-semibold text-foreground">Installation</h3>
            </div>
            <p className={getStatusColor(status.isInstalled)}>
              {status.isInstalled ? 'Installed' : 'Browser Mode'}
            </p>
            {status.daysSinceInstall !== null && (
              <p className="text-xs text-muted-foreground mt-1">
                Installed {status.daysSinceInstall} days ago
              </p>
            )}
          </div>

          {/* Service Worker Status */}
          <div className="status-card">
            <div className="flex items-center gap-2 mb-2">
              <Database className={`h-5 w-5 ${getStatusColor(status.serviceWorkerStatus === 'active')}`} />
              <h3 className="font-semibold text-foreground">Service Worker</h3>
            </div>
            <p className={getStatusColor(status.serviceWorkerStatus === 'active')}>
              {status.serviceWorkerStatus === 'active' && 'Active'}
              {status.serviceWorkerStatus === 'installing' && 'Installing'}
              {status.serviceWorkerStatus === 'waiting' && 'Waiting'}
              {status.serviceWorkerStatus === 'none' && 'Not Registered'}
            </p>
          </div>

          {/* Notification Permission */}
          <div className="status-card">
            <div className="flex items-center gap-2 mb-2">
              <Bell className={`h-5 w-5 ${getStatusColor(status.notificationPermission === 'granted')}`} />
              <h3 className="font-semibold text-foreground">Notifications</h3>
            </div>
            <p className={getStatusColor(status.notificationPermission === 'granted')}>
              {status.notificationPermission === 'granted' && 'Enabled'}
              {status.notificationPermission === 'denied' && 'Denied'}
              {status.notificationPermission === 'default' && 'Not Set'}
            </p>
          </div>

          {/* Cache Stats */}
          <div className="status-card">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-5 w-5 text-info" />
              <h3 className="font-semibold text-foreground">Cache</h3>
            </div>
            <p className="text-foreground">
              {status.cacheStats.cacheCount} caches
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {status.cacheStats.totalSize} items total
            </p>
          </div>

          {/* Sync Queue */}
          <div className="status-card">
            <div className="flex items-center gap-2 mb-2">
              <Clock className={`h-5 w-5 ${getStatusColor(status.syncQueueStats.queueLength === 0)}`} />
              <h3 className="font-semibold text-foreground">Sync Queue</h3>
            </div>
            <p className={getStatusColor(status.syncQueueStats.queueLength === 0)}>
              {status.syncQueueStats.queueLength} pending
            </p>
            {status.syncQueueStats.queueLength > 0 && (
              <div className="mt-2 space-x-2">
                <button onClick={handleProcessQueue} className="btn-sm btn-info">
                  Process Now
                </button>
                <button onClick={handleClearQueue} className="btn-sm btn-error">
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Cache Details */}
        {status.cacheStats.caches.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold text-foreground mb-3">Cache Details</h3>
            <div className="space-y-2">
              {status.cacheStats.caches.map((cache) => (
                <div key={cache.name} className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="text-sm text-foreground">{cache.name}</span>
                  <span className="text-sm text-muted-foreground">{cache.size} items</span>
                </div>
              ))}
            </div>
            <button onClick={handleClearCache} className="btn-error mt-4">
              Clear All Caches
            </button>
          </div>
        )}

        {/* Sync Queue Details */}
        {status.syncQueueStats.queueLength > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold text-foreground mb-3">Queued Actions</h3>
            <div className="space-y-2">
              {Object.entries(status.syncQueueStats.types).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="text-sm text-foreground">{type}</span>
                  <span className="text-sm text-muted-foreground">{count} pending</span>
                </div>
              ))}
            </div>
            {status.syncQueueStats.oldestTimestamp && (
              <p className="text-xs text-muted-foreground mt-2">
                Oldest action: {new Date(status.syncQueueStats.oldestTimestamp).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

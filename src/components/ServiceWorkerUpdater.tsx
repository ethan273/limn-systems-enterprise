'use client';
import { log } from '@/lib/logger';

import { useEffect } from 'react';

/**
 * Service Worker Updater Component
 *
 * CRITICAL: Forces Service Worker to update immediately and skip waiting
 * This prevents old cached Service Workers from serving stale data.
 *
 * Used in admin pages to ensure real-time data is always displayed.
 */
export default function ServiceWorkerUpdater() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const updateServiceWorker = async () => {
      try {
        // Get all registered service workers
        const registrations = await navigator.serviceWorker.getRegistrations();

        for (const registration of registrations) {
          // Force update check
          await registration.update();

          // If there's a waiting worker, force it to activate
          if (registration.waiting) {
            log.info('[SW Updater] Forcing waiting service worker to activate');
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }

          // If there's an installing worker, force it to activate when ready
          if (registration.installing) {
            log.info('[SW Updater] Found installing service worker');
            registration.installing.addEventListener('statechange', (e) => {
              const target = e.target as ServiceWorker;
              if (target.state === 'installed') {
                log.info('[SW Updater] Service worker installed, forcing activation');
                target.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        }

        // Listen for controller change (new SW activated)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          log.info('[SW Updater] New service worker activated, reloading page...');
          window.location.reload();
        });

      } catch (error) {
        log.error('[SW Updater] Error updating service worker:', { error });
      }
    };

    // Run immediately
    updateServiceWorker();

    // Also run every 30 seconds to catch updates
    const interval = setInterval(updateServiceWorker, 30000);

    return () => clearInterval(interval);
  }, []);

  return null; // This component doesn't render anything
}

'use client';
import { log } from '@/lib/logger';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function ServiceWorkerRegistration() {
  const [_registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Skip service worker registration in development unless explicitly enabled
    // This matches the next.config.js PWA disable logic
    const isDevelopment = process.env.NODE_ENV === 'development';
    const pwaEnabled = process.env.NEXT_PUBLIC_ENABLE_PWA === 'true';

    if (isDevelopment && !pwaEnabled) {
      log.info('[SW] Service worker disabled in development mode');
      return;
    }

    let isSubscribed = true;

    // Register service worker
    const registerServiceWorker = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        if (!isSubscribed) return;

        log.info('[SW] Service worker registered successfully:', reg);
        setRegistration(reg);

        // Check for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          log.info('[SW] New service worker found, installing...');

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              log.info('[SW] New service worker installed, ready to activate');
              // Could show update notification here
            }
          });
        });

        // Check for updates on load
        reg.update().catch((err) => {
          log.warn('[SW] Update check failed:', { error: err });
        });

        // Check for updates every hour
        setInterval(() => {
          reg.update().catch((err) => {
            log.warn('[SW] Periodic update check failed:', { error: err });
          });
        }, 60 * 60 * 1000);
      } catch (error) {
        log.error('[SW] Service worker registration failed:', { error });
      }
    };

    // Handle beforeinstallprompt event for PWA installation
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const installEvent = e as BeforeInstallPromptEvent;
      setInstallPrompt(installEvent);
      log.info('[PWA] Install prompt captured');
    };

    // Handle successful installation
    const handleAppInstalled = () => {
      setInstallPrompt(null);
      log.info('[PWA] App installed successfully');
    };

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Register service worker
    registerServiceWorker();

    // Cleanup
    return () => {
      isSubscribed = false;
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Expose install prompt trigger globally for other components
  useEffect(() => {
    if (installPrompt) {
      (window as any).__pwaInstallPrompt = installPrompt;
    } else {
      delete (window as any).__pwaInstallPrompt;
    }
  }, [installPrompt]);

  // This component doesn't render anything
  return null;
}

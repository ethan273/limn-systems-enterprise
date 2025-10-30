/**
 * Service Worker Update Manager
 *
 * Manages service worker updates with user-friendly prompts
 * Handles update checking, deferred updates, and version tracking
 */

'use client';
import { log } from '@/lib/logger';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, X, Download, AlertCircle } from 'lucide-react';

interface ServiceWorkerUpdateState {
  updateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
  newVersion: string | null;
  currentVersion: string | null;
  updateType: 'major' | 'minor' | 'patch' | 'unknown';
}

export function ServiceWorkerUpdateManager() {
  const [state, setState] = useState<ServiceWorkerUpdateState>({
    updateAvailable: false,
    registration: null,
    newVersion: null,
    currentVersion: null,
    updateType: 'unknown',
  });
  const [showPrompt, setShowPrompt] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deferredUpdate, setDeferredUpdate] = useState(false);

  useEffect(() => {
    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      return;
    }

    // Get current version
    const currentVersion = localStorage.getItem('sw-version') || '1.0.0';

    // Listen for service worker updates
    const checkForUpdates = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) return;

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          log.info('[SW Update] New service worker installing');

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker installed and ready
              log.info('[SW Update] New service worker installed');

              // Get version info
              const newVersion = getVersionFromWorker(newWorker);
              const updateType = determineUpdateType(currentVersion, newVersion);

              setState({
                updateAvailable: true,
                registration,
                newVersion,
                currentVersion,
                updateType,
              });

              // Show update prompt based on update type
              if (updateType === 'major') {
                // Show immediately for major updates
                setShowPrompt(true);
              } else {
                // Defer for minor/patch updates
                deferUpdatePrompt();
              }
            }
          });
        });

        // Check for updates immediately
        registration.update().catch(error => {
          log.error('[SW Update] Error checking for updates:', { error });
        });
      } catch (error) {
        log.error('[SW Update] Error setting up update listener:', { error });
      }
    };

    checkForUpdates();

    // Check for updates periodically (every hour)
    const interval = setInterval(() => {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration) {
          registration.update();
        }
      });
    }, 60 * 60 * 1000);

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'VERSION_INFO') {
        log.info('[SW Update] Service worker version:', event.data.version);
      }
    });

    return () => {
      clearInterval(interval);
    };
  }, []);

  /**
   * Get version from service worker
   */
  const getVersionFromWorker = (_worker: ServiceWorker): string => {
    // In production, this would fetch version from service worker
    // For now, use timestamp or build hash
    return new Date().toISOString().split('T')[0].replace(/-/g, '.');
  };

  /**
   * Determine update type based on version comparison
   */
  const determineUpdateType = (current: string, next: string): 'major' | 'minor' | 'patch' | 'unknown' => {
    try {
      const currentParts = current.split('.').map(Number);
      const nextParts = next.split('.').map(Number);

      if (nextParts[0] > currentParts[0]) return 'major';
      if (nextParts[1] > currentParts[1]) return 'minor';
      if (nextParts[2] > currentParts[2]) return 'patch';

      return 'unknown';
    } catch {
      return 'unknown';
    }
  };

  /**
   * Defer update prompt until later
   */
  const deferUpdatePrompt = () => {
    setDeferredUpdate(true);

    // Show prompt after 5 minutes
    setTimeout(() => {
      setShowPrompt(true);
    }, 5 * 60 * 1000);
  };

  /**
   * Apply the update
   */
  const applyUpdate = async () => {
    if (!state.registration) return;

    setUpdating(true);

    try {
      const waiting = state.registration.waiting;

      if (waiting) {
        // Tell the service worker to skip waiting
        waiting.postMessage({ type: 'SKIP_WAITING' });

        // Listen for controlling service worker change
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          // Save new version
          if (state.newVersion) {
            localStorage.setItem('sw-version', state.newVersion);
          }

          // Reload the page to use the new service worker
          window.location.reload();
        });
      }
    } catch (error) {
      log.error('[SW Update] Error applying update:', { error });
      setUpdating(false);
    }
  };

  /**
   * Dismiss the update prompt
   */
  const dismissUpdate = () => {
    setShowPrompt(false);

    // If not deferred yet, defer it
    if (!deferredUpdate) {
      deferUpdatePrompt();
    }
  };

  /**
   * Get update message based on update type
   */
  const getUpdateMessage = () => {
    switch (state.updateType) {
      case 'major':
        return {
          title: 'Major Update Available! 🚀',
          description: 'A major update with new features is available. Update now for the best experience.',
          urgent: true,
        };
      case 'minor':
        return {
          title: 'Update Available',
          description: 'A new version with improvements is available.',
          urgent: false,
        };
      case 'patch':
        return {
          title: 'Bug Fix Available',
          description: 'A small update with bug fixes is ready to install.',
          urgent: false,
        };
      default:
        return {
          title: 'Update Available',
          description: 'A new version is available.',
          urgent: false,
        };
    }
  };

  if (!showPrompt || !state.updateAvailable) {
    return null;
  }

  const { title, description, urgent } = getUpdateMessage();

  return (
    <div className="sw-update-overlay">
      <Card className={`sw-update-card ${urgent ? 'sw-update-urgent' : ''}`}>
        <CardContent className="p-6">
          {/* Close button (only for non-urgent updates) */}
          {!urgent && (
            <button
              onClick={dismissUpdate}
              className="sw-update-close"
              aria-label="Dismiss update"
              disabled={updating}
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Content */}
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start gap-3">
              {urgent ? (
                <div className="sw-update-icon urgent">
                  <AlertCircle className="h-6 w-6" />
                </div>
              ) : (
                <div className="sw-update-icon">
                  <Download className="h-6 w-6" />
                </div>
              )}

              <div className="flex-1">
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              </div>
            </div>

            {/* Version info */}
            {state.currentVersion && state.newVersion && (
              <div className="sw-update-versions">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Current:</span>
                  <span className="font-mono">{state.currentVersion}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">New:</span>
                  <span className="font-mono font-semibold">{state.newVersion}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={applyUpdate}
                disabled={updating}
                className="flex-1"
              >
                {updating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Update Now
                  </>
                )}
              </Button>

              {!urgent && (
                <Button
                  variant="outline"
                  onClick={dismissUpdate}
                  disabled={updating}
                >
                  Later
                </Button>
              )}
            </div>

            {/* Info text */}
            <p className="text-xs text-center text-muted-foreground">
              {urgent
                ? 'This update includes important improvements'
                : 'The page will reload after updating'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Hook to check for service worker updates
 */
export function useServiceWorkerUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    const checkUpdate = async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setUpdateAvailable(true);
          }
        });
      });

      // Check for updates
      await registration.update();
    };

    checkUpdate();
  }, []);

  return { updateAvailable };
}

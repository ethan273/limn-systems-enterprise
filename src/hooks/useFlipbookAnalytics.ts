import { log } from '@/lib/logger';
/**
 * useFlipbookAnalytics Hook
 *
 * Custom hook for tracking flipbook viewer analytics events.
 * Automatically tracks:
 * - View events (session start)
 * - Page turn events
 * - Hotspot click events
 * - Session duration (on unmount)
 *
 * Usage:
 * const analytics = useFlipbookAnalytics({ flipbookId, enabled: true });
 * analytics.trackPageTurn(pageNumber);
 * analytics.trackHotspotClick(hotspotId, pageNumber);
 */

import { useRef, useEffect, useCallback } from 'react';
import { api } from '@/lib/api/client';

interface UseFlipbookAnalyticsOptions {
  flipbookId?: string;
  enabled?: boolean;
}

export function useFlipbookAnalytics({
  flipbookId,
  enabled = true,
}: UseFlipbookAnalyticsOptions) {
  // Generate a unique session ID for this viewing session
  const sessionIdRef = useRef<string>(crypto.randomUUID());

  // Track session start time for duration calculation
  const sessionStartTimeRef = useRef<number>(Date.now());

  // tRPC mutations for tracking events
  const trackViewMutation = api.flipbookAnalytics.trackView.useMutation();
  const trackPageTurnMutation = api.flipbookAnalytics.trackPageTurn.useMutation();
  const trackHotspotClickMutation = api.flipbookAnalytics.trackHotspotClick.useMutation();
  const trackSessionEndMutation = api.flipbookAnalytics.trackSessionEnd.useMutation();

  /**
   * Track initial view event on mount
   */
  useEffect(() => {
    if (!enabled || !flipbookId) return;

    const trackInitialView = async () => {
      try {
        await trackViewMutation.mutateAsync({
          flipbookId,
          sessionId: sessionIdRef.current,
          userAgent: window.navigator.userAgent,
          deviceType: getDeviceType(),
          referrer: document.referrer || undefined,
        });

        log.info('[Analytics] View tracked:', {
          flipbookId,
          sessionId: sessionIdRef.current,
        });
      } catch (error) {
        log.error('[Analytics] Failed to track view:', { error });
      }
    };

    trackInitialView();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipbookId, enabled]); // Only track on mount

  /**
   * Track session end and duration on unmount
   */
  useEffect(() => {
    if (!enabled || !flipbookId) return;

    // Capture ref values at effect creation time
    const sessionId = sessionIdRef.current;
    const sessionStartTime = sessionStartTimeRef.current;

    return () => {
      const durationSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);

      // Track session end asynchronously (fire and forget)
      trackSessionEndMutation.mutate({
        flipbookId,
        sessionId,
        durationSeconds,
      });

      log.info('[Analytics] Session ended:', {
        flipbookId,
        sessionId,
        durationSeconds,
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipbookId, enabled]); // Only on unmount

  /**
   * Track page turn event
   */
  const trackPageTurn = useCallback(
    async (pageNumber: number) => {
      if (!enabled || !flipbookId) return;

      try {
        await trackPageTurnMutation.mutateAsync({
          flipbookId,
          sessionId: sessionIdRef.current,
          pageNumber,
        });

        log.info('[Analytics] Page turn tracked:', {
          flipbookId,
          sessionId: sessionIdRef.current,
          pageNumber,
        });
      } catch (error) {
        log.error('[Analytics] Failed to track page turn:', { error });
      }
    },
    [enabled, flipbookId, trackPageTurnMutation]
  );

  /**
   * Track hotspot click event
   */
  const trackHotspotClick = useCallback(
    async (hotspotId: string, pageNumber: number) => {
      if (!enabled || !flipbookId) return;

      try {
        await trackHotspotClickMutation.mutateAsync({
          flipbookId,
          sessionId: sessionIdRef.current,
          hotspotId,
          pageNumber,
        });

        log.info('[Analytics] Hotspot click tracked:', {
          flipbookId,
          sessionId: sessionIdRef.current,
          hotspotId,
          pageNumber,
        });
      } catch (error) {
        log.error('[Analytics] Failed to track hotspot click:', { error });
      }
    },
    [enabled, flipbookId, trackHotspotClickMutation]
  );

  return {
    sessionId: sessionIdRef.current,
    trackPageTurn,
    trackHotspotClick,
  };
}

/**
 * Helper function to detect device type
 */
function getDeviceType(): string {
  const ua = window.navigator.userAgent;

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

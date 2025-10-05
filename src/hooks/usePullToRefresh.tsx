/**
 * Pull-to-Refresh Hook
 *
 * Provides native-like pull-to-refresh functionality for mobile devices
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface PullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number; // Distance in pixels to trigger refresh (default: 80)
  resistance?: number; // Pull resistance multiplier (default: 2.5)
  maxPullDistance?: number; // Maximum pull distance (default: 150)
  enabled?: boolean; // Enable/disable pull-to-refresh (default: true)
}

export interface PullToRefreshState {
  pulling: boolean;
  refreshing: boolean;
  pullDistance: number;
  triggered: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
  maxPullDistance = 150,
  enabled = true,
}: PullToRefreshOptions) {
  const [state, setState] = useState<PullToRefreshState>({
    pulling: false,
    refreshing: false,
    pullDistance: 0,
    triggered: false,
  });

  const touchStartY = useRef(0);
  const currentY = useRef(0);
  const scrollableElement = useRef<HTMLElement | null>(null);

  /**
   * Check if element is at top of scroll
   */
  const isAtTop = useCallback((): boolean => {
    const element = scrollableElement.current;
    if (!element) return true;

    return element.scrollTop === 0;
  }, []);

  /**
   * Handle touch start
   */
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || state.refreshing) return;

    // Only start if at top of scroll
    if (!isAtTop()) return;

    touchStartY.current = e.touches[0].clientY;
    currentY.current = touchStartY.current;
  }, [enabled, state.refreshing, isAtTop]);

  /**
   * Handle touch move
   */
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || state.refreshing) return;

    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - touchStartY.current;

    // Only pull if moving down and at top
    if (diff > 0 && isAtTop()) {
      // Prevent default scroll behavior
      e.preventDefault();

      // Apply resistance
      const pullDistance = Math.min(diff / resistance, maxPullDistance);

      setState(prev => ({
        ...prev,
        pulling: true,
        pullDistance,
        triggered: pullDistance >= threshold,
      }));
    }
  }, [enabled, state.refreshing, isAtTop, resistance, maxPullDistance, threshold]);

  /**
   * Handle touch end
   */
  const handleTouchEnd = useCallback(async () => {
    if (!enabled || state.refreshing) return;

    if (state.triggered && state.pullDistance >= threshold) {
      // Trigger refresh
      setState(prev => ({
        ...prev,
        pulling: false,
        refreshing: true,
      }));

      try {
        await onRefresh();
      } catch (error) {
        console.error('[PullToRefresh] Error during refresh:', error);
      } finally {
        // Reset state
        setState({
          pulling: false,
          refreshing: false,
          pullDistance: 0,
          triggered: false,
        });
      }
    } else {
      // Reset state without refreshing
      setState({
        pulling: false,
        refreshing: false,
        pullDistance: 0,
        triggered: false,
      });
    }

    touchStartY.current = 0;
    currentY.current = 0;
  }, [enabled, state.refreshing, state.triggered, state.pullDistance, threshold, onRefresh]);

  /**
   * Attach event listeners
   */
  useEffect(() => {
    if (!enabled) return;

    // Get scrollable element (usually body or main content area)
    scrollableElement.current = document.querySelector('main') || document.body;

    const element = scrollableElement.current;
    if (!element) return;

    // Add touch event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      if (element) {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchmove', handleTouchMove);
        element.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return state;
}

/**
 * Pull-to-Refresh Visual Component
 */
export interface PullToRefreshIndicatorProps {
  state: PullToRefreshState;
  threshold?: number;
}

export function PullToRefreshIndicator({ state, threshold = 80 }: PullToRefreshIndicatorProps) {
  const { pulling, refreshing, pullDistance, triggered } = state;

  // Calculate progress percentage
  const progress = Math.min((pullDistance / threshold) * 100, 100);

  // Calculate opacity
  const opacity = Math.min(pullDistance / threshold, 1);

  if (!pulling && !refreshing) {
    return null;
  }

  return (
    <div
      className="pull-to-refresh-indicator"
      style={{
        transform: `translateY(${pullDistance}px)`,
        opacity,
      }}
    >
      <div className="pull-to-refresh-spinner-wrapper">
        {refreshing ? (
          <div className="pull-to-refresh-spinner refreshing">
            <svg
              className="pull-to-refresh-spinner-svg"
              viewBox="0 0 50 50"
            >
              <circle
                className="pull-to-refresh-spinner-circle"
                cx="25"
                cy="25"
                r="20"
                fill="none"
                strokeWidth="4"
              />
            </svg>
          </div>
        ) : (
          <div className={`pull-to-refresh-arrow ${triggered ? 'triggered' : ''}`}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>

      {!refreshing && (
        <div className="pull-to-refresh-text">
          {triggered ? 'Release to refresh' : 'Pull to refresh'}
        </div>
      )}

      {refreshing && (
        <div className="pull-to-refresh-text">
          Refreshing...
        </div>
      )}
    </div>
  );
}

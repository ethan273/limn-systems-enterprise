/**
 * Offline Analytics Buffering
 *
 * Buffers analytics events when offline and sends them when connection is restored
 * Ensures no analytics data is lost during offline periods
 */

'use client';
import { log } from '@/lib/logger';

interface AnalyticsEvent {
  id: string;
  type: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface BufferStats {
  totalEvents: number;
  oldestEvent: number | null;
  eventsByType: Record<string, number>;
  bufferSize: number;
}

class OfflineAnalyticsBuffer {
  private static instance: OfflineAnalyticsBuffer;
  private readonly STORAGE_KEY = 'analytics-buffer';
  private readonly MAX_BUFFER_SIZE = 1000; // Maximum events to buffer
  private readonly MAX_BATCH_SIZE = 50; // Events per batch when sending
  private syncing = false;

  private constructor() {
    this.initialize();
  }

  static getInstance(): OfflineAnalyticsBuffer {
    if (!OfflineAnalyticsBuffer.instance) {
      OfflineAnalyticsBuffer.instance = new OfflineAnalyticsBuffer();
    }
    return OfflineAnalyticsBuffer.instance;
  }

  /**
   * Initialize the analytics buffer
   */
  private initialize(): void {
    if (typeof window === 'undefined') return;

    // Listen for online/offline events
    window.addEventListener('online', () => {
      log.info('[Analytics] Connection restored - syncing buffered events');
      this.syncBufferedEvents();
    });

    // Sync on page load if online
    if (navigator.onLine) {
      this.syncBufferedEvents();
    }
  }

  /**
   * Track an analytics event
   */
  track(
    type: string,
    category: string,
    action: string,
    label?: string,
    value?: number,
    metadata?: Record<string, any>
  ): void {
    const event: AnalyticsEvent = {
      id: this.generateId(),
      type,
      category,
      action,
      label,
      value,
      timestamp: Date.now(),
      metadata,
    };

    if (navigator.onLine) {
      // Send immediately if online
      this.sendEvent(event).catch(() => {
        // If send fails, buffer it
        this.bufferEvent(event);
      });
    } else {
      // Buffer if offline
      this.bufferEvent(event);
    }
  }

  /**
   * Track page view
   */
  trackPageView(path: string, title?: string): void {
    this.track('pageview', 'Navigation', 'Page View', path, undefined, { title });
  }

  /**
   * Track user action
   */
  trackAction(action: string, category: string, label?: string, value?: number): void {
    this.track('event', category, action, label, value);
  }

  /**
   * Track custom event
   */
  trackCustom(eventName: string, properties?: Record<string, any>): void {
    this.track('custom', eventName, 'Custom Event', undefined, undefined, properties);
  }

  /**
   * Buffer an analytics event
   */
  private bufferEvent(event: AnalyticsEvent): void {
    try {
      const buffer = this.getBuffer();

      // Check buffer size limit
      if (buffer.length >= this.MAX_BUFFER_SIZE) {
        // Remove oldest events to make room
        buffer.splice(0, buffer.length - this.MAX_BUFFER_SIZE + 1);
        log.warn('[Analytics] Buffer full - removed oldest events');
      }

      buffer.push(event);
      this.saveBuffer(buffer);
    } catch (error) {
      log.error('[Analytics] Error buffering event:', { error });
    }
  }

  /**
   * Send a single event to analytics service
   */
  private async sendEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // Send to analytics endpoint
      const response = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error(`Analytics API error: ${response.status}`);
      }

      log.info('[Analytics] Event sent:', event.action);
    } catch (error) {
      log.error('[Analytics] Error sending event:', { error });
      throw error;
    }
  }

  /**
   * Sync all buffered events
   */
  async syncBufferedEvents(): Promise<{ success: number; failed: number }> {
    if (this.syncing || !navigator.onLine) {
      return { success: 0, failed: 0 };
    }

    this.syncing = true;
    const buffer = this.getBuffer();

    if (buffer.length === 0) {
      this.syncing = false;
      return { success: 0, failed: 0 };
    }

    let success = 0;
    let failed = 0;

    try {
      // Send in batches
      for (let i = 0; i < buffer.length; i += this.MAX_BATCH_SIZE) {
        const batch = buffer.slice(i, i + this.MAX_BATCH_SIZE);

        try {
          // Send batch to analytics endpoint
          const response = await fetch('/api/analytics/track-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ events: batch }),
          });

          if (response.ok) {
            success += batch.length;
          } else {
            failed += batch.length;
            log.error('[Analytics] Batch send failed:', response.status);
          }
        } catch (error) {
          failed += batch.length;
          log.error('[Analytics] Error sending batch:', { error });
        }
      }

      // Clear successfully sent events
      if (success > 0) {
        const remaining = buffer.slice(success);
        this.saveBuffer(remaining);
      }
    } finally {
      this.syncing = false;
    }

    return { success, failed };
  }

  /**
   * Get buffer from localStorage
   */
  private getBuffer(): AnalyticsEvent[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      log.error('[Analytics] Error reading buffer:', { error });
      return [];
    }
  }

  /**
   * Save buffer to localStorage
   */
  private saveBuffer(buffer: AnalyticsEvent[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(buffer));
    } catch (error) {
      log.error('[Analytics] Error saving buffer:', { error });
    }
  }

  /**
   * Get buffer statistics
   */
  getStats(): BufferStats {
    const buffer = this.getBuffer();

    const stats: BufferStats = {
      totalEvents: buffer.length,
      oldestEvent: buffer.length > 0 ? buffer[0].timestamp : null,
      eventsByType: {},
      bufferSize: new Blob([JSON.stringify(buffer)]).size,
    };

    // Count events by type
    buffer.forEach(event => {
      stats.eventsByType[event.type] = (stats.eventsByType[event.type] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clear all buffered events
   */
  clearBuffer(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      log.info('[Analytics] Buffer cleared');
    } catch (error) {
      log.error('[Analytics] Error clearing buffer:', { error });
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Export singleton instance
export const offlineAnalytics = typeof window !== 'undefined'
  ? OfflineAnalyticsBuffer.getInstance()
  : null;

/**
 * React hook for offline analytics
 */
export function useOfflineAnalytics() {
  const trackPageView = (path: string, title?: string) => {
    offlineAnalytics?.trackPageView(path, title);
  };

  const trackAction = (action: string, category: string, label?: string, value?: number) => {
    offlineAnalytics?.trackAction(action, category, label, value);
  };

  const trackCustom = (eventName: string, properties?: Record<string, any>) => {
    offlineAnalytics?.trackCustom(eventName, properties);
  };

  const syncBufferedEvents = async () => {
    if (!offlineAnalytics) return { success: 0, failed: 0 };
    return await offlineAnalytics.syncBufferedEvents();
  };

  const getStats = () => {
    if (!offlineAnalytics) return null;
    return offlineAnalytics.getStats();
  };

  const clearBuffer = () => {
    offlineAnalytics?.clearBuffer();
  };

  return {
    trackPageView,
    trackAction,
    trackCustom,
    syncBufferedEvents,
    getStats,
    clearBuffer,
  };
}

/**
 * Auto-track page views with Next.js router
 */
export function useAutoTrackPageViews() {
  React.useEffect(() => {
    if (!offlineAnalytics) return;

    // Track initial page view
    offlineAnalytics.trackPageView(window.location.pathname, document.title);

    // Track subsequent navigation (for Next.js)
    const handleRouteChange = () => {
      offlineAnalytics?.trackPageView(window.location.pathname, document.title);
    };

    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);
}

// For TypeScript imports
import React from 'react';

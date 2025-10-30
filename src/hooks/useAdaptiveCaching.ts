/**
 * Adaptive Caching Hook
 *
 * Adjusts caching strategy based on network connection quality
 * Implements smart prefetching and data loading strategies
 */

'use client';
import { log } from '@/lib/logger';

import { useState, useEffect, useCallback, useRef } from 'react';

export type ConnectionType = '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';
export type CachingStrategy = 'aggressive' | 'moderate' | 'conservative' | 'minimal';

export interface NetworkInformation extends EventTarget {
  downlink?: number;
  effectiveType?: ConnectionType;
  rtt?: number;
  saveData?: boolean;
  addEventListener(_type: 'change', _listener: EventListener): void;
  removeEventListener(_type: 'change', _listener: EventListener): void;
}

export interface AdaptiveCachingConfig {
  enablePrefetch?: boolean;
  enableImageOptimization?: boolean;
  enableDataCompression?: boolean;
  customThresholds?: Partial<Record<ConnectionType, CachingStrategy>>;
}

export interface NetworkStatus {
  online: boolean;
  connectionType: ConnectionType;
  effectiveSpeed: 'fast' | 'medium' | 'slow' | 'offline';
  saveData: boolean;
  strategy: CachingStrategy;
  downlink: number | null;
  rtt: number | null;
}

export function useAdaptiveCaching(config: AdaptiveCachingConfig = {}) {
  const {
    enablePrefetch = true,
    enableImageOptimization = true,
    enableDataCompression = true,
    customThresholds,
  } = config;

  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    online: true,
    connectionType: 'unknown',
    effectiveSpeed: 'medium',
    saveData: false,
    strategy: 'moderate',
    downlink: null,
    rtt: null,
  });

  const connectionRef = useRef<NetworkInformation | null>(null);

  /**
   * Get network information from browser
   */
  const getNetworkInfo = useCallback((): NetworkInformation | null => {
    if (typeof navigator === 'undefined') return null;

    const nav = navigator as any;
    return nav.connection || nav.mozConnection || nav.webkitConnection || null;
  }, []);

  /**
   * Determine caching strategy based on connection type
   */
  const getCachingStrategy = useCallback((type: ConnectionType, saveData: boolean): CachingStrategy => {
    if (saveData) {
      return 'minimal';
    }

    // Use custom thresholds if provided
    // eslint-disable-next-line security/detect-object-injection
    if (customThresholds && customThresholds[type]) {
      // eslint-disable-next-line security/detect-object-injection
      return customThresholds[type]!;
    }

    // Default thresholds
    const strategyMap: Record<ConnectionType, CachingStrategy> = {
      '4g': 'aggressive',
      '3g': 'moderate',
      '2g': 'conservative',
      'slow-2g': 'minimal',
      'unknown': 'moderate',
    };
    // eslint-disable-next-line security/detect-object-injection
    return strategyMap[type];
  }, [customThresholds]);

  /**
   * Determine effective speed
   */
  const getEffectiveSpeed = useCallback((type: ConnectionType, downlink: number | null): NetworkStatus['effectiveSpeed'] => {
    if (type === '4g' && (!downlink || downlink >= 5)) {
      return 'fast';
    } else if (type === '4g' || type === '3g') {
      return 'medium';
    } else if (type === '2g' || type === 'slow-2g') {
      return 'slow';
    }
    return 'medium';
  }, []);

  /**
   * Update network status
   */
  const updateNetworkStatus = useCallback(() => {
    const connection = getNetworkInfo();
    const online = navigator.onLine;

    if (!online) {
      setNetworkStatus(prev => ({
        ...prev,
        online: false,
        effectiveSpeed: 'offline',
        strategy: 'minimal',
      }));
      return;
    }

    if (!connection) {
      setNetworkStatus({
        online: true,
        connectionType: 'unknown',
        effectiveSpeed: 'medium',
        saveData: false,
        strategy: 'moderate',
        downlink: null,
        rtt: null,
      });
      return;
    }

    const connectionType = (connection.effectiveType || 'unknown') as ConnectionType;
    const saveData = connection.saveData || false;
    const downlink = connection.downlink || null;
    const rtt = connection.rtt || null;
    const strategy = getCachingStrategy(connectionType, saveData);
    const effectiveSpeed = getEffectiveSpeed(connectionType, downlink);

    setNetworkStatus({
      online: true,
      connectionType,
      effectiveSpeed,
      saveData,
      strategy,
      downlink,
      rtt,
    });
  }, [getNetworkInfo, getCachingStrategy, getEffectiveSpeed]);

  /**
   * Initialize network monitoring
   */
  useEffect(() => {
    // Initial update
    updateNetworkStatus();

    // Listen for online/offline events
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    // Listen for connection changes
    const connection = getNetworkInfo();
    if (connection) {
      connectionRef.current = connection;
      connection.addEventListener('change', updateNetworkStatus);
    }

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);

      if (connectionRef.current) {
        connectionRef.current.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, [updateNetworkStatus, getNetworkInfo]);

  /**
   * Should prefetch resources based on connection
   */
  const shouldPrefetch = useCallback((): boolean => {
    if (!enablePrefetch) return false;
    if (!networkStatus.online) return false;
    if (networkStatus.saveData) return false;

    return networkStatus.strategy === 'aggressive' || networkStatus.strategy === 'moderate';
  }, [enablePrefetch, networkStatus]);

  /**
   * Get image quality based on connection
   */
  const getImageQuality = useCallback((): 'high' | 'medium' | 'low' => {
    if (!enableImageOptimization) return 'high';

    if (networkStatus.saveData || networkStatus.effectiveSpeed === 'slow') {
      return 'low';
    } else if (networkStatus.effectiveSpeed === 'medium') {
      return 'medium';
    }

    return 'high';
  }, [enableImageOptimization, networkStatus]);

  /**
   * Get recommended page size
   */
  const getRecommendedPageSize = useCallback((): number => {
    if (networkStatus.effectiveSpeed === 'fast') {
      return 50; // More items per page on fast connections
    } else if (networkStatus.effectiveSpeed === 'medium') {
      return 20;
    } else if (networkStatus.effectiveSpeed === 'slow') {
      return 10;
    }
    return 5; // Minimal for offline/slow-2g
  }, [networkStatus]);

  /**
   * Should compress data
   */
  const shouldCompress = useCallback((): boolean => {
    if (!enableDataCompression) return false;

    return networkStatus.strategy === 'conservative' || networkStatus.strategy === 'minimal';
  }, [enableDataCompression, networkStatus]);

  /**
   * Get cache TTL based on strategy
   */
  const getCacheTTL = useCallback((): number => {
    // Return TTL in seconds
    const ttlMap: Record<CachingStrategy, number> = {
      aggressive: 3600, // 1 hour
      moderate: 1800, // 30 minutes
      conservative: 600, // 10 minutes
      minimal: 300, // 5 minutes
    };

    return ttlMap[networkStatus.strategy];
  }, [networkStatus]);

  /**
   * Prefetch resource if conditions are met
   */
  const prefetchResource = useCallback(async (url: string): Promise<void> => {
    if (!shouldPrefetch()) {
      log.info('[Adaptive Cache] Prefetch skipped - poor connection');
      return;
    }

    try {
      // Use link prefetch
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);

      log.info('[Adaptive Cache] Prefetched:', url);
    } catch (error) {
      log.error('[Adaptive Cache] Prefetch error:', { error });
    }
  }, [shouldPrefetch]);

  /**
   * Prefetch multiple resources
   */
  const prefetchResources = useCallback(async (urls: string[]): Promise<void> => {
    if (!shouldPrefetch()) return;

    // Limit concurrent prefetches based on connection
    const limit = networkStatus.strategy === 'aggressive' ? 5 : 2;

    for (let i = 0; i < urls.length; i += limit) {
      const batch = urls.slice(i, i + limit);
      await Promise.all(batch.map(url => prefetchResource(url)));
    }
  }, [shouldPrefetch, networkStatus, prefetchResource]);

  return {
    networkStatus,
    shouldPrefetch: shouldPrefetch(),
    shouldCompress: shouldCompress(),
    imageQuality: getImageQuality(),
    recommendedPageSize: getRecommendedPageSize(),
    cacheTTL: getCacheTTL(),
    prefetchResource,
    prefetchResources,
  };
}

/**
 * Hook for adaptive image loading
 */
export function useAdaptiveImage(src: string) {
  const { imageQuality, networkStatus } = useAdaptiveCaching();
  const [imageSrc, setImageSrc] = useState<string>(src);

  useEffect(() => {
    // Adjust image URL based on quality setting
    if (imageQuality === 'low') {
      setImageSrc(`${src}?quality=50&format=webp`);
    } else if (imageQuality === 'medium') {
      setImageSrc(`${src}?quality=75&format=webp`);
    } else {
      setImageSrc(src);
    }
  }, [src, imageQuality]);

  return {
    src: imageSrc,
    loading: networkStatus.effectiveSpeed === 'slow' ? 'lazy' : 'eager',
    quality: imageQuality,
  };
}

/**
 * Hook for adaptive data fetching
 */
export function useAdaptiveFetch<T>(
  fetchFn: () => Promise<T>,
  options: {
    cacheKey?: string;
    dependencies?: any[];
  } = {}
) {
  const { cacheTTL, networkStatus } = useAdaptiveCaching();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { cacheKey, dependencies = [] } = options;

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check cache first
        if (cacheKey) {
          const cached = sessionStorage.getItem(cacheKey);
          if (cached) {
            const { data: cachedData, timestamp } = JSON.parse(cached);
            const age = (Date.now() - timestamp) / 1000;

            if (age < cacheTTL) {
              if (!cancelled) {
                setData(cachedData);
                setLoading(false);
              }
              return;
            }
          }
        }

        // Fetch fresh data
        const result = await fetchFn();

        if (!cancelled) {
          setData(result);

          // Cache the result
          if (cacheKey) {
            sessionStorage.setItem(cacheKey, JSON.stringify({
              data: result,
              timestamp: Date.now(),
            }));
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Fetch failed'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchFn, cacheKey, cacheTTL, networkStatus, ...dependencies]);

  return { data, loading, error };
}

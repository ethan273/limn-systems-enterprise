/**
 * Data Freshness Indicator Component
 *
 * Shows users when data was last updated and whether it's from cache or live
 */

'use client';

import React from 'react';
import { Cloud, CloudOff, Clock, RefreshCw, WifiOff, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface DataFreshnessProps {
  lastUpdated?: Date | string | number;
  isCached?: boolean;
  isStale?: boolean;
  maxAge?: number; // Maximum age in seconds before data is considered stale
  onRefresh?: () => void;
  refreshing?: boolean;
  showRefreshButton?: boolean;
  variant?: 'inline' | 'badge' | 'banner';
}

export function DataFreshnessIndicator({
  lastUpdated,
  isCached = false,
  isStale = false,
  maxAge = 300, // 5 minutes default
  onRefresh,
  refreshing = false,
  showRefreshButton = true,
  variant = 'inline',
}: DataFreshnessProps) {
  const [isOnline, setIsOnline] = React.useState(true);

  React.useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  /**
   * Calculate if data is stale
   */
  const getDataFreshness = () => {
    if (!lastUpdated) {
      return {
        isStale: true,
        ageInSeconds: Infinity,
        ageText: 'Unknown',
      };
    }

    const lastUpdateDate = typeof lastUpdated === 'object' ? lastUpdated : new Date(lastUpdated);
    const ageInSeconds = (Date.now() - lastUpdateDate.getTime()) / 1000;
    const calculatedIsStale = ageInSeconds > maxAge;

    return {
      isStale: isStale || calculatedIsStale,
      ageInSeconds,
      ageText: formatDistanceToNow(lastUpdateDate, { addSuffix: true }),
    };
  };

  const { isStale: dataIsStale, ageText } = getDataFreshness();

  /**
   * Get status icon
   */
  const getIcon = () => {
    if (!isOnline) {
      return <WifiOff className="h-4 w-4" />;
    }
    if (refreshing) {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
    if (dataIsStale) {
      return <Clock className="h-4 w-4" />;
    }
    if (isCached) {
      return <CloudOff className="h-4 w-4" />;
    }
    return <Cloud className="h-4 w-4" />;
  };

  /**
   * Get status text
   */
  const getStatusText = () => {
    if (!isOnline) {
      return 'Offline mode';
    }
    if (refreshing) {
      return 'Updating...';
    }
    if (dataIsStale) {
      return `Stale • Updated ${ageText}`;
    }
    if (isCached) {
      return `Cached • Updated ${ageText}`;
    }
    return `Live • Updated ${ageText}`;
  };

  /**
   * Get CSS class based on status
   */
  const getStatusClass = () => {
    if (!isOnline) {
      return 'freshness-offline';
    }
    if (dataIsStale) {
      return 'freshness-stale';
    }
    if (isCached) {
      return 'freshness-cached';
    }
    return 'freshness-live';
  };

  /**
   * Render badge variant
   */
  if (variant === 'badge') {
    return (
      <span className={`freshness-badge ${getStatusClass()}`}>
        {getIcon()}
        <span className="ml-1">{getStatusText()}</span>
      </span>
    );
  }

  /**
   * Render banner variant
   */
  if (variant === 'banner') {
    return (
      <div className={`freshness-banner ${getStatusClass()}`}>
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="font-medium">{getStatusText()}</span>
        </div>
        {showRefreshButton && onRefresh && isOnline && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="freshness-refresh-btn"
            aria-label="Refresh data"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="ml-1">Refresh</span>
          </button>
        )}
      </div>
    );
  }

  /**
   * Render inline variant (default)
   */
  return (
    <div className="freshness-inline">
      <div className={`freshness-status ${getStatusClass()}`}>
        {getIcon()}
        <span className="ml-2 text-sm">{getStatusText()}</span>
      </div>
      {showRefreshButton && onRefresh && isOnline && (
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="freshness-refresh-btn"
          aria-label="Refresh data"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
}

/**
 * Compact freshness indicator for tables/lists
 */
export function CompactFreshnessIndicator({ lastUpdated }: { lastUpdated?: Date | string | number }) {
  if (!lastUpdated) {
    return null;
  }

  const lastUpdateDate = typeof lastUpdated === 'object' ? lastUpdated : new Date(lastUpdated);
  const ageInSeconds = (Date.now() - lastUpdateDate.getTime()) / 1000;
  const isStale = ageInSeconds > 300; // 5 minutes

  return (
    <span className={`freshness-compact ${isStale ? 'freshness-stale' : 'freshness-fresh'}`}>
      {isStale ? (
        <Clock className="h-3 w-3" />
      ) : (
        <Check className="h-3 w-3" />
      )}
    </span>
  );
}

/**
 * Hook to track data freshness
 */
export function useDataFreshness(initialTimestamp?: Date | string | number) {
  const [lastUpdated, setLastUpdated] = React.useState<Date | string | number | undefined>(initialTimestamp);
  const [refreshing, setRefreshing] = React.useState(false);

  const markAsRefreshed = () => {
    setLastUpdated(new Date());
  };

  const startRefresh = () => {
    setRefreshing(true);
  };

  const endRefresh = () => {
    setRefreshing(false);
    setLastUpdated(new Date());
  };

  return {
    lastUpdated,
    refreshing,
    setLastUpdated,
    markAsRefreshed,
    startRefresh,
    endRefresh,
  };
}

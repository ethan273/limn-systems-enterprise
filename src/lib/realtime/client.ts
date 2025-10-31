import { log } from '@/lib/logger';
/**
 * Real-Time Client Utilities - Phase 3 Session 3
 *
 * React hooks and utilities for real-time event subscriptions
 *
 * @module lib/realtime/client
 * @created 2025-10-30
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '@/utils/api';

export type RealtimeEvent = {
  id: string;
  event_type: 'message' | 'notification' | 'status_change' | 'workflow_update';
  event_name?: string;
  entity_type: string;
  entity_id: string;
  event_data: Record<string, any>;
  metadata: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: Date;
};

export type SSEOptions = {
  endpoint?: string;
  onEvent?: (_event: RealtimeEvent) => void;
  onError?: (_error: Error) => void;
  reconnect?: boolean;
  reconnectDelay?: number;
};

/**
 * Hook for subscribing to real-time events for a specific entity
 *
 * @example
 * ```tsx
 * const { events, refetch } = useRealtimeEvents({
 *   entityType: 'order',
 *   entityId: orderId,
 *   enabled: !!orderId,
 * });
 * ```
 */
export function useRealtimeEvents(params: {
  entityType?: string;
  entityId?: string;
  eventType?: 'message' | 'notification' | 'status_change' | 'workflow_update';
  enabled?: boolean;
}) {
  const { data, refetch, isLoading } = api.realtimeEvents.getByEntity.useQuery(
    {
      entityType: params.entityType!,
      entityId: params.entityId!,
      limit: 50,
    },
    {
      enabled: !!params.entityType && !!params.entityId && (params.enabled !== false),
      refetchInterval: 10000, // Poll every 10 seconds (until WebSocket is implemented)
    }
  );

  return {
    events: data?.events || [],
    total: data?.total || 0,
    refetch,
    isLoading,
  };
}

/**
 * Hook for getting undelivered events for the current user
 *
 * @example
 * ```tsx
 * const { events, markAsDelivered } = useMyEvents();
 * ```
 */
export function useMyEvents() {
  const { data, refetch, isLoading } = api.realtimeEvents.getMyEvents.useQuery(
    { undeliveredOnly: true },
    { refetchInterval: 5000 } // Poll every 5 seconds
  );

  const markDelivered = api.realtimeEvents.markDelivered.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const markAsDelivered = useCallback(
    (eventId: string) => {
      markDelivered.mutate({ eventId });
    },
    [markDelivered]
  );

  return {
    events: data?.events || [],
    total: data?.total || 0,
    markAsDelivered,
    isLoading,
    refetch,
  };
}

/**
 * Hook for Server-Sent Events (SSE) connection
 *
 * Note: This is a client-side implementation that requires an SSE endpoint
 * to be implemented at /api/events
 *
 * @example
 * ```tsx
 * const { events, connected, lastEvent } = useSSE({
 *   endpoint: '/api/events',
 *   onEvent: (_event) => log.info('Received:', { event }),
 * });
 * ```
 */
export function useSSE(options: SSEOptions = {}) {
  const {
    endpoint = '/api/events',
    onEvent,
    onError,
    reconnect = true,
    reconnectDelay = 3000,
  } = options;

  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    try {
      const eventSource = new EventSource(endpoint);

      eventSource.onopen = () => {
        setConnected(true);
        log.info('[SSE] Connected to', endpoint);
      };

      eventSource.onmessage = (messageEvent) => {
        try {
          const event = JSON.parse(messageEvent.data) as RealtimeEvent;
          setLastEvent(event);
          setEvents((prev) => [event, ...prev].slice(0, 100)); // Keep last 100 events

          if (onEvent) {
            onEvent(event);
          }
        } catch (err) {
          log.error('[SSE] Failed to parse event:', { error: err instanceof Error ? err.message : String(err) });
        }
      };

      eventSource.onerror = (errorEvent) => {
        log.error('[SSE] Connection error:', { error: errorEvent.type });
        setConnected(false);

        // Close the connection
        eventSource.close();

        if (onError) {
          onError(new Error('SSE connection error'));
        }

        // Attempt to reconnect
        if (reconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            log.info('[SSE] Attempting to reconnect...');
            connect();
          }, reconnectDelay);
        }
      };

      eventSourceRef.current = eventSource;
    } catch (err) {
      log.error('[SSE] Failed to establish connection:', { error: err instanceof Error ? err.message : String(err) });
      if (onError) {
        onError(err as Error);
      }
    }
  }, [endpoint, onEvent, onError, reconnect, reconnectDelay]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setConnected(false);
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    connected,
    lastEvent,
    events,
    reconnect: connect,
    disconnect,
  };
}

/**
 * Hook for polling recent events (fallback when SSE is not available)
 *
 * @example
 * ```tsx
 * const { events, refetch } = usePollingEvents({
 *   interval: 5000,
 *   entityType: 'order',
 * });
 * ```
 */
export function usePollingEvents(params: {
  interval?: number;
  entityType?: string;
  eventType?: 'message' | 'notification' | 'status_change' | 'workflow_update';
  limit?: number;
}) {
  const { interval = 10000, limit = 50, entityType, eventType } = params;

  const { data, refetch, isLoading } = api.realtimeEvents.getRecentEvents.useQuery(
    {
      limit,
      entityType,
      eventType,
    },
    {
      refetchInterval: interval,
      enabled: true,
    }
  );

  return {
    events: data?.events || [],
    total: data?.total || 0,
    refetch,
    isLoading,
  };
}

/**
 * Hook for publishing real-time events
 *
 * @example
 * ```tsx
 * const { publishEvent, isPublishing } = usePublishEvent();
 *
 * publishEvent({
 *   eventType: 'status_change',
 *   entityType: 'order',
 *   entityId: orderId,
 *   data: { oldStatus: 'pending', newStatus: 'approved' },
 *   recipients: [userId],
 * });
 * ```
 */
export function usePublishEvent() {
  const mutation = api.realtimeEvents.publishEvent.useMutation();

  const publishEvent = useCallback(
    (_event: {
      eventType: 'message' | 'notification' | 'status_change' | 'workflow_update';
      eventName?: string;
      entityType: string;
      entityId: string;
      data: Record<string, any>;
      metadata?: Record<string, any>;
      recipients?: string[];
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      expiresInMinutes?: number;
    }) => {
      return mutation.mutateAsync(_event);
    },
    [mutation]
  );

  return {
    publishEvent,
    isPublishing: mutation.isPending,
    error: mutation.error,
  };
}

/**
 * Utility function to format event timestamp
 */
export function formatEventTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString();
}

/**
 * Utility function to get event priority color
 */
export function getEventPriorityColor(
  priority: 'low' | 'normal' | 'high' | 'urgent'
): string {
  switch (priority) {
    case 'low':
      return 'text-gray-600';
    case 'normal':
      return 'text-blue-600';
    case 'high':
      return 'text-orange-600';
    case 'urgent':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

/**
 * Utility function to get event type icon
 */
export function getEventTypeIcon(
  type: 'message' | 'notification' | 'status_change' | 'workflow_update'
): string {
  switch (type) {
    case 'message':
      return '💬';
    case 'notification':
      return '🔔';
    case 'status_change':
      return '📊';
    case 'workflow_update':
      return '⚙️';
    default:
      return '📋';
  }
}

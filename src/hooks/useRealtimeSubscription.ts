"use client";


/**
 * Realtime Subscription Hooks
 *
 * Provides realtime database subscriptions for all enabled tables:
 * - production_orders
 * - quality_inspections
 * - shipments
 * - invoices
 * - notifications
 *
 * Automatically updates React Query cache when changes occur
 *
 * @module useRealtimeSubscription
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type TableName = 'production_orders' | 'quality_inspections' | 'shipments' | 'invoices' | 'notifications';

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface UseRealtimeSubscriptionOptions<TData extends Record<string, any> = Record<string, any>> {
  /**
   * Table name to subscribe to
   */
  table: TableName;

  /**
   * Query key to invalidate on changes
   */
  queryKey: any[];

  /**
   * Optional filter (e.g., 'order_id=eq.123')
   */
  filter?: string;

  /**
   * Events to listen for (default: all)
   */
  event?: RealtimeEvent;

  /**
   * Optional callback when change occurs
   */
  onUpdate?: (_payload: RealtimePostgresChangesPayload<TData>) => void;

  /**
   * Enable/disable subscription (default: true)
   */
  enabled?: boolean;
}

/**
 * Subscribe to realtime changes for a specific table
 * Automatically invalidates React Query cache when changes occur
 */
export function useRealtimeSubscription<TData extends Record<string, any> = Record<string, any>>({
  table,
  queryKey,
  filter,
  event = '*',
  onUpdate,
  enabled = true,
}: UseRealtimeSubscriptionOptions<TData>) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    if (!enabled) return;

    // Create unique channel name
    const channelName = filter
      ? `${table}-${filter.replace(/[^a-zA-Z0-9]/g, '-')}`
      : `${table}-all`;

    // Subscribe to changes
    const channel = supabase
      .channel(channelName)
      .on<RealtimePostgresChangesPayload<Record<string, any>>>(
        'postgres_changes' as any,
        {
          event,
          schema: 'public',
          table,
          ...(filter && { filter }),
        },
        (payload: RealtimePostgresChangesPayload<Record<string, any>>) => {
          // Invalidate queries to trigger refetch
          void queryClient.invalidateQueries({ queryKey });

          // Call custom callback if provided
          if (onUpdate) {
            onUpdate(payload as RealtimePostgresChangesPayload<TData>);
          }
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, table, filter, event, enabled, queryClient, queryKey, onUpdate]);
}

/**
 * Subscribe to production order changes
 */
export function useProductionOrdersRealtime(options?: {
  orderId?: string;
  queryKey?: any[];
  event?: RealtimeEvent;
  onUpdate?: (_payload: RealtimePostgresChangesPayload<Record<string, any>>) => void;
  enabled?: boolean;
}) {
  return useRealtimeSubscription<Record<string, any>>({
    table: 'production_orders',
    queryKey: options?.queryKey || ['production-orders'],
    filter: options?.orderId ? `order_id=eq.${options.orderId}` : undefined,
    event: options?.event,
    onUpdate: options?.onUpdate,
    enabled: options?.enabled,
  });
}

/**
 * Subscribe to quality inspection changes
 */
export function useQualityInspectionsRealtime(options?: {
  inspectionId?: string;
  queryKey?: any[];
  event?: RealtimeEvent;
  onUpdate?: (_payload: RealtimePostgresChangesPayload<Record<string, any>>) => void;
  enabled?: boolean;
}) {
  return useRealtimeSubscription<Record<string, any>>({
    table: 'quality_inspections',
    queryKey: options?.queryKey || ['quality-inspections'],
    filter: options?.inspectionId ? `id=eq.${options.inspectionId}` : undefined,
    event: options?.event,
    onUpdate: options?.onUpdate,
    enabled: options?.enabled,
  });
}

/**
 * Subscribe to shipment changes
 */
export function useShipmentsRealtime(options?: {
  orderId?: string;
  shipmentId?: string;
  queryKey?: any[];
  event?: RealtimeEvent;
  onUpdate?: (_payload: RealtimePostgresChangesPayload<Record<string, any>>) => void;
  enabled?: boolean;
}) {
  return useRealtimeSubscription<Record<string, any>>({
    table: 'shipments',
    queryKey: options?.queryKey || ['shipments'],
    filter: options?.shipmentId
      ? `id=eq.${options.shipmentId}`
      : options?.orderId
        ? `order_id=eq.${options.orderId}`
        : undefined,
    event: options?.event,
    onUpdate: options?.onUpdate,
    enabled: options?.enabled,
  });
}

/**
 * Subscribe to invoice changes
 */
export function useInvoicesRealtime(options?: {
  orderId?: string;
  invoiceId?: string;
  queryKey?: any[];
  event?: RealtimeEvent;
  onUpdate?: (_payload: RealtimePostgresChangesPayload<Record<string, any>>) => void;
  enabled?: boolean;
}) {
  return useRealtimeSubscription<Record<string, any>>({
    table: 'invoices',
    queryKey: options?.queryKey || ['invoices'],
    filter: options?.invoiceId
      ? `id=eq.${options.invoiceId}`
      : options?.orderId
        ? `order_id=eq.${options.orderId}`
        : undefined,
    event: options?.event,
    onUpdate: options?.onUpdate,
    enabled: options?.enabled,
  });
}

/**
 * Subscribe to notification changes
 */
export function useNotificationsRealtime(options?: {
  userId?: string;
  queryKey?: any[];
  event?: RealtimeEvent;
  onUpdate?: (_payload: RealtimePostgresChangesPayload<Record<string, any>>) => void;
  enabled?: boolean;
}) {
  return useRealtimeSubscription<Record<string, any>>({
    table: 'notifications',
    queryKey: options?.queryKey || ['notifications'],
    filter: options?.userId ? `user_id=eq.${options.userId}` : undefined,
    event: options?.event,
    onUpdate: options?.onUpdate,
    enabled: options?.enabled,
  });
}

/**
 * Subscribe to multiple tables at once
 * Useful for pages that need to track related data
 */
export function useMultiTableRealtime(subscriptions: Array<{
  table: TableName;
  queryKey: any[];
  filter?: string;
  event?: RealtimeEvent;
  onUpdate?: (_payload: RealtimePostgresChangesPayload<Record<string, any>>) => void;
}>) {
  subscriptions.forEach((sub) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useRealtimeSubscription<Record<string, any>>(sub);
  });
}

/**
 * Example Usage:
 *
 * // Basic usage - subscribe to all production orders
 * useProductionOrdersRealtime();
 *
 * // Subscribe to specific order
 * useProductionOrdersRealtime({
 *   orderId: '123',
 *   queryKey: ['production-order', '123'],
 *   onUpdate: (payload) => {
 *     log.info('Order updated:', payload.new);
 *   }
 * });
 *
 * // Subscribe to multiple tables
 * useMultiTableRealtime([
 *   { table: 'production_orders', queryKey: ['orders'] },
 *   { table: 'shipments', queryKey: ['shipments'] },
 *   { table: 'invoices', queryKey: ['invoices'] }
 * ]);
 *
 * // Conditional subscription
 * useProductionOrdersRealtime({
 *   enabled: !!orderId,
 *   orderId,
 *   queryKey: ['order', orderId]
 * });
 */

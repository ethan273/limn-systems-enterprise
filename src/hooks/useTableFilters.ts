/**
 * useTableFilters Hook
 *
 * Unified filter management system for all DataTable implementations.
 * Handles filter state, backend API synchronization, and provides controlled filter values.
 *
 * Key Features:
 * - Centralized filter state management
 * - Automatic backend query parameter generation
 * - Debounced search for performance
 * - Type-safe filter definitions
 * - Works with Vercel/Supabase/Prisma in production
 *
 * Usage:
 * ```tsx
 * const { filters, setFilter, clearFilters, queryParams } = useTableFilters({
 *   search: '',
 *   status: 'all',
 *   dateFrom: '',
 *   dateTo: ''
 * });
 *
 * const { data } = api.entity.getAll.useQuery(queryParams);
 * ```
 */

import { useState, useMemo, useCallback } from 'react';
import { useDebounce } from './useDebounce';

export interface FilterConfig {
  [key: string]: string | number | boolean | undefined;
}

export interface UseTableFiltersOptions<T extends FilterConfig> {
  initialFilters: T;
  debounceMs?: number;
}

export interface UseTableFiltersReturn<T extends FilterConfig> {
  /** Current filter values (debounced for search fields) */
  filters: T;
  /** Raw filter values (immediate, not debounced) */
  rawFilters: T;
  /** Set a specific filter value */
  setFilter: <K extends keyof T>(key: K, value: T[K]) => void;
  /** Clear all filters to initial state */
  clearFilters: () => void;
  /** Check if any filters are active (non-default values) */
  hasActiveFilters: boolean;
  /** Query parameters ready for backend API (omits 'all' values and empty strings) */
  queryParams: Partial<T>;
}

/**
 * Custom hook for managing table filters with backend synchronization
 */
export function useTableFilters<T extends FilterConfig>({
  initialFilters,
  debounceMs = 300,
}: UseTableFiltersOptions<T>): UseTableFiltersReturn<T> {
  // Raw filter state (immediate updates)
  const [rawFilters, setRawFilters] = useState<T>(initialFilters);

  // Debounced filters (used for search to reduce backend calls)
  const debouncedFilters = useDebounce(rawFilters, debounceMs);

  // Set a specific filter
  const setFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setRawFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setRawFilters(initialFilters);
  }, [initialFilters]);

  // Check if any filters are active (different from initial state)
  const hasActiveFilters = useMemo(() => {
    return Object.keys(rawFilters).some((key) => {
      const currentValue = rawFilters[key];
      const initialValue = initialFilters[key];

      // Handle 'all' special value
      if (currentValue === 'all' || initialValue === 'all') {
        return currentValue !== initialValue && currentValue !== 'all';
      }

      // Handle empty strings
      if (typeof currentValue === 'string' && currentValue === '') {
        return false;
      }

      return currentValue !== initialValue;
    });
  }, [rawFilters, initialFilters]);

  // Generate query parameters for backend API
  // Note: Excludes 'status' field to allow pages to handle type-specific status enums
  const queryParams = useMemo(() => {
    const params: any = {};

    Object.keys(debouncedFilters).forEach((key) => {
      const value = debouncedFilters[key];

      // Skip 'status' - pages should handle this with their specific enum types
      if (key === 'status') {
        return;
      }

      // Skip 'all' values (indicates no filter)
      if (value === 'all') {
        return;
      }

      // Skip empty strings
      if (typeof value === 'string' && value === '') {
        return;
      }

      // Skip undefined/null
      if (value === undefined || value === null) {
        return;
      }

      // Include the filter
      params[key as keyof T] = value;
    });

    return params;
  }, [debouncedFilters]);

  return {
    filters: debouncedFilters,
    rawFilters,
    setFilter,
    clearFilters,
    hasActiveFilters,
    queryParams,
  };
}

/**
 * Helper function to generate pagination parameters
 */
export interface PaginationConfig {
  page: number;
  pageSize: number;
}

export function usePagination(initialPageSize = 20) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const paginationParams = useMemo(() => ({
    limit: pageSize,
    offset: (page - 1) * pageSize,
  }), [page, pageSize]);

  const resetPage = useCallback(() => setPage(1), []);

  return {
    page,
    pageSize,
    setPage,
    setPageSize,
    resetPage,
    paginationParams,
  };
}

/**
 * Combined hook for filters + pagination
 */
export function useTableState<T extends FilterConfig>(options: UseTableFiltersOptions<T> & { pageSize?: number }) {
  const filters = useTableFilters<T>({
    initialFilters: options.initialFilters,
    debounceMs: options.debounceMs,
  });

  const pagination = usePagination(options.pageSize);

  // Reset to page 1 when filters change
  const setFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    filters.setFilter(key, value);
    pagination.resetPage();
  }, [filters, pagination]);

  const clearFilters = useCallback(() => {
    filters.clearFilters();
    pagination.resetPage();
  }, [filters, pagination]);

  return {
    ...filters,
    setFilter,
    clearFilters,
    ...pagination,
    // Combined query params for backend
    queryParams: {
      ...filters.queryParams,
      ...pagination.paginationParams,
    },
  };
}

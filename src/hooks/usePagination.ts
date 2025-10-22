import { useState, useCallback } from "react";

export interface PaginationState {
  page: number;
  pageSize: number;
}

export interface UsePaginationReturn {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
  setPage: (_page: number) => void;
  setPageSize: (_pageSize: number) => void;
  reset: () => void;
}

export interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
}

/**
 * Hook for managing pagination state
 *
 * @example
 * ```tsx
 * const { page, pageSize, skip, take, setPage, setPageSize } = usePagination({
 *   initialPageSize: 50,
 * });
 *
 * const { data } = api.orders.getAll.useQuery({
 *   skip,
 *   take,
 * });
 *
 * return (
 *   <DataTablePagination
 *     currentPage={page}
 *     pageSize={pageSize}
 *     totalCount={data?.total ?? 0}
 *     onPageChange={setPage}
 *     onPageSizeChange={setPageSize}
 *   />
 * );
 * ```
 */
export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const { initialPage = 1, initialPageSize = 50 } = options;

  const [page, setPageInternal] = useState(initialPage);
  const [pageSize, setPageSizeInternal] = useState(initialPageSize);

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const setPage = useCallback((newPage: number) => {
    setPageInternal(newPage);
  }, []);

  const setPageSize = useCallback((newPageSize: number) => {
    setPageSizeInternal(newPageSize);
    setPageInternal(1); // Reset to first page when changing page size
  }, []);

  const reset = useCallback(() => {
    setPageInternal(initialPage);
    setPageSizeInternal(initialPageSize);
  }, [initialPage, initialPageSize]);

  return {
    page,
    pageSize,
    skip,
    take,
    setPage,
    setPageSize,
    reset,
  };
}

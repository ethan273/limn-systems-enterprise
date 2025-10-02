"use client";

/**
 * Optimistic Update Hook
 *
 * Provides instant UI feedback by updating the UI before server confirmation
 * Automatically rolls back on error
 *
 * @module useOptimisticUpdate
 */

import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

interface UseOptimisticUpdateOptions<TData, TVariables> {
  /**
   * Query key to invalidate/update
   */
  queryKey: any[];

  /**
   * Optimistic update function
   * @param oldData - Current cached data
   * @param variables - Mutation variables
   * @returns Updated data to display optimistically
   */
  updateFn: (_oldData: TData | undefined, _variables: TVariables) => TData;

  /**
   * Optional success message
   */
  successMessage?: string;

  /**
   * Optional error message
   */
  errorMessage?: string;
}

export function useOptimisticUpdate<TData, TVariables>({
  queryKey,
  updateFn,
  successMessage,
  errorMessage,
}: UseOptimisticUpdateOptions<TData, TVariables>) {
  const queryClient = useQueryClient();

  const mutate = async (
    variables: TVariables,
    mutationFn: (_variables: TVariables) => Promise<any>
  ) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey });

    // Snapshot current value
    const previousData = queryClient.getQueryData<TData>(queryKey);

    // Optimistically update cache
    queryClient.setQueryData<TData>(queryKey, (old) => {
      return updateFn(old, variables);
    });

    try {
      // Perform actual mutation
      const result = await mutationFn(variables);

      // Show success message if provided
      if (successMessage) {
        toast({
          title: "Success",
          description: successMessage,
        });
      }

      // Invalidate to refetch from server (ensures consistency)
      await queryClient.invalidateQueries({ queryKey });

      return result;
    } catch (error) {
      // Rollback on error
      queryClient.setQueryData(queryKey, previousData);

      // Show error message
      const message = errorMessage || (error instanceof Error ? error.message : 'An error occurred');
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });

      throw error;
    }
  };

  return { mutate };
}

/**
 * Common optimistic update patterns
 */
export const optimisticPatterns = {
  /**
   * Toggle boolean field (e.g., mark task as complete)
   */
  toggleBoolean: <T extends Record<string, any>>(
    array: T[],
    id: string,
    field: keyof T
  ): T[] => {
    return array.map(item =>
      item.id === id
        ? // eslint-disable-next-line security/detect-object-injection
          { ...item, [field]: !item[field] }
        : item
    );
  },

  /**
   * Update single item in array
   */
  updateItem: <T extends Record<string, any>>(
    array: T[],
    id: string,
    updates: Partial<T>
  ): T[] => {
    return array.map(item =>
      // eslint-disable-next-line security/detect-object-injection
      item.id === id
        ? { ...item, ...updates }
        : item
    );
  },

  /**
   * Remove item from array
   */
  removeItem: <T extends Record<string, any>>(
    array: T[],
    id: string
  ): T[] => {
    return array.filter(item => item.id !== id);
  },

  /**
   * Add item to array
   */
  addItem: <T extends Record<string, any>>(
    array: T[],
    newItem: T
  ): T[] => {
    return [newItem, ...array];
  },
};

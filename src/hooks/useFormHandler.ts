"use client";

/**
 * Shared Form Handler Hook
 *
 * Eliminates code duplication in create/edit forms
 * Provides consistent error handling, success messaging, and navigation
 *
 * @module useFormHandler
 */

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface UseFormHandlerOptions<TInput, TOutput> {
  /**
   * tRPC mutation hook
   */
  mutation: {
    mutate: (_input: TInput) => void;
    mutateAsync: (_input: TInput) => Promise<TOutput>;
    isLoading: boolean;
    error: Error | null;
  };

  /**
   * Success toast message
   * @example "Item created successfully"
   */
  successMessage: string;

  /**
   * Path to redirect to after successful submission
   * @example "/items"
   */
  redirectTo?: string;

  /**
   * Optional success callback
   */
  onSuccess?: (_data: TOutput) => void;

  /**
   * Optional error callback
   */
  onError?: (_error: Error) => void;
}

export function useFormHandler<TInput, TOutput>({
  mutation,
  successMessage,
  redirectTo,
  onSuccess,
  onError,
}: UseFormHandlerOptions<TInput, TOutput>) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (input: TInput) => {
    setIsSubmitting(true);

    try {
      const result = await mutation.mutateAsync(input);

      // Success toast
      toast({
        title: "Success",
        description: successMessage,
      });

      // Custom success callback
      if (onSuccess) {
        onSuccess(result);
      }

      // Navigate if redirect path provided
      if (redirectTo) {
        router.push(redirectTo);
      }

      return result;
    } catch (error) {
      // Error toast
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      // Custom error callback
      if (onError && error instanceof Error) {
        onError(error);
      }

      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleSubmit,
    isSubmitting: isSubmitting || mutation.isLoading,
    error: mutation.error,
  };
}

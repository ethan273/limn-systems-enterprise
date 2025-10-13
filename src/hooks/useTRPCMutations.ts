/**
 * Custom hooks for tRPC mutations with automatic cache invalidation
 *
 * This provides a standardized way to handle mutations across the app
 * with automatic cache updates, so UI changes appear instantly without refresh.
 */

import { api } from '@/lib/api/client';
import { toast } from 'sonner';

/**
 * Hook options for mutations
 */
interface MutationOptions<TData = any> {
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
  invalidateQueries?: string[][]; // Array of query paths to invalidate
}

/**
 * Generic mutation hook with cache invalidation
 *
 * Example:
 * const updateTask = useMutation(
 *   api.tasks.update,
 *   {
 *     successMessage: "Task updated",
 *     invalidateQueries: [
 *       ['tasks', 'getAllTasks'],
 *       ['tasks', 'getFullDetails'],
 *       ['tasks', 'getMyTasks'],
 *     ]
 *   }
 * );
 */
export function useTRPCMutation<TInput = any, TOutput = any>(
  mutation: any,
  options: MutationOptions<TOutput> = {}
) {
  const utils = api.useUtils();

  return mutation.useMutation({
    onSuccess: (data: TOutput) => {
      // Show success toast
      if (options.successMessage) {
        toast.success(options.successMessage);
      }

      // Invalidate specified queries
      if (options.invalidateQueries) {
        options.invalidateQueries.forEach((queryPath) => {
          // Navigate through the utils object to invalidate the right query
          let target: any = utils;
          queryPath.forEach((key) => {
            target = target[key];
          });
          target.invalidate();
        });
      }

      // Call custom success handler
      options.onSuccess?.(data);
    },
    onError: (error: Error) => {
      // Show error toast
      const message = options.errorMessage || error.message;
      toast.error(message);

      // Call custom error handler
      options.onError?.(error);
    },
  });
}

/**
 * Pre-configured mutation hooks for common operations
 */

// Tasks mutations
export function useTaskMutations() {
  const utils = api.useUtils();

  const create = api.tasks.create.useMutation({
    onSuccess: () => {
      toast.success('Task created successfully');
      utils.tasks.getAllTasks.invalidate();
      utils.tasks.getMyTasks.invalidate();
    },
    onError: (error: any) => {
      toast.error(`Failed to create task: ${error.message}`);
    },
  });

  const update = api.tasks.update.useMutation({
    onSuccess: () => {
      toast.success('Task updated successfully');
      utils.tasks.getAllTasks.invalidate();
      utils.tasks.getMyTasks.invalidate();
      utils.tasks.getFullDetails.invalidate();
      utils.tasks.getById.invalidate();
    },
    onError: (error: any) => {
      toast.error(`Failed to update task: ${error.message}`);
    },
  });

  const deleteTask = api.tasks.delete.useMutation({
    onSuccess: () => {
      toast.success('Task deleted successfully');
      utils.tasks.getAllTasks.invalidate();
      utils.tasks.getMyTasks.invalidate();
    },
    onError: (error: any) => {
      toast.error(`Failed to delete task: ${error.message}`);
    },
  });

  const updateStatus = api.tasks.updateStatus.useMutation({
    onSuccess: () => {
      utils.tasks.getAllTasks.invalidate();
      utils.tasks.getMyTasks.invalidate();
      utils.tasks.getFullDetails.invalidate();
      utils.tasks.getById.invalidate();
    },
    onError: (error: any) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  return {
    create,
    update,
    delete: deleteTask,
    updateStatus,
  };
}

// CRM mutations
export function useCRMMutations() {
  const utils = api.useUtils();

  const createContact = api.crm.contacts.create.useMutation({
    onSuccess: () => {
      toast.success('Contact created successfully');
      utils.crm.contacts.list.invalidate();
    },
    onError: (error: any) => {
      toast.error(`Failed to create contact: ${error.message}`);
    },
  });

  const updateContact = api.crm.contacts.update.useMutation({
    onSuccess: () => {
      toast.success('Contact updated successfully');
      utils.crm.contacts.list.invalidate();
      utils.crm.contacts.getById.invalidate();
    },
    onError: (error: any) => {
      toast.error(`Failed to update contact: ${error.message}`);
    },
  });

  const deleteContact = api.crm.contacts.delete.useMutation({
    onSuccess: () => {
      toast.success('Contact deleted successfully');
      utils.crm.contacts.list.invalidate();
    },
    onError: (error: any) => {
      toast.error(`Failed to delete contact: ${error.message}`);
    },
  });

  return {
    createContact,
    updateContact,
    deleteContact,
  };
}

// Products mutations
export function useProductMutations() {
  const utils = api.useUtils();

  const create = api.products.create.useMutation({
    onSuccess: () => {
      toast.success('Product created successfully');
      utils.products.list.invalidate();
    },
    onError: (error: any) => {
      toast.error(`Failed to create product: ${error.message}`);
    },
  });

  const update = api.products.update.useMutation({
    onSuccess: () => {
      toast.success('Product updated successfully');
      utils.products.list.invalidate();
      utils.products.getById.invalidate();
    },
    onError: (error: any) => {
      toast.error(`Failed to update product: ${error.message}`);
    },
  });

  const deleteProduct = api.products.delete.useMutation({
    onSuccess: () => {
      toast.success('Product deleted successfully');
      utils.products.list.invalidate();
    },
    onError: (error: any) => {
      toast.error(`Failed to delete product: ${error.message}`);
    },
  });

  return {
    create,
    update,
    delete: deleteProduct,
  };
}

// Orders mutations
export function useOrderMutations() {
  const utils = api.useUtils();

  const create = api.orders.create.useMutation({
    onSuccess: () => {
      toast.success('Order created successfully');
      utils.orders.list.invalidate();
    },
    onError: (error: any) => {
      toast.error(`Failed to create order: ${error.message}`);
    },
  });

  const update = api.orders.update.useMutation({
    onSuccess: () => {
      toast.success('Order updated successfully');
      utils.orders.list.invalidate();
      utils.orders.getById.invalidate();
    },
    onError: (error: any) => {
      toast.error(`Failed to update order: ${error.message}`);
    },
  });

  const updateStatus = api.orders.updateStatus.useMutation({
    onSuccess: () => {
      utils.orders.list.invalidate();
      utils.orders.getById.invalidate();
    },
    onError: (error: any) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  return {
    create,
    update,
    updateStatus,
  };
}

# Instant UI Updates Guide

This guide explains how to implement instant UI updates across the application without requiring hard refreshes.

## Problem

Previously, when you made changes (create, update, delete), you had to manually refresh the page to see the changes. This happened because we were using manual `refetch()` calls which weren't always reliable.

## Solution: Automatic Cache Invalidation

We now use tRPC's built-in cache invalidation system with `utils.invalidate()`. When you perform a mutation, the cache is automatically invalidated and React Query refetches the data, making changes appear instantly.

## How It Works

### 1. Get tRPC Utils

In your component, get access to the tRPC utils:

```typescript
const utils = api.useUtils();
```

### 2. Invalidate Queries in Mutations

When defining mutations, use `utils.{router}.{procedure}.invalidate()` in the `onSuccess` callback:

```typescript
const updateMutation = api.tasks.update.useMutation({
  onSuccess: () => {
    toast.success("Task updated successfully");

    // Invalidate all related queries
    utils.tasks.getAllTasks.invalidate();
    utils.tasks.getMyTasks.invalidate();
    utils.tasks.getFullDetails.invalidate();
    utils.tasks.getById.invalidate();
  },
  onError: (error: any) => {
    toast.error(`Failed to update: ${error.message}`);
  },
});
```

## Complete Example: Tasks Module

### Task Detail Page (`/tasks/[id]/page.tsx`)

```typescript
"use client";

import { api } from "@/lib/api/client";
import { toast } from "sonner";

export default function TaskDetailPage({ params }: PageProps) {
  const { id } = use(params);

  // Query the task data
  const { data: task } = api.tasks.getFullDetails.useQuery(
    { id },
    { enabled: !!id }
  );

  // Get utils for cache invalidation
  const utils = api.useUtils();

  // Update mutation with automatic cache invalidation
  const updateMutation = api.tasks.update.useMutation({
    onSuccess: () => {
      toast.success("Task updated successfully");
      // Invalidate ALL related queries - updates appear instantly!
      utils.tasks.getAllTasks.invalidate();
      utils.tasks.getMyTasks.invalidate();
      utils.tasks.getFullDetails.invalidate();
      utils.tasks.getById.invalidate();
    },
    onError: (error: any) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      id,
      title: formData.title,
      description: formData.description,
      status: formData.status,
    });
  };

  return (
    <div>
      {/* Your UI here */}
    </div>
  );
}
```

### Tasks List Page (`/tasks/page.tsx`)

```typescript
"use client";

import { api } from "@/lib/api/client";
import { toast } from "sonner";

export default function TasksPage() {
  // Query tasks
  const { data: tasksData } = api.tasks.getAllTasks.useQuery({
    limit: 100,
    offset: 0,
  });

  // Get utils for cache invalidation
  const utils = api.useUtils();

  // Delete mutation
  const deleteTaskMutation = api.tasks.delete.useMutation({
    onSuccess: () => {
      toast.success("Task deleted successfully");
      // Invalidate queries - list updates instantly!
      utils.tasks.getAllTasks.invalidate();
      utils.tasks.getMyTasks.invalidate();
    },
    onError: (error: any) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  return (
    <div>
      {/* Your data table here */}
    </div>
  );
}
```

## Pattern for All Modules

Apply this pattern to ALL modules in the application:

### CRM Module

```typescript
const utils = api.useUtils();

// Create contact
const createMutation = api.crm.contacts.create.useMutation({
  onSuccess: () => {
    utils.crm.contacts.list.invalidate();
  },
});

// Update contact
const updateMutation = api.crm.contacts.update.useMutation({
  onSuccess: () => {
    utils.crm.contacts.list.invalidate();
    utils.crm.contacts.getById.invalidate();
  },
});

// Delete contact
const deleteMutation = api.crm.contacts.delete.useMutation({
  onSuccess: () => {
    utils.crm.contacts.list.invalidate();
  },
});
```

### Products Module

```typescript
const utils = api.useUtils();

const updateProduct = api.products.update.useMutation({
  onSuccess: () => {
    utils.products.list.invalidate();
    utils.products.getById.invalidate();
  },
});
```

### Orders Module

```typescript
const utils = api.useUtils();

const updateOrder = api.orders.update.useMutation({
  onSuccess: () => {
    utils.orders.list.invalidate();
    utils.orders.getById.invalidate();
  },
});
```

## When to Invalidate

### Create Operations
Invalidate:
- List queries (to show the new item)

### Update Operations
Invalidate:
- List queries (to show updated data in lists)
- Detail queries (to show updated data in detail views)
- Related queries (e.g., if updating a task, invalidate project tasks)

### Delete Operations
Invalidate:
- List queries (to remove the deleted item)
- Any related queries

## Best Practices

### 1. Invalidate Broadly

It's better to invalidate more queries than fewer. Invalidating extra queries is cheap and ensures consistency:

```typescript
// Good ✅
utils.tasks.getAllTasks.invalidate();
utils.tasks.getMyTasks.invalidate();
utils.tasks.getFullDetails.invalidate();
utils.tasks.getById.invalidate();

// Avoid ❌
utils.tasks.getAllTasks.invalidate(); // Only invalidating one
```

### 2. Don't Use refetch()

**Before (BAD):**
```typescript
const { data, refetch } = api.tasks.getAllTasks.useQuery();

const mutation = api.tasks.update.useMutation({
  onSuccess: () => {
    refetch(); // ❌ Manual refetch - doesn't update other components
  },
});
```

**After (GOOD):**
```typescript
const { data } = api.tasks.getAllTasks.useQuery();
const utils = api.useUtils();

const mutation = api.tasks.update.useMutation({
  onSuccess: () => {
    utils.tasks.getAllTasks.invalidate(); // ✅ Invalidates cache globally
  },
});
```

### 3. Show Toast Notifications

Always show success/error toasts so users know their action completed:

```typescript
const mutation = api.tasks.update.useMutation({
  onSuccess: () => {
    toast.success("Task updated successfully"); // ✅ User feedback
    utils.tasks.getAllTasks.invalidate();
  },
  onError: (error) => {
    toast.error(`Failed: ${error.message}`); // ✅ Error feedback
  },
});
```

### 4. Handle Loading States

Show loading states in your UI:

```typescript
<Button
  onClick={handleSave}
  disabled={updateMutation.isPending}
>
  {updateMutation.isPending ? 'Saving...' : 'Save'}
</Button>
```

## Custom Hooks (Optional)

For frequently used patterns, you can create custom hooks. See `/src/hooks/useTRPCMutations.ts` for pre-built hooks:

```typescript
import { useTaskMutations } from '@/hooks/useTRPCMutations';

export default function TaskPage() {
  const { update, delete: deleteTask } = useTaskMutations();

  // These hooks already have cache invalidation built in!
  const handleUpdate = () => {
    update.mutate({ id, title: "New title" });
  };
}
```

## Migration Checklist

To update an existing page:

1. ✅ Remove `refetch` from the useQuery destructuring
2. ✅ Add `const utils = api.useUtils();`
3. ✅ Replace all `refetch()` calls with `utils.{router}.{procedure}.invalidate()`
4. ✅ Invalidate ALL related queries (not just one)
5. ✅ Add toast notifications for user feedback
6. ✅ Test that changes appear instantly

## Benefits

- ✅ **Instant Updates**: Changes appear immediately across all components
- ✅ **No Hard Refresh**: Users never need to refresh the page
- ✅ **Global Sync**: All components showing the same data stay in sync
- ✅ **Better UX**: Users see their changes immediately
- ✅ **Fewer Bugs**: No stale data or inconsistent state

## Testing

After implementing, test that:

1. Creating an item shows it in the list immediately
2. Updating an item updates everywhere it's displayed
3. Deleting an item removes it from all lists immediately
4. No page refresh is required
5. Multiple tabs/windows stay in sync (bonus!)

## Need Help?

If you're unsure which queries to invalidate, invalidate all queries for that resource. It's better to invalidate too much than too little.

Example:
```typescript
// When in doubt, invalidate everything related to tasks
utils.tasks.invalidate(); // Invalidates ALL task queries
```

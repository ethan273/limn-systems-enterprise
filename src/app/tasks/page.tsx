"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
export const dynamic = 'force-dynamic';
import { api } from "@/lib/api/client";
import { useTableState } from "@/hooks/useTableFilters";
// Unused: import { Button } from "@/components/ui/button";
import {
  Dialog,
} from "@/components/ui/dialog";
import TaskCreateForm from "@/components/TaskCreateForm";
import {
  Plus,
  Calendar,
  FolderOpen,
  Pencil,
  Trash2,
  CheckSquare,
  ListTodo,
  CircleDot,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  PageHeader,
  EmptyState,
  LoadingState,
  DataTable,
  StatsGrid,
  StatusBadge,
  PriorityBadge,
  DepartmentBadge,
  TableFilters,
  type DataTableColumn,
  type DataTableRowAction,
  type StatItem,
} from "@/components/common";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';

const TASK_STATUSES: {
  value: TaskStatus;
  label: string;
  icon: any;
  description: string;
}[] = [
  {
    value: 'todo',
    label: 'To Do',
    icon: ListTodo,
    description: 'Not started yet'
  },
  {
    value: 'in_progress',
    label: 'In Progress',
    icon: CircleDot,
    description: 'Currently being worked on'
  },
  {
    value: 'completed',
    label: 'Completed',
    icon: CheckSquare,
    description: 'Successfully completed'
  },
  {
    value: 'cancelled',
    label: 'Cancelled',
    icon: XCircle,
    description: 'Cancelled or abandoned'
  },
];

export default function TasksPage() {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);

  // Unified filter management with new hook
  const {
    rawFilters,
    setFilter,
    clearFilters,
    hasActiveFilters,
    queryParams,
  } = useTableState({
    initialFilters: {
      search: '',
      status: 'all',
      priority: 'all',
      department: 'all',
    },
    debounceMs: 300,
    pageSize: 100,
  });

  const { data: tasksData, isLoading, error } = api.tasks.getAllTasks.useQuery({
    ...queryParams,
    status: rawFilters.status === 'all' ? undefined : rawFilters.status as 'todo' | 'in_progress' | 'completed' | 'cancelled' | undefined,
    priority: rawFilters.priority === 'all' ? undefined : rawFilters.priority as 'high' | 'medium' | 'low' | undefined,
    department: rawFilters.department === 'all' ? undefined : rawFilters.department as 'admin' | 'production' | 'design' | 'sales' | undefined,
  });

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  const deleteTaskMutation = api.tasks.delete.useMutation({
    onSuccess: () => {
      toast.success("Task deleted successfully");
      // Invalidate queries instead of manual refetch
      utils.tasks.getAllTasks.invalidate();
      utils.tasks.getMyTasks.invalidate();
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    },
    onError: (error: any) => {
      toast.error("Failed to delete task: " + error.message);
    },
  });

  const handleConfirmDelete = () => {
    if (taskToDelete) {
      deleteTaskMutation.mutate({ id: taskToDelete.id });
    }
  };

  // Get all user IDs from tasks to fetch user details
  const allUserIds = tasksData?.tasks?.flatMap(task => task.assigned_to || []) || [];
  const uniqueUserIds = Array.from(new Set(allUserIds));

  // Fetch user details for assigned users
  const { data: usersData, error: usersError } = api.users.getByIds.useQuery({
    ids: uniqueUserIds,
  }, { enabled: uniqueUserIds.length > 0 });

  // Create a map for quick user lookup
  const usersMap = usersData?.reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {} as Record<string, any>) || {};

  const tasks = tasksData?.tasks || [];

  // Stats configuration
  const tasksByStatus = TASK_STATUSES.map((status) => ({
    ...status,
    count: tasks.filter((t: any) => t.status === status.value).length,
  }));

  const stats: StatItem[] = tasksByStatus.map(status => ({
    title: status.label,
    value: status.count,
    description: status.description,
    icon: status.icon,
    iconColor: status.value === 'todo' ? 'warning' :
               status.value === 'in_progress' ? 'info' :
               status.value === 'completed' ? 'success' : 'destructive',
  }));

  // Filter options
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    ...TASK_STATUSES.map(s => ({ value: s.value, label: s.label })),
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'high', label: 'High Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'low', label: 'Low Priority' },
  ];

  const departmentOptions = [
    { value: 'all', label: 'All Departments' },
    { value: 'admin', label: 'Admin' },
    { value: 'production', label: 'Production' },
    { value: 'design', label: 'Design' },
    { value: 'sales', label: 'Sales' },
  ];

  // DataTable columns configuration
  const columns: DataTableColumn<any>[] = [
    {
      key: 'title',
      label: 'Task',
      sortable: true,
      render: (value, row) => (
        <div>
          <span className="font-medium">{value as string}</span>
          {row.description && (
            <p className="text-sm text-secondary line-clamp-1 mt-1">
              {row.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => value ? <StatusBadge status={value as string} /> : <span className="text-muted">—</span>,
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (value) => value ? <PriorityBadge priority={value as string} /> : <span className="text-muted">—</span>,
    },
    {
      key: 'department',
      label: 'Department',
      render: (value) => value ? <DepartmentBadge department={value as string} /> : <span className="text-muted">—</span>,
    },
    {
      key: 'assigned_to',
      label: 'Assigned To',
      render: (value) => {
        const assignedUsers = (value as string[]) || [];
        if (assignedUsers.length === 0) {
          return <span className="text-sm text-muted">Unassigned</span>;
        }
        return (
          <div className="flex items-center gap-1">
            <div className="flex -space-x-1">
              {assignedUsers.slice(0, 3).map((userId: string) => {
                const user = Object.prototype.hasOwnProperty.call(usersMap, userId) ? usersMap[userId as keyof typeof usersMap] : null;
                const initials = user ? (
                  user.full_name ?
                    (user.full_name || "?").split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) :
                    (user.name || "?").split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                ) : "?";
                return (
                  <Avatar key={userId} className="h-6 w-6">
                    <AvatarImage src={user?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                );
              })}
            </div>
            {assignedUsers.length > 3 && (
              <span className="text-xs">+{assignedUsers.length - 3}</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'project_id',
      label: 'Project',
      render: (value) => value ? (
        <div className="flex items-center gap-2">
          <FolderOpen className="icon-xs text-muted" aria-hidden="true" />
          <span>Project</span>
        </div>
      ) : <span className="text-muted">—</span>,
    },
    {
      key: 'due_date',
      label: 'Due Date',
      sortable: true,
      render: (value) => value ? (
        <div className="flex items-center gap-1">
          <Calendar className="icon-xs text-muted" aria-hidden="true" />
          <span className="text-sm">
            {formatDistanceToNow(new Date(value as string), { addSuffix: true })}
          </span>
        </div>
      ) : <span className="text-muted">—</span>,
    },
  ];

  // Row actions configuration
  const rowActions: DataTableRowAction<any>[] = [
    {
      label: 'Edit',
      icon: Pencil,
      onClick: (row) => router.push(`/tasks/${row.id}`),
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      separator: true,
      onClick: (row) => {
        setTaskToDelete(row);
        setDeleteDialogOpen(true);
      },
    },
  ];

  // Handle query error for tasks
  if (error) {
    return (
      <div className="page-container">
        <PageHeader
          title="All Tasks"
          subtitle="Manage and track all tasks across your organization"
        />
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load tasks"
          description={error.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.tasks.getAllTasks.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  // Handle query error for users
  if (usersError) {
    return (
      <div className="page-container">
        <PageHeader
          title="All Tasks"
          subtitle="Manage and track all tasks across your organization"
        />
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load user details"
          description={usersError.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.users.getByIds.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <PageHeader
        title="All Tasks"
        subtitle="Manage and track all tasks across your organization"
        actions={[
          {
            label: 'Kanban View',
            onClick: () => router.push('/tasks/kanban'),
            variant: 'secondary',
          },
          {
            label: 'Templates',
            onClick: () => router.push('/tasks/templates'),
            variant: 'secondary',
          },
          {
            label: 'New Task',
            icon: Plus,
            onClick: () => setIsCreateDialogOpen(true),
          },
        ]}
      />

      {/* Task Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <TaskCreateForm
          onSuccess={() => {
            setIsCreateDialogOpen(false);
            // Invalidate queries for instant updates
            utils.tasks.getAllTasks.invalidate();
            utils.tasks.getMyTasks.invalidate();
          }}
          onCancel={() => setIsCreateDialogOpen(false)}
        />
      </Dialog>

      {/* Stats Grid */}
      <StatsGrid stats={stats} columns={4} />

      {/* Filters - New Unified System */}
      <TableFilters.Bar
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      >
        {/* Search Filter */}
        <TableFilters.Search
          value={rawFilters.search}
          onChange={(value) => setFilter('search', value)}
          placeholder="Search by title or description..."
        />

        {/* Status Filter */}
        <TableFilters.Select
          value={rawFilters.status}
          onChange={(value) => setFilter('status', value)}
          options={statusOptions}
          placeholder="All Statuses"
        />

        {/* Priority Filter */}
        <TableFilters.Select
          value={rawFilters.priority}
          onChange={(value) => setFilter('priority', value)}
          options={priorityOptions}
          placeholder="All Priorities"
        />

        {/* Department Filter */}
        <TableFilters.Select
          value={rawFilters.department}
          onChange={(value) => setFilter('department', value)}
          options={departmentOptions}
          placeholder="All Departments"
        />
      </TableFilters.Bar>

      {/* Tasks DataTable - No filters prop (server-side only) */}
      {isLoading ? (
        <LoadingState message="Loading tasks..." size="lg" />
      ) : !tasks || tasks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No tasks found"
          description="Get started by creating your first task."
          action={{
            label: 'New Task',
            onClick: () => setIsCreateDialogOpen(true),
            icon: Plus,
          }}
        />
      ) : (
        <DataTable
          data={tasks}
          columns={columns}
          rowActions={rowActions}
          onRowClick={(row) => router.push(`/tasks/${row.id}`)}
          pagination={{ pageSize: 20, showSizeSelector: true }}
          emptyState={{
            icon: ListTodo,
            title: 'No tasks match your filters',
            description: 'Try adjusting your search or filter criteria',
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{taskToDelete?.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteTaskMutation.isPending}
            >
              {deleteTaskMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
export const dynamic = 'force-dynamic';
import { api } from "@/lib/api/client";
import { useTableState } from "@/hooks/useTableFilters";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import TaskCreateForm from "@/components/TaskCreateForm";
import {
  PageHeader,
  DataTable,
  StatsGrid,
  EmptyState,
  Breadcrumb,
  LoadingState,
  StatusBadge,
  TableFilters,
  type DataTableColumn,
  type StatItem,
} from "@/components/common";
import {
  Plus,
  MoreVertical,
  Calendar,
  FolderOpen,
  Eye,
  Edit,
  Trash,
  CheckSquare,
  Clock,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow, isAfter, parseISO } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';

export default function MyTasksPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("assigned");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Get current user from tRPC (consistent with other pages)
  const { data: currentUser, error: currentUserError } = api.userProfile.getCurrentUser.useQuery();

  // Use the actual logged-in user's ID
  const currentUserId = (currentUser as any)?.id || "";

  // Unified filter management for assigned tasks
  const assignedFilters = useTableState({
    initialFilters: {
      search: '',
      status: 'all',
      priority: 'all',
    },
    debounceMs: 300,
    pageSize: 100,
  });

  // Unified filter management for watching tasks
  const watchingFilters = useTableState({
    initialFilters: {
      search: '',
      status: 'all',
      priority: 'all',
    },
    debounceMs: 300,
    pageSize: 100,
  });

  // Unified filter management for created tasks
  const createdFilters = useTableState({
    initialFilters: {
      search: '',
      status: 'all',
      priority: 'all',
    },
    debounceMs: 300,
    pageSize: 100,
  });

  // Get my assigned tasks (only fetch when we have a valid user ID)
  const { data: assignedTasksData, isLoading: isLoadingAssigned, error: assignedTasksError } = api.tasks.getMyTasks.useQuery({
    user_id: currentUserId,
    includeWatching: false,
    ...assignedFilters.queryParams,
    status: assignedFilters.rawFilters.status === 'all' ? undefined : assignedFilters.rawFilters.status as 'todo' | 'in_progress' | 'completed' | 'cancelled' | undefined,
    priority: assignedFilters.rawFilters.priority === 'all' ? undefined : assignedFilters.rawFilters.priority as 'high' | 'medium' | 'low' | undefined,
  }, { enabled: activeTab === "assigned" && !!currentUserId });

  // Get tasks I'm watching (only fetch when we have a valid user ID)
  const { data: watchingTasksData, isLoading: isLoadingWatching, error: watchingTasksError } = api.tasks.getMyTasks.useQuery({
    user_id: currentUserId,
    includeWatching: true,
    ...watchingFilters.queryParams,
    status: watchingFilters.rawFilters.status === 'all' ? undefined : watchingFilters.rawFilters.status as 'todo' | 'in_progress' | 'completed' | 'cancelled' | undefined,
    priority: watchingFilters.rawFilters.priority === 'all' ? undefined : watchingFilters.rawFilters.priority as 'high' | 'medium' | 'low' | undefined,
  }, { enabled: activeTab === "watching" && !!currentUserId });

  // Get tasks I created (only fetch when we have a valid user ID)
  const { data: createdTasksData, isLoading: isLoadingCreated, error: createdTasksError } = api.tasks.getAllTasks.useQuery({
    sortBy: 'created_at',
    sortOrder: 'desc',
    created_by: currentUserId,
    ...createdFilters.queryParams,
    status: createdFilters.rawFilters.status === 'all' ? undefined : createdFilters.rawFilters.status as 'todo' | 'in_progress' | 'completed' | 'cancelled' | undefined,
    priority: createdFilters.rawFilters.priority === 'all' ? undefined : createdFilters.rawFilters.priority as 'high' | 'medium' | 'low' | undefined,
  }, { enabled: activeTab === "created" && !!currentUserId });

  // Get tRPC utils for cache invalidation
  const utils = api.useUtils();

  const deleteTaskMutation = api.tasks.delete.useMutation({
    onSuccess: () => {
      toast.success("Task deleted successfully");
      // Invalidate queries for instant updates
      utils.tasks.getMyTasks.invalidate();
      utils.tasks.getAllTasks.invalidate();
    },
    onError: (error: any) => {
      toast.error("Failed to delete task: " + error.message);
    },
  });

  const updateStatusMutation = api.tasks.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Task status updated");
      // Invalidate queries for instant updates
      utils.tasks.getMyTasks.invalidate();
      utils.tasks.getAllTasks.invalidate();
    },
  });

  const handleDeleteTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTaskMutation.mutate({ id: taskId });
    }
  };

  const handleStatusUpdate = (taskId: string, newStatus: TaskStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    updateStatusMutation.mutate({ id: taskId, status: newStatus });
  };

  const isOverdue = (dueDate: string | Date | null | undefined) => {
    if (!dueDate) return false;
    const date = dueDate instanceof Date ? dueDate : parseISO(dueDate);
    return isAfter(new Date(), date);
  };

  const getTasksData = () => {
    switch (activeTab) {
      case "assigned": return { data: assignedTasksData, isLoading: isLoadingAssigned };
      case "watching": return { data: watchingTasksData, isLoading: isLoadingWatching };
      case "created": return { data: createdTasksData, isLoading: isLoadingCreated };
      default: return { data: assignedTasksData, isLoading: isLoadingAssigned };
    }
  };

  const { data: tasksData, isLoading } = getTasksData();

  // Get all user IDs from tasks to fetch user details
  const allUserIds = [
    ...(assignedTasksData?.tasks?.flatMap((task: any) => task.assigned_to || []) || []),
    ...(watchingTasksData?.tasks?.flatMap((task: any) => task.assigned_to || []) || []),
    ...(createdTasksData?.tasks?.flatMap((task: any) => task.assigned_to || []) || [])
  ];
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

  const getTabCounts = () => {
    const assignedTodo = assignedTasksData?.tasks?.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length || 0;
    const watchingActive = watchingTasksData?.tasks?.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length || 0;
    const createdActive = createdTasksData?.tasks?.filter((t: any) => t.status !== 'completed' && t.status !== 'cancelled').length || 0;

    return { assignedTodo, watchingActive, createdActive };
  };

  const { assignedTodo, watchingActive, createdActive } = getTabCounts();

  // Filter options
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  // Stats configuration
  const stats: StatItem[] = [
    {
      title: 'Assigned Tasks',
      value: assignedTodo,
      description: 'Active tasks',
      icon: CheckSquare,
      iconColor: 'info',
    },
    {
      title: 'Watching',
      value: watchingActive,
      description: 'Following',
      icon: Eye,
      iconColor: 'success',
    },
    {
      title: 'Created',
      value: createdActive,
      description: 'You created',
      icon: AlertCircle,
      iconColor: 'primary',
    },
  ];

  // DataTable columns configuration
  const columns: DataTableColumn<any>[] = [
    {
      key: 'title',
      label: 'Task',
      sortable: true,
      render: (_, row) => {
        const overdueFlag = isOverdue(row.due_date) && row.status !== 'completed' && row.status !== 'cancelled';
        return (
          <div className="flex items-center gap-2">
            <div>
              <span className="font-medium">{row.title}</span>
              {row.description && (
                <p className="text-sm text-secondary line-clamp-1 mt-1">
                  {row.description}
                </p>
              )}
            </div>
            {overdueFlag && (
              <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" aria-hidden="true" />
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => value ? <StatusBadge status={value as string} /> : null,
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (value) => value ? <StatusBadge status={value as string} /> : <span className="text-muted">—</span>,
    },
    {
      key: 'department',
      label: 'Department',
      render: (value) => value ? <StatusBadge status={value as string} /> : <span className="text-muted">—</span>,
    },
    {
      key: 'assigned_to',
      label: 'Assigned To',
      render: (value) => {
        const assignedUsers = value as string[] || [];
        if (assignedUsers.length === 0) return <span className="text-sm">Unassigned</span>;
        return (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1">
              {assignedUsers.slice(0, 3).map((userId: string) => {
                const user = Object.prototype.hasOwnProperty.call(usersMap, userId) ? usersMap[userId as keyof typeof usersMap] : null;
                const initials = user ? (
                  user.full_name ?
                    user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) :
                    user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
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
      render: (value) => (
        <div className="flex items-center gap-2">
          <FolderOpen className="icon-xs" aria-hidden="true" />
          {value ? "Project Name" : "—"}
        </div>
      ),
    },
    {
      key: 'due_date',
      label: 'Due Date',
      sortable: true,
      render: (value, row) => {
        if (!value || (typeof value !== 'string' && !(value instanceof Date))) return "—";
        const overdueFlag = isOverdue(value as string | Date) && row.status !== 'completed' && row.status !== 'cancelled';
        return (
          <div className="flex items-center gap-1">
            <Calendar className="icon-xs" aria-hidden="true" />
            <span className={cn(
              "text-sm",
              overdueFlag ? "text-destructive" : ""
            )}>
              {formatDistanceToNow(value instanceof Date ? value : parseISO(value as string), { addSuffix: true })}
            </span>
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="btn-icon">
              <MoreVertical className="icon-sm" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="card">
            <DropdownMenuItem
              className="dropdown-item"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/tasks/${row.id}`);
              }}
            >
              <Eye className="icon-sm" aria-hidden="true" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => handleStatusUpdate(row.id, 'in_progress', e)}
              disabled={row.status === 'in_progress'}
              className="dropdown-item"
            >
              <Clock className="icon-sm" aria-hidden="true" />
              Start Working
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => handleStatusUpdate(row.id, 'completed', e)}
              disabled={row.status === 'completed'}
              className="dropdown-item"
            >
              <CheckSquare className="icon-sm" aria-hidden="true" />
              Mark Complete
            </DropdownMenuItem>
            <DropdownMenuItem className="dropdown-item">
              <Edit className="icon-sm" aria-hidden="true" />
              Edit Task
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => handleDeleteTask(row.id, e)}
              className="dropdown-item-danger"
            >
              <Trash className="icon-sm" aria-hidden="true" />
              Delete Task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Handle query error for current user
  if (currentUserError) {
    return (
      <div className="page-container">
        <PageHeader
          title="My Tasks"
          subtitle="Personal task dashboard and assignment overview"
        />
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load user information"
          description={currentUserError.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => utils.userProfile.getCurrentUser.invalidate(),
            icon: RefreshCw,
          }}
        />
      </div>
    );
  }

  // Handle query error for tasks based on active tab
  const currentError = activeTab === "assigned" ? assignedTasksError :
                       activeTab === "watching" ? watchingTasksError :
                       createdTasksError;

  if (currentError) {
    return (
      <div className="page-container">
        <PageHeader
          title="My Tasks"
          subtitle="Personal task dashboard and assignment overview"
        />
        <EmptyState
          icon={AlertTriangle}
          title="Failed to load tasks"
          description={currentError.message || "An unexpected error occurred. Please try again."}
          action={{
            label: 'Try Again',
            onClick: () => {
              if (activeTab === "assigned") {
                utils.tasks.getMyTasks.invalidate();
              } else if (activeTab === "watching") {
                utils.tasks.getMyTasks.invalidate();
              } else {
                utils.tasks.getAllTasks.invalidate();
              }
            },
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
          title="My Tasks"
          subtitle="Personal task dashboard and assignment overview"
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
      <Breadcrumb />
      {/* Page Header */}
      <PageHeader
        title="My Tasks"
        subtitle="Personal task dashboard and assignment overview"
        actions={[
          {
            label: 'New Task',
            icon: Plus,
            onClick: () => setIsCreateDialogOpen(true),
          },
        ]}
      />

      {/* Create Task Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button style={{ display: 'none' }}>New Task</Button>
        </DialogTrigger>
        <TaskCreateForm
          onSuccess={() => {
            setIsCreateDialogOpen(false);
            // Invalidate queries for instant updates
            utils.tasks.getMyTasks.invalidate();
            utils.tasks.getAllTasks.invalidate();
          }}
          onCancel={() => setIsCreateDialogOpen(false)}
        />
      </Dialog>

      {/* Quick Stats */}
      <StatsGrid stats={stats} columns={3} />

      {/* Tasks Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assigned" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Assigned ({assignedTodo})
          </TabsTrigger>
          <TabsTrigger value="watching" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Watching ({watchingActive})
          </TabsTrigger>
          <TabsTrigger value="created" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Created ({createdActive})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assigned" className="mt-6">
          {/* Filters - New Unified System */}
          <TableFilters.Bar
            hasActiveFilters={assignedFilters.hasActiveFilters}
            onClearFilters={assignedFilters.clearFilters}
          >
            <TableFilters.Search
              value={assignedFilters.rawFilters.search}
              onChange={(value) => assignedFilters.setFilter('search', value)}
              placeholder="Search by title or description..."
            />
            <TableFilters.Select
              value={assignedFilters.rawFilters.status}
              onChange={(value) => assignedFilters.setFilter('status', value)}
              options={statusOptions}
              placeholder="All Statuses"
            />
            <TableFilters.Select
              value={assignedFilters.rawFilters.priority}
              onChange={(value) => assignedFilters.setFilter('priority', value)}
              options={priorityOptions}
              placeholder="All Priorities"
            />
          </TableFilters.Bar>

          {isLoading ? (
            <LoadingState message="Loading your tasks..." size="lg" />
          ) : !tasksData?.tasks || tasksData.tasks.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No assigned tasks"
              description="You don't have any tasks assigned to you."
              action={{
                label: 'Create Task',
                onClick: () => setIsCreateDialogOpen(true),
                icon: Plus,
              }}
            />
          ) : (
            <DataTable
              data={tasksData.tasks}
              columns={columns}
              onRowClick={(row) => router.push(`/tasks/${row.id}`)}
              pagination={{ pageSize: 20, showSizeSelector: true }}
              emptyState={{
                icon: CheckSquare,
                title: 'No tasks match your filters',
                description: 'Try adjusting your search or filter criteria',
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="watching" className="mt-6">
          {/* Filters - New Unified System */}
          <TableFilters.Bar
            hasActiveFilters={watchingFilters.hasActiveFilters}
            onClearFilters={watchingFilters.clearFilters}
          >
            <TableFilters.Search
              value={watchingFilters.rawFilters.search}
              onChange={(value) => watchingFilters.setFilter('search', value)}
              placeholder="Search by title or description..."
            />
            <TableFilters.Select
              value={watchingFilters.rawFilters.status}
              onChange={(value) => watchingFilters.setFilter('status', value)}
              options={statusOptions}
              placeholder="All Statuses"
            />
            <TableFilters.Select
              value={watchingFilters.rawFilters.priority}
              onChange={(value) => watchingFilters.setFilter('priority', value)}
              options={priorityOptions}
              placeholder="All Priorities"
            />
          </TableFilters.Bar>

          {isLoading ? (
            <LoadingState message="Loading watched tasks..." size="lg" />
          ) : !tasksData?.tasks || tasksData.tasks.length === 0 ? (
            <EmptyState
              icon={Eye}
              title="No watched tasks"
              description="You're not watching any tasks."
            />
          ) : (
            <DataTable
              data={tasksData.tasks}
              columns={columns}
              onRowClick={(row) => router.push(`/tasks/${row.id}`)}
              pagination={{ pageSize: 20, showSizeSelector: true }}
              emptyState={{
                icon: Eye,
                title: 'No tasks match your filters',
                description: 'Try adjusting your search or filter criteria',
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="created" className="mt-6">
          {/* Filters - New Unified System */}
          <TableFilters.Bar
            hasActiveFilters={createdFilters.hasActiveFilters}
            onClearFilters={createdFilters.clearFilters}
          >
            <TableFilters.Search
              value={createdFilters.rawFilters.search}
              onChange={(value) => createdFilters.setFilter('search', value)}
              placeholder="Search by title or description..."
            />
            <TableFilters.Select
              value={createdFilters.rawFilters.status}
              onChange={(value) => createdFilters.setFilter('status', value)}
              options={statusOptions}
              placeholder="All Statuses"
            />
            <TableFilters.Select
              value={createdFilters.rawFilters.priority}
              onChange={(value) => createdFilters.setFilter('priority', value)}
              options={priorityOptions}
              placeholder="All Priorities"
            />
          </TableFilters.Bar>

          {isLoading ? (
            <LoadingState message="Loading created tasks..." size="lg" />
          ) : !tasksData?.tasks || tasksData.tasks.length === 0 ? (
            <EmptyState
              icon={AlertCircle}
              title="No created tasks"
              description="You haven't created any tasks yet."
              action={{
                label: 'Create Task',
                onClick: () => setIsCreateDialogOpen(true),
                icon: Plus,
              }}
            />
          ) : (
            <DataTable
              data={tasksData.tasks}
              columns={columns}
              onRowClick={(row) => router.push(`/tasks/${row.id}`)}
              pagination={{ pageSize: 20, showSizeSelector: true }}
              emptyState={{
                icon: AlertCircle,
                title: 'No tasks match your filters',
                description: 'Try adjusting your search or filter criteria',
              }}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

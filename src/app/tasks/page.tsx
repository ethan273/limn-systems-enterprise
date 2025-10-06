"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
export const dynamic = 'force-dynamic';
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
} from "@/components/ui/dialog";
import TaskCreateForm from "@/components/TaskCreateForm";
import {
  Plus,
  MoreVertical,
  Calendar,
  FolderOpen,
  Eye,
  Edit,
  Trash,
  CheckSquare,
  ListTodo,
  CircleDot,
  XCircle,
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
  type DataTableColumn,
  type DataTableFilter,
  type StatItem,
} from "@/components/common";

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

  const { data: tasksData, isLoading, refetch } = api.tasks.getAllTasks.useQuery({
    limit: 100,
    offset: 0,
  });

  const deleteTaskMutation = api.tasks.delete.useMutation({
    onSuccess: () => {
      toast.success("Task deleted successfully");
      refetch();
    },
    onError: (error: any) => {
      toast.error("Failed to delete task: " + error.message);
    },
  });

  const handleDeleteTask = (taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTaskMutation.mutate({ id: taskId });
    }
  };

  // Get all user IDs from tasks to fetch user details
  const allUserIds = tasksData?.tasks?.flatMap(task => task.assigned_to || []) || [];
  const uniqueUserIds = Array.from(new Set(allUserIds));

  // Fetch user details for assigned users
  const { data: usersData } = api.users.getByIds.useQuery({
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
            <DropdownMenuItem className="dropdown-item">
              <Edit className="icon-sm" aria-hidden="true" />
              Edit Task
            </DropdownMenuItem>
            <DropdownMenuItem
              className="dropdown-item-danger"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteTask(row.id);
              }}
            >
              <Trash className="icon-sm" aria-hidden="true" />
              Delete Task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // DataTable filters configuration
  const filters: DataTableFilter[] = [
    {
      key: 'search',
      label: 'Search tasks',
      type: 'search',
      placeholder: 'Search by title or description...',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All Statuses' },
        ...TASK_STATUSES.map(s => ({ value: s.value, label: s.label })),
      ],
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'select',
      options: [
        { value: 'all', label: 'All Priorities' },
        { value: 'high', label: 'High Priority' },
        { value: 'medium', label: 'Medium Priority' },
        { value: 'low', label: 'Low Priority' },
      ],
    },
    {
      key: 'department',
      label: 'Department',
      type: 'select',
      options: [
        { value: 'all', label: 'All Departments' },
        { value: 'admin', label: 'Admin' },
        { value: 'production', label: 'Production' },
        { value: 'design', label: 'Design' },
        { value: 'sales', label: 'Sales' },
      ],
    },
  ];

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
            refetch();
          }}
          onCancel={() => setIsCreateDialogOpen(false)}
        />
      </Dialog>

      {/* Stats Grid */}
      <StatsGrid stats={stats} columns={4} />

      {/* Tasks DataTable */}
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
          filters={filters}
          onRowClick={(row) => router.push(`/tasks/${row.id}`)}
          pagination={{ pageSize: 20, showSizeSelector: true }}
          emptyState={{
            icon: ListTodo,
            title: 'No tasks match your filters',
            description: 'Try adjusting your search or filter criteria',
          }}
        />
      )}
    </div>
  );
}

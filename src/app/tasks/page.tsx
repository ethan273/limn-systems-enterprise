"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// Disable static generation for auth-dependent pages
export const dynamic = 'force-dynamic';
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import TaskCreateForm from "@/components/TaskCreateForm";
import {
  Search,
  Filter,
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
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';
type TaskPriority = 'low' | 'medium' | 'high';
type TaskDepartment = 'admin' | 'production' | 'design' | 'sales';

const TASK_STATUSES: {
  value: TaskStatus;
  label: string;
  className: string;
  icon: any;
  description: string;
}[] = [
  {
    value: 'todo',
    label: 'To Do',
    className: 'status-todo',
    icon: ListTodo,
    description: 'Not started yet'
  },
  {
    value: 'in_progress',
    label: 'In Progress',
    className: 'status-in-progress',
    icon: CircleDot,
    description: 'Currently being worked on'
  },
  {
    value: 'completed',
    label: 'Completed',
    className: 'status-completed',
    icon: CheckSquare,
    description: 'Successfully completed'
  },
  {
    value: 'cancelled',
    label: 'Cancelled',
    className: 'status-cancelled',
    icon: XCircle,
    description: 'Cancelled or abandoned'
  },
];

export default function TasksPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<TaskDepartment | 'all'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'due_date' | 'priority' | 'status'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: tasksData, isLoading, refetch } = api.tasks.getAllTasks.useQuery({
    limit,
    offset: page * limit,
    status: statusFilter === 'all' ? undefined : statusFilter,
    priority: priorityFilter === 'all' ? undefined : priorityFilter,
    department: departmentFilter === 'all' ? undefined : departmentFilter,
    search: search || undefined,
    sortBy,
    sortOrder,
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

  const handleDeleteTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTaskMutation.mutate({ id: taskId });
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter('all');
    setPriorityFilter('all');
    setDepartmentFilter('all');
    setSortBy('created_at');
    setSortOrder('desc');
    setPage(0);
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

  // Filter tasks based on search
  const filteredTasks = (tasksData?.tasks as any[] || []).filter((task: any) => {
    const matchesSearch = !search ||
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(search.toLowerCase()));

    return matchesSearch;
  }) || [];

  const tasksByStatus = TASK_STATUSES.map((status) => ({
    ...status,
    count: filteredTasks.filter((t: any) => t.status === status.value).length,
  }));

  const getPriorityClassName = (priority: string | null) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'badge-neutral';
    }
  };

  const getDepartmentClassName = (department: string | null) => {
    switch (department) {
      case 'admin': return 'department-admin';
      case 'production': return 'department-production';
      case 'design': return 'department-design';
      case 'sales': return 'department-sales';
      default: return 'badge-neutral';
    }
  };

  const getStatusConfig = (status: string | null) => {
    return TASK_STATUSES.find(s => s.value === status);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">All Tasks</h1>
          <p className="page-subtitle">Manage and track all tasks across your organization</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/tasks/kanban">
              Kanban View
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/tasks/templates">
              Templates
            </Link>
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </DialogTrigger>
            <TaskCreateForm
              onSuccess={() => {
                setIsCreateDialogOpen(false);
                refetch();
              }}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </Dialog>
        </div>
      </div>

      {/* Task Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {tasksByStatus.map((status) => {
          const StatusIcon = status.icon;
          return (
            <Card key={status.value} className="card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    status.value === 'todo' ? 'bg-warning-muted/20' :
                    status.value === 'in_progress' ? 'bg-info-muted/20' :
                    status.value === 'completed' ? 'bg-success-muted/20' :
                    'bg-destructive-muted/20'
                  }`}>
                    <StatusIcon className={`h-5 w-5 ${
                      status.value === 'todo' ? 'text-warning' :
                      status.value === 'in_progress' ? 'text-info' :
                      status.value === 'completed' ? 'text-success' :
                      'text-destructive'
                    }`} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm page-subtitle">{status.label}</p>
                    <p className="text-xl font-bold text-primary">
                      {status.count}<span className="text-sm font-normal text-secondary ml-1">tasks</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Tasks</CardTitle>
        </CardHeader>
        <CardContent className="card-content-compact">
          <div className="filters-section">
            {/* Search */}
            <div className="search-input-wrapper">
              <Search className="search-icon" aria-hidden="true" />
              <Input
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TaskStatus | 'all')}>
              <SelectTrigger className="filter-select">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {TASK_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as TaskPriority | 'all')}>
              <SelectTrigger className="filter-select">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>

            {/* Department Filter */}
            <Select value={departmentFilter} onValueChange={(value) => setDepartmentFilter(value as TaskDepartment | 'all')}>
              <SelectTrigger className="filter-select">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={clearFilters}
              className="filter-select"
            >
              <Filter className="icon-sm" aria-hidden="true" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Table */}
      {isLoading ? (
        <div className="loading-state">Loading tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="empty-state">
          <Search className="empty-state-icon" aria-hidden="true" />
          <h3 className="empty-state-title">No tasks found</h3>
          <p className="empty-state-description">
            Try adjusting your filters or create a new task to get started.
          </p>
        </div>
      ) : (
        <>
          <div className="data-table-container">
            <Table>
              <TableHeader>
                <TableRow className="data-table-header-row">
                  <TableHead className="data-table-header">Task</TableHead>
                  <TableHead className="data-table-header">Status</TableHead>
                  <TableHead className="data-table-header">Priority</TableHead>
                  <TableHead className="data-table-header">Department</TableHead>
                  <TableHead className="data-table-header">Assigned To</TableHead>
                  <TableHead className="data-table-header">Project</TableHead>
                  <TableHead className="data-table-header">Due Date</TableHead>
                  <TableHead className="data-table-header-actions">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task: any) => {
                  const statusConfig = getStatusConfig(task.status);
                  const assignedUsers = task.assigned_to || [];

                  return (
                    <TableRow
                      key={task.id}
                      className="data-table-row"
                      onClick={() => router.push(`/tasks/${task.id}`)}
                    >
                      <TableCell className="data-table-cell-primary">
                        <div>
                          <span className="font-medium">{task.title}</span>
                          {task.description && (
                            <p className="text-sm text-secondary line-clamp-1 mt-1">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="data-table-cell">
                        {statusConfig && (
                          <Badge variant="outline" className={statusConfig.className}>
                            {statusConfig.label}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="data-table-cell">
                        <Badge variant="outline" className={getPriorityClassName(task.priority)}>
                          {task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className="data-table-cell">
                        <Badge variant="outline" className={getDepartmentClassName(task.department)}>
                          {task.department ? task.department.charAt(0).toUpperCase() + task.department.slice(1) : "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className="data-table-cell">
                        <div className="flex items-center gap-2">
                          {assignedUsers.length > 0 ? (
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
                          ) : (
                            <span className="text-sm">Unassigned</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="data-table-cell">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="icon-xs" aria-hidden="true" />
                          {task.project_id ? "Project Name" : "—"}
                        </div>
                      </TableCell>
                      <TableCell className="data-table-cell">
                        {task.due_date ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="icon-xs" aria-hidden="true" />
                            <span className="text-sm">
                              {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
                            </span>
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="data-table-cell-actions">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="btn-icon">
                              <MoreVertical className="icon-sm" aria-hidden="true" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/tasks/${task.id}`);
                              }}
                              className="dropdown-item"
                            >
                              <Eye className="icon-sm" aria-hidden="true" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="dropdown-item">
                              <Edit className="icon-sm" aria-hidden="true" />
                              Edit Task
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => handleDeleteTask(task.id, e)}
                              className="dropdown-item-danger"
                            >
                              <Trash className="icon-sm" aria-hidden="true" />
                              Delete Task
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {tasksData && tasksData.total > limit && (
            <div className="pagination">
              <div className="pagination-info">
                Showing {page * limit + 1} to {Math.min((page + 1) * limit, tasksData.total)} of {tasksData.total} tasks
              </div>
              <div className="pagination-buttons">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="btn-secondary"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={!tasksData.hasMore}
                  className="btn-secondary"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

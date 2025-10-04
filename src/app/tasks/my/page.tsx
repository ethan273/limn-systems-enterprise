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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  AlertCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { formatDistanceToNow, isAfter, parseISO } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';

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

export default function MyTasksPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("assigned");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'due_date' | 'priority'>('due_date');
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Use real Development User ID - in production this would come from session
  const currentUserId = "f146d819-3eed-43e3-80af-835915a5cc14";

  // Get my assigned tasks
  const { data: assignedTasksData, isLoading: isLoadingAssigned, refetch: refetchAssigned } = api.tasks.getMyTasks.useQuery({
    user_id: currentUserId,
    limit,
    offset: page * limit,
    status: statusFilter === 'all' ? undefined : statusFilter,
    includeWatching: false,
  }, { enabled: activeTab === "assigned" });

  // Get tasks I'm watching
  const { data: watchingTasksData, isLoading: isLoadingWatching, refetch: refetchWatching } = api.tasks.getMyTasks.useQuery({
    user_id: currentUserId,
    limit,
    offset: page * limit,
    status: statusFilter === 'all' ? undefined : statusFilter,
    includeWatching: true,
  }, { enabled: activeTab === "watching" });

  // Get tasks I created
  const { data: createdTasksData, isLoading: isLoadingCreated, refetch: refetchCreated } = api.tasks.getAllTasks.useQuery({
    limit,
    offset: page * limit,
    status: statusFilter === 'all' ? undefined : statusFilter,
    sortBy,
    sortOrder: 'desc',
  }, { enabled: activeTab === "created" });

  const deleteTaskMutation = api.tasks.delete.useMutation({
    onSuccess: () => {
      toast.success("Task deleted successfully");
      refetchAssigned();
      refetchWatching();
      refetchCreated();
    },
    onError: (error: any) => {
      toast.error("Failed to delete task: " + error.message);
    },
  });

  const updateStatusMutation = api.tasks.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Task status updated");
      refetchAssigned();
      refetchWatching();
      refetchCreated();
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

  const clearFilters = () => {
    setSearch("");
    setStatusFilter('all');
    setSortBy('due_date');
    setPage(0);
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

  const getTabCounts = () => {
    const assignedTodo = assignedTasksData?.tasks?.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length || 0;
    const watchingActive = watchingTasksData?.tasks?.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length || 0;
    const createdActive = createdTasksData?.tasks?.filter((t: any) => t.status !== 'completed' && t.status !== 'cancelled').length || 0;

    return { assignedTodo, watchingActive, createdActive };
  };

  const { assignedTodo, watchingActive, createdActive } = getTabCounts();

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

  const renderTasksTable = () => {
    if (isLoading) {
      return <div className="loading-state">Loading your tasks...</div>;
    }

    if (filteredTasks.length === 0) {
      return (
        <div className="empty-state">
          <Search className="empty-state-icon" aria-hidden="true" />
          <h3 className="empty-state-title">No tasks found</h3>
          <p className="empty-state-description">
            {activeTab === "assigned" && "No tasks assigned to you."}
            {activeTab === "watching" && "No tasks you&apos;re watching."}
            {activeTab === "created" && "No tasks created by you."}
          </p>
        </div>
      );
    }

    return (
      <div className="table-container">
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
            const overdueFlag = isOverdue(task.due_date) && task.status !== 'completed' && task.status !== 'cancelled';

            return (
              <TableRow
                key={task.id}
                className="data-table-row"
                onClick={() => router.push(`/tasks/${task.id}`)}
              >
                <TableCell className="data-table-cell-primary">
                  <div className="flex items-center gap-2">
                    <div>
                      <span className="font-medium">{task.title}</span>
                      {task.description && (
                        <p className="text-sm text-secondary line-clamp-1 mt-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                    {overdueFlag && (
                      <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" aria-hidden="true" />
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
                      <span className={cn(
                        "text-sm",
                        overdueFlag ? "text-red-400" : ""
                      )}>
                        {formatDistanceToNow(task.due_date instanceof Date ? task.due_date : parseISO(task.due_date), { addSuffix: true })}
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
                      <DropdownMenuItem
                        onClick={(e) => handleStatusUpdate(task.id, 'in_progress', e)}
                        disabled={task.status === 'in_progress'}
                        className="dropdown-item"
                      >
                        <Clock className="icon-sm" aria-hidden="true" />
                        Start Working
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => handleStatusUpdate(task.id, 'completed', e)}
                        disabled={task.status === 'completed'}
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
    );
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-subtitle">Personal task dashboard and assignment overview</p>
        </div>
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
              refetchAssigned();
              refetchWatching();
              refetchCreated();
            }}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="stat-card-content">
            <div className="stat-card-header">
              <CheckSquare className="stat-card-icon status-in-progress" aria-hidden="true" />
              <div>
                <h3 className="stat-card-title">Assigned Tasks</h3>
                <p className="stat-card-description">Active tasks assigned to you</p>
              </div>
            </div>
            <div className="stat-card-stats">
              <div className="stat-card-stat">
                <span className="text-2xl font-bold">{assignedTodo}</span>
                <span className="text-sm">tasks</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="stat-card-content">
            <div className="stat-card-header">
              <Eye className="stat-card-icon status-completed" aria-hidden="true" />
              <div>
                <h3 className="stat-card-title">Watching</h3>
                <p className="stat-card-description">Tasks you&apos;re following</p>
              </div>
            </div>
            <div className="stat-card-stats">
              <div className="stat-card-stat">
                <span className="text-2xl font-bold">{watchingActive}</span>
                <span className="text-sm">tasks</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="stat-card-content">
            <div className="stat-card-header">
              <AlertCircle className="stat-card-icon priority-medium" aria-hidden="true" />
              <div>
                <h3 className="stat-card-title">Created</h3>
                <p className="stat-card-description">Tasks you&apos;ve created</p>
              </div>
            </div>
            <div className="stat-card-stats">
              <div className="stat-card-stat">
                <span className="text-2xl font-bold">{createdActive}</span>
                <span className="text-sm">tasks</span>
              </div>
            </div>
          </CardContent>
        </Card>
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
            <Select value={statusFilter} onValueChange={(value: TaskStatus | 'all') => setStatusFilter(value)}>
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

            {/* Sort By */}
            <Select value={sortBy} onValueChange={(value: 'created_at' | 'due_date' | 'priority') => setSortBy(value)}>
              <SelectTrigger className="filter-select">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="due_date">Due Date</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="created_at">Created Date</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <Button
              variant="outline"
              onClick={clearFilters}
              className="btn-secondary"
            >
              <Filter className="icon-sm" aria-hidden="true" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Tabs */}
      <Card>
        <CardContent className="pt-6">
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
              {renderTasksTable()}
            </TabsContent>

            <TabsContent value="watching" className="mt-6">
              {renderTasksTable()}
            </TabsContent>

            <TabsContent value="created" className="mt-6">
              {renderTasksTable()}
            </TabsContent>
          </Tabs>

          {/* Pagination */}
          {tasksData && tasksData.total > limit && (
            <div className="pagination mt-6">
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
        </CardContent>
      </Card>
    </div>
  );
}

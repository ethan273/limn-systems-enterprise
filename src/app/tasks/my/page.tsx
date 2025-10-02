"use client";

import { useState } from "react";

// Disable static generation for auth-dependent pages
export const dynamic = 'force-dynamic';
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
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
import TaskStatusSelect from "@/components/TaskStatusSelect";
import TaskPrioritySelect from "@/components/TaskPrioritySelect";
import TaskDepartmentSelect from "@/components/TaskDepartmentSelect";
import TaskAttachments from "@/components/TaskAttachments";
import TaskActivities from "@/components/TaskActivities";
import TaskEntityLinks from "@/components/TaskEntityLinks";
import TaskTimeTracking from "@/components/TaskTimeTracking";
import TaskDependencies from "@/components/TaskDependencies";
import TaskAssignedUsers from "@/components/TaskAssignedUsers";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  CheckSquare,
  Clock,
  MoreVertical,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  X,
  AlertCircle,
  Eye,
  Plus,
  Users,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  Timer,
  Search,
} from "lucide-react";
import { formatDistanceToNow, isAfter, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';
type TaskPriority = 'low' | 'medium' | 'high';
type TaskDepartment = 'admin' | 'production' | 'design' | 'sales';

export default function MyTasksPage() {
  const [activeTab, setActiveTab] = useState("assigned");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'due_date' | 'priority'>('due_date');
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

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

  // Get tasks I created (temporarily using getAllTasks until we add created_by filter)
  const { data: createdTasksData, isLoading: isLoadingCreated, refetch: refetchCreated } = api.tasks.getAllTasks.useQuery({
    limit,
    offset: page * limit,
    status: statusFilter === 'all' ? undefined : statusFilter,
    sortBy,
    sortOrder: 'desc',
  }, { enabled: activeTab === "created" });

  const updateStatusMutation = api.tasks.updateStatus.useMutation({
    onSuccess: () => {
      refetchAssigned();
      refetchWatching();
      refetchCreated();
    },
  });

  const handleStatusUpdate = (taskId: string, newStatus: TaskStatus) => {
    updateStatusMutation.mutate({ id: taskId, status: newStatus });
  };

  const handleTaskUpdate = () => {
    refetchAssigned();
    refetchWatching();
    refetchCreated();
  };

  const toggleTaskExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const handleTaskSelection = (taskId: string, selected: boolean) => {
    setSelectedTasks(prev => {
      if (selected) {
        return [...prev, taskId];
      } else {
        return prev.filter(id => id !== taskId);
      }
    });
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'todo':
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-400" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-400" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-red-400" />;
    }
  };

  const _getStatusBadge = (status: TaskStatus) => {
    const colors = {
      todo: 'bg-gray-500/20 text-gray-400 border-gray-500/20',
      in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
      completed: 'bg-green-500/20 text-green-400 border-green-500/20',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/20',
    };
    return (
      <Badge variant="outline" className={cn("border", Object.prototype.hasOwnProperty.call(colors, status) ? colors[status as keyof typeof colors] : colors.todo)}>
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">
          {status === 'in_progress' ? 'In Progress' : status}
        </span>
      </Badge>
    );
  };

  const _getPriorityBadge = (priority: TaskPriority) => {
    const colors = {
      low: 'bg-green-500/20 text-green-400 border-green-500/20',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20',
      high: 'bg-red-500/20 text-red-400 border-red-500/20',
    };
    return (
      <Badge variant="outline" className={cn("border", Object.prototype.hasOwnProperty.call(colors, priority) ? colors[priority as keyof typeof colors] : colors.low)}>
        {priority.toUpperCase()}
      </Badge>
    );
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

  const getTabCounts = () => {
    const assignedTodo = assignedTasksData?.tasks?.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length || 0;
    const watchingActive = watchingTasksData?.tasks?.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length || 0;
    const createdActive = createdTasksData?.tasks?.filter((t: any) => t.status !== 'completed' && t.status !== 'cancelled').length || 0;

    return { assignedTodo, watchingActive, createdActive };
  };

  const { assignedTodo, watchingActive, createdActive } = getTabCounts();

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

  const renderTasksAccordion = () => (
    <div className="space-y-2">
      {(activeTab === "created" ? tasksData?.tasks : tasksData?.tasks)?.map((task: any) => {
        const isExpanded = expandedTasks.has(task.id);
        const assignedUsers = task.assigned_to || [];

        return (
          <Collapsible key={task.id} open={isExpanded} onOpenChange={() => toggleTaskExpanded(task.id)}>
            <div className="list-item">
              {/* Main Task Row */}
              <CollapsibleTrigger asChild>
                <div className="p-4 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Task Selection Checkbox */}
                      <div className="flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={selectedTasks.includes(task.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleTaskSelection(task.id, e.target.checked);
                          }}
                          className="rounded"
                        />
                      </div>

                      {/* Expand Icon */}
                      <div className="flex-shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>

                      {/* Task Info */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-medium text-primary truncate">{task.title}</h3>
                              {isOverdue(task.due_date) && task.status !== 'completed' && task.status !== 'cancelled' && (
                                <AlertTriangle className="h-4 w-4 text-red-400" />
                              )}
                              {/* Assigned Users - moved next to title for prominence */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Users className="h-4 w-4" />
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
                            </div>
                            {task.description && (
                              <p className="text-sm text-secondary line-clamp-2 mt-1">
                                {task.description}
                              </p>
                            )}
                          </div>

                          {/* Status, Priority, Department - Mobile responsive */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <TaskStatusSelect
                              taskId={task.id}
                              currentStatus={task.status as TaskStatus}
                              onUpdate={handleTaskUpdate}
                            />
                            <TaskPrioritySelect
                              taskId={task.id}
                              currentPriority={task.priority as TaskPriority}
                              onUpdate={handleTaskUpdate}
                            />
                            <TaskDepartmentSelect
                              taskId={task.id}
                              currentDepartment={task.department as TaskDepartment}
                              onUpdate={handleTaskUpdate}
                            />
                          </div>
                        </div>

                        {/* Bottom Row - Project, Time Tracking */}
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 text-sm">
                            {/* Project */}
                            <div className="flex items-center gap-2">
                              <FolderOpen className="h-4 w-4" />
                              <span>
                                {task.project_id ? "Project Name" : "No project"}
                              </span>
                            </div>

                            {/* Time Tracking */}
                            <div className="flex items-center gap-2">
                              <Timer className="h-4 w-4" />
                              <span>
                                {task.estimated_hours ? `${task.estimated_hours}h est` : "No estimate"}
                                {task.actual_hours ? ` / ${task.actual_hours}h actual` : ""}
                              </span>
                            </div>
                          </div>

                          {/* Dates and Actions */}
                          <div className="flex items-center gap-4 text-sm">
                            {task.due_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span className={cn(
                                  isOverdue(task.due_date) && task.status !== 'completed' && task.status !== 'cancelled' ? "text-red-400" : ""
                                )}>
                                  {formatDistanceToNow(task.due_date instanceof Date ? task.due_date : parseISO(task.due_date), { addSuffix: true })}
                                </span>
                              </div>
                            )}

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleStatusUpdate(task.id, 'in_progress')}
                                  disabled={task.status === 'in_progress'}
                                >
                                  <Clock className="h-4 w-4 mr-2" />
                                  Start Working
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleStatusUpdate(task.id, 'completed')}
                                  disabled={task.status === 'completed'}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Mark Complete
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-sm">
                                  Edit Task
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-sm">
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-sm text-red-400">
                                  Delete Task
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Tags */}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {task.tags.slice(0, 5).map((tag: any, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {task.tags.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{task.tags.length - 5} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>

              {/* Expandable Content */}
              <CollapsibleContent>
                <Separator />
                <div className="p-4 pt-6">
                  {/* Primary content grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {/* Attachments */}
                    <TaskAttachments
                      taskId={task.id}
                      onUpdate={handleTaskUpdate}
                    />

                    {/* Recent Activity */}
                    <TaskActivities
                      taskId={task.id}
                      onUpdate={handleTaskUpdate}
                    />

                    {/* Entity Links */}
                    <TaskEntityLinks
                      taskId={task.id}
                      onUpdate={handleTaskUpdate}
                    />
                  </div>

                  {/* Secondary content grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Time Tracking */}
                    <TaskTimeTracking
                      taskId={task.id}
                      onUpdate={handleTaskUpdate}
                    />

                    {/* Dependencies */}
                    <TaskDependencies
                      taskId={task.id}
                      onUpdate={handleTaskUpdate}
                    />
                  </div>
                  {/* User Management section */}
                  <div className="grid grid-cols-1 gap-6 mt-6">
                    {/* Assigned Users */}
                    <TaskAssignedUsers
                      taskId={task.id}
                      assignedUsers={task.assigned_to || []}
                      onUpdate={handleTaskUpdate}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}

      {(activeTab === "created" ? tasksData?.tasks : tasksData?.tasks)?.length === 0 && (
        <div className="empty-state">
          <div className="mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="empty-state-title">No tasks found</h3>
          <p className="empty-state-description">
            {activeTab === "assigned" && "No tasks assigned to you."}
            {activeTab === "watching" && "No tasks you're watching."}
            {activeTab === "created" && "No tasks created by you."}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-subtitle">
            Personal task dashboard and assignment overview
          </p>
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
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedTodo}</div>
            <p className="text-xs mt-1">
              Active tasks assigned to you
            </p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Watching</CardTitle>
            <Eye className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{watchingActive}</div>
            <p className="text-xs mt-1">
              Tasks you&apos;re following
            </p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
            <AlertCircle className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{createdActive}</div>
            <p className="text-xs mt-1">
              Tasks you&apos;ve created
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="filters-section">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={(value: TaskStatus | 'all') => setStatusFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="todo">Todo</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: 'created_at' | 'due_date' | 'priority') => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="due_date">Due Date</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="created_at">Created Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Tabs */}
      <Card className="card">
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
              {renderTasksAccordion()}
            </TabsContent>

            <TabsContent value="watching" className="mt-6">
              {renderTasksAccordion()}
            </TabsContent>

            <TabsContent value="created" className="mt-6">
              {renderTasksAccordion()}
            </TabsContent>
          </Tabs>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <div>Loading your tasks...</div>
            </div>
          )}

          {/* Pagination */}
          {tasksData && tasksData.total > limit && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm">
                Showing {page * limit + 1} to {Math.min((page + 1) * limit, tasksData.total)} of {tasksData.total} tasks
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={!tasksData.hasMore}
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
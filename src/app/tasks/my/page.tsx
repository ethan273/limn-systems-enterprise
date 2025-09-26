"use client";

import { useState } from "react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  // Get my assigned tasks
  const { data: assignedTasksData, isLoading: isLoadingAssigned, refetch: refetchAssigned } = api.tasks.getMyTasks.useQuery({
    limit,
    offset: page * limit,
    status: statusFilter === 'all' ? undefined : statusFilter,
    includeWatching: false,
  }, { enabled: activeTab === "assigned" });

  // Get tasks I'm watching
  const { data: watchingTasksData, isLoading: isLoadingWatching, refetch: refetchWatching } = api.tasks.getMyTasks.useQuery({
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

  const getStatusBadge = (status: TaskStatus) => {
    const colors = {
      todo: 'bg-gray-500/20 text-gray-400 border-gray-500/20',
      in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
      completed: 'bg-green-500/20 text-green-400 border-green-500/20',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/20',
    };
    return (
      <Badge variant="outline" className={cn("border", colors[status])}>
        {getStatusIcon(status)}
        <span className="ml-1 capitalize">
          {status === 'in_progress' ? 'In Progress' : status}
        </span>
      </Badge>
    );
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    const colors = {
      low: 'bg-green-500/20 text-green-400 border-green-500/20',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20',
      high: 'bg-red-500/20 text-red-400 border-red-500/20',
    };
    return (
      <Badge variant="outline" className={cn("border", colors[priority])}>
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

  const renderTasksTable = () => (
    <div className="rounded-md border border-gray-700">
      <Table>
        <TableHeader>
          <TableRow className="border-gray-700">
            <TableHead className="text-gray-300">Task</TableHead>
            <TableHead className="text-gray-300">Status</TableHead>
            <TableHead className="text-gray-300">Priority</TableHead>
            <TableHead className="text-gray-300">Department</TableHead>
            <TableHead className="text-gray-300">Due Date</TableHead>
            <TableHead className="text-gray-300 w-12">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(activeTab === "created" ? tasksData?.tasks : tasksData?.tasks)?.map((task: any) => (
            <TableRow key={task.id} className={cn(
              "border-gray-700 hover:bg-gray-800/50 h-16",
              isOverdue(task.due_date) && task.status !== 'completed' && task.status !== 'cancelled' && "bg-red-500/10"
            )}>
              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-white">{task.title}</div>
                    {isOverdue(task.due_date) && task.status !== 'completed' && task.status !== 'cancelled' && (
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                  {task.description && (
                    <div className="text-sm text-gray-400 line-clamp-2">
                      {task.description}
                    </div>
                  )}
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {task.tags.slice(0, 2).map((tag: any, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {task.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">+{task.tags.length - 2}</Badge>
                      )}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(task.status as TaskStatus)}</TableCell>
              <TableCell>{getPriorityBadge(task.priority as TaskPriority)}</TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-gray-300">
                  {(task.department as TaskDepartment).charAt(0).toUpperCase() + (task.department as TaskDepartment).slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                {task.due_date ? (
                  <div className={cn(
                    "flex items-center gap-2",
                    isOverdue(task.due_date) && task.status !== 'completed' && task.status !== 'cancelled' ? "text-red-400" : "text-gray-400"
                  )}>
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">
                      {formatDistanceToNow(task.due_date instanceof Date ? task.due_date : parseISO(task.due_date), { addSuffix: true })}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400">No due date</span>
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
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
                    <DropdownMenuItem disabled>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {(activeTab === "created" ? tasksData?.tasks : tasksData?.tasks)?.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                {activeTab === "assigned" && "No tasks assigned to you."}
                {activeTab === "watching" && "No tasks you're watching."}
                {activeTab === "created" && "No tasks created by you."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Tasks</h1>
          <p className="text-gray-400">
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
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Assigned Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{assignedTodo}</div>
            <p className="text-xs text-gray-400 mt-1">
              Active tasks assigned to you
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Watching</CardTitle>
            <Eye className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{watchingActive}</div>
            <p className="text-xs text-gray-400 mt-1">
              Tasks you're following
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Created</CardTitle>
            <AlertCircle className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{createdActive}</div>
            <p className="text-xs text-gray-400 mt-1">
              Tasks you've created
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800 border-gray-700">
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
      <Card className="bg-gray-800 border-gray-700">
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

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="text-gray-400">Loading your tasks...</div>
            </div>
          )}

          {/* Pagination */}
          {tasksData && tasksData.total > limit && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-400">
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
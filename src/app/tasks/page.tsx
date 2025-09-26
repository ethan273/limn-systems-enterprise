"use client";

import { useState } from "react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  Calendar,
  ChevronDown,
  ChevronUp,
  Users,
  FolderOpen,
  Timer,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';
type TaskPriority = 'low' | 'medium' | 'high';
type TaskDepartment = 'admin' | 'production' | 'design' | 'sales';

export default function TasksPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<TaskDepartment | 'all'>('all');
  const [sortBy, setSortBy] = useState<'created_at' | 'due_date' | 'priority' | 'status'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

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

  const handleTaskUpdate = () => {
    refetch();
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

  // Mock users data - in production this would come from a users API
  const mockUsers: Record<string, { name: string; initials: string; avatar: string | null }> = {
    "550e8400-e29b-41d4-a716-446655440000": {
      name: "John Doe",
      initials: "JD",
      avatar: null
    },
    "660e8400-e29b-41d4-a716-446655440001": {
      name: "Jane Smith",
      initials: "JS",
      avatar: null
    },
    "770e8400-e29b-41d4-a716-446655440002": {
      name: "Mike Johnson",
      initials: "MJ",
      avatar: null
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">All Tasks</h1>
          <p className="text-secondary">
            Manage and track all tasks across your organization
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
              refetch();
            }}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </Dialog>
      </div>

      {/* Filters and Search */}
      <Card className="bg-gray-800 border-gray-700 filters-section">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search tasks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
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

            {/* Priority Filter */}
            <Select value={priorityFilter} onValueChange={(value: TaskPriority | 'all') => setPriorityFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>

            {/* Department Filter */}
            <Select value={departmentFilter} onValueChange={(value: TaskDepartment | 'all') => setDepartmentFilter(value)}>
              <SelectTrigger className="w-40">
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

            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">Sort by:</span>
            <Select value={sortBy} onValueChange={(value: 'created_at' | 'due_date' | 'priority' | 'status') => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Created Date</SelectItem>
                <SelectItem value="due_date">Due Date</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Newest First</SelectItem>
                <SelectItem value="asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Accordion */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              Tasks ({tasksData?.total || 0})
            </span>
            {isLoading && (
              <div className="text-sm text-gray-400">Loading...</div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tasksData?.tasks?.map((task) => {
              const isExpanded = expandedTasks.has(task.id);
              const assignedUsers = task.assigned_to || [];

              return (
                <Collapsible key={task.id} open={isExpanded} onOpenChange={() => toggleTaskExpanded(task.id)}>
                  <div className="border border-gray-700 rounded-lg bg-gray-800/50 hover:bg-gray-700/30 transition-colors">
                    {/* Main Task Row */}
                    <CollapsibleTrigger asChild>
                      <div className="p-4 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            {/* Expand Icon */}
                            <div className="flex-shrink-0">
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-gray-400" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                              )}
                            </div>

                            {/* Task Info */}
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex items-start gap-3">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium text-primary truncate">{task.title}</h3>
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

                              {/* Bottom Row - Assigned To, Project, Time Tracking */}
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                  {/* Assigned To */}
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    {assignedUsers.length > 0 ? (
                                      <div className="flex items-center gap-1">
                                        <div className="flex -space-x-1">
                                          {assignedUsers.slice(0, 3).map((userId) => {
                                            const user = mockUsers[userId] || { name: "Unknown", initials: "?", avatar: null };
                                            return (
                                              <Avatar key={userId} className="h-6 w-6 border border-gray-600">
                                                <AvatarImage src={user.avatar || undefined} />
                                                <AvatarFallback className="text-xs bg-gray-600">
                                                  {user.initials}
                                                </AvatarFallback>
                                              </Avatar>
                                            );
                                          })}
                                        </div>
                                        {assignedUsers.length > 3 && (
                                          <span className="text-xs text-gray-500">+{assignedUsers.length - 3}</span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-gray-500">Unassigned</span>
                                    )}
                                  </div>

                                  {/* Project */}
                                  <div className="flex items-center gap-2">
                                    <FolderOpen className="h-4 w-4" />
                                    <span className="text-gray-500">
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
                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                  {task.due_date && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-4 w-4" />
                                      <span>
                                        {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
                                      </span>
                                    </div>
                                  )}

                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="hover:bg-gray-600"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <MoreVertical className="h-4 w-4 text-gray-400" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
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
                                  {task.tags.slice(0, 5).map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs text-tertiary border-gray-600">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {task.tags.length > 5 && (
                                    <Badge variant="outline" className="text-xs text-tertiary border-gray-600">
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
                      <Separator className="bg-gray-700" />
                      <div className="p-4 pt-6 bg-gray-800/80">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}

            {tasksData?.tasks?.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <div className="mb-4">
                  <Search className="h-12 w-12 mx-auto text-gray-600" />
                </div>
                <h3 className="text-lg font-medium mb-2">No tasks found</h3>
                <p className="text-sm">Try adjusting your filters or create a new task to get started.</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {tasksData && tasksData.total > limit && (
            <div className="flex items-center justify-between mt-4">
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
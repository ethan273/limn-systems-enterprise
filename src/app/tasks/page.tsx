"use client";

import { useState } from "react";

// Disable static generation for auth-dependent pages
export const dynamic = 'force-dynamic';
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import TaskAdvancedFilters from "@/components/TaskAdvancedFilters";
import TaskBulkOperations from "@/components/TaskBulkOperations";
import TaskTimeTracking from "@/components/TaskTimeTracking";
import TaskDependencies from "@/components/TaskDependencies";
import TaskAssignedUsers from "@/components/TaskAssignedUsers";
import TaskNotifications from "@/components/TaskNotifications";
import {
  Search,
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
import Link from "next/link";

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
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [showBulkOps, setShowBulkOps] = useState(false);

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

  const handleTaskSelection = (taskId: string, selected: boolean) => {
    setSelectedTasks(prev => {
      if (selected) {
        const newSelection = [...prev, taskId];
        setShowBulkOps(newSelection.length > 0);
        return newSelection;
      } else {
        const newSelection = prev.filter(id => id !== taskId);
        setShowBulkOps(newSelection.length > 0);
        return newSelection;
      }
    });
  };

  const handleFiltersChange = (filters: any) => {
    // Here you would apply the filters to the query
    console.log('Applying filters:', filters);
    refetch();
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


  const _clearFilters = () => {
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
        <div className="flex items-center gap-2">
          <TaskNotifications />
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

      {/* Advanced Filters */}
      <TaskAdvancedFilters
        onFiltersChange={handleFiltersChange}
        taskCount={tasksData?.total || 0}
      />

      {/* Bulk Operations */}
      {showBulkOps && (
        <TaskBulkOperations
          tasks={tasksData?.tasks?.map(task => ({
            id: task.id,
            title: task.title,
            status: task.status || 'todo',
            priority: task.priority || 'medium',
            department: task.department || 'admin'
          })) || []}
          selectedTasks={selectedTasks}
          onSelectionChange={setSelectedTasks}
          onBulkComplete={() => {
            refetch();
            setSelectedTasks([]);
            setShowBulkOps(false);
          }}
        />
      )}

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
                                <ChevronUp className="h-4 w-4 text-gray-400" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                              )}
                            </div>

                            {/* Task Info */}
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex items-start gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-medium text-primary truncate">{task.title}</h3>
                                    {/* Assigned Users - moved next to title for prominence */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <Users className="h-4 w-4 text-gray-400" />
                                      {assignedUsers.length > 0 ? (
                                        <div className="flex items-center gap-1">
                                          <div className="flex -space-x-1">
                                            {assignedUsers.slice(0, 3).map((userId) => {
                                              const user = Object.prototype.hasOwnProperty.call(usersMap, userId) ? usersMap[userId as keyof typeof usersMap] : null;
                                              const initials = user ? (
                                                user.full_name ?
                                                  user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) :
                                                  user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                                              ) : "?";
                                              return (
                                                <Avatar key={userId} className="h-6 w-6 border border-gray-600">
                                                  <AvatarImage src={user?.avatar_url || undefined} />
                                                  <AvatarFallback className="text-xs bg-gray-600">
                                                    {initials}
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
                                        <span className="text-gray-500 text-sm">Unassigned</span>
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
                                <div className="flex items-center gap-4 text-sm text-gray-400">
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